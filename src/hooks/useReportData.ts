import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePortfolio } from '@/context/PortfolioContext';

export interface ReportSnapshot {
    date: string;
    total_investment: number;
    total_valuation: number;
}

export interface ChartDataPoint {
    date: string;
    investment: number;
    valuation: number;
    cumulativeProfit: number;
    dailyProfitChange: number;
}

export interface TradeLogWithAsset {
    id: number;
    trade_date: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND';
    price: number;
    quantity: number;
    memo?: string;
    symbol: string;
    name: string;
    // 매도 시 수익 정보
    avgBuyPrice?: number;
    sellProfit?: number;
    sellProfitRate?: number;
}

export function useReportData(startDate: string, endDate: string) {
    const { user, exchangeRate } = usePortfolio();
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [tradeLogs, setTradeLogs] = useState<TradeLogWithAsset[]>([]);
    const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !startDate || !endDate) {
            return;
        }

        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createClient();
            
            try {
                // 1. 동적 재구성 API 우선 시도, 실패 시 DB 폴백
                const currentExRate = exchangeRate || 1350;
                let histData: any[] = [];
                
                try {
                    const res = await fetch(`/api/report/dynamic-history?startDate=${startDate}&endDate=${endDate}&exchangeRate=${currentExRate}`);
                    if (res.ok) {
                        const dynamicData = await res.json();
                        if (dynamicData.data && Array.isArray(dynamicData.data) && dynamicData.data.length > 0) {
                            histData = dynamicData.data;
                            setFailedSymbols(dynamicData.failedSymbols || []);
                            console.log(`[ReportData] Dynamic history loaded: ${dynamicData.data.length} points`);
                        } else if (Array.isArray(dynamicData) && dynamicData.length > 0) {
                            // 하위호환
                            histData = dynamicData;
                        }
                    } else {
                        const errBody = await res.text();
                        console.error("[ReportData] Dynamic history API error:", res.status, errBody);
                        if (res.status === 400 && errBody.includes('100')) {
                            alert('조회 기간은 100일을 초과할 수 없습니다.');
                        }
                    }
                } catch (err) {
                    console.error("[ReportData] Dynamic history fetch failed:", err);
                }

                // 기존 DB 스냅샷 폴백 삭제 (dynamic-history가 캐시 역할을 겸하도록 백엔드에서 처리)

                // 2. Fetch ALL Trade Logs up to endDate (매도 수익 계산을 위해 전체 이력 필요)
                const { data: allTradesRaw, error: tradeError } = await supabase
                    .from('trade_logs')
                    .select('*, portfolios(symbol, name)')
                    .eq('user_id', user.id)
                    .lte('trade_date', endDate)
                    .order('trade_date', { ascending: true });

                if (tradeError) throw tradeError;

                if (isMounted) {
                    setHistoryData(histData || []);
                    
                    // 전체 거래를 날짜순으로 정렬
                    const allTrades = (allTradesRaw || []).sort((a: any, b: any) => 
                        a.trade_date.localeCompare(b.trade_date) || a.id - b.id
                    );
                    
                    // 종목별 보유 현황 (평균단가 계산용)
                    const holdings: Record<string, { quantity: number; totalCost: number }> = {};
                    
                    // 전체 이력을 순회하며 평균단가 계산, 조회 기간 내 거래만 결과에 포함
                    const formattedTrades: TradeLogWithAsset[] = [];
                    
                    allTrades.forEach((t: any) => {
                        const symbol = t.portfolios?.symbol || '';
                        const name = t.portfolios?.name || 'Unknown';
                        
                        if (!holdings[symbol]) holdings[symbol] = { quantity: 0, totalCost: 0 };
                        
                        let avgBuyPrice: number | undefined;
                        let sellProfit: number | undefined;
                        let sellProfitRate: number | undefined;
                        
                        if (t.type === 'BUY') {
                            holdings[symbol].quantity += t.quantity;
                            holdings[symbol].totalCost += t.price * t.quantity;
                        } else if (t.type === 'SELL') {
                            // 매도 시점의 평균 매입단가
                            avgBuyPrice = holdings[symbol].quantity > 0 
                                ? holdings[symbol].totalCost / holdings[symbol].quantity 
                                : 0;
                            // 매도 수익금 = (매도가 - 평균매입가) × 수량
                            sellProfit = (t.price - avgBuyPrice) * t.quantity;
                            // 매도 수익률 = (매도가 - 평균매입가) / 평균매입가 × 100
                            sellProfitRate = avgBuyPrice > 0 
                                ? ((t.price - avgBuyPrice) / avgBuyPrice) * 100 
                                : 0;
                            // 보유 수량/비용 업데이트
                            if (holdings[symbol].quantity > 0) {
                                const costPerShare = holdings[symbol].totalCost / holdings[symbol].quantity;
                                holdings[symbol].totalCost -= costPerShare * t.quantity;
                                holdings[symbol].quantity -= t.quantity;
                            }
                        }
                        // DIVIDEND는 보유 현황에 영향 없음
                        
                        // 조회 기간 내 거래만 결과에 포함
                        if (t.trade_date >= startDate) {
                            formattedTrades.push({
                                id: t.id,
                                trade_date: t.trade_date,
                                type: t.type,
                                price: t.price,
                                quantity: t.quantity,
                                memo: t.memo,
                                symbol,
                                name,
                                avgBuyPrice,
                                sellProfit,
                                sellProfitRate,
                            });
                        }
                    });
                    
                    // 날짜 내림차순으로 정렬 (표시용)
                    formattedTrades.sort((a, b) => b.trade_date.localeCompare(a.trade_date));
                    setTradeLogs(formattedTrades);
                }
            } catch (err) {
                console.error("Failed to fetch report data:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [user, startDate, endDate]);

    // Process Chart Data
    const chartData = useMemo(() => {
        if (historyData.length === 0) return [];
        
        const currentExRate = exchangeRate || 1350;

        // Apply exchange rate to normalize data as usePortfolioHistory does
        const rawNormalized = historyData.map(snap => {
            let total_investment = 0;
            let total_valuation = 0;
            
            if (snap.assets_snapshot && snap.assets_snapshot.length > 0) {
                snap.assets_snapshot.forEach((asset: any) => {
                    const exRateMultiplier = asset.category === 'US' ? currentExRate : 1;
                    total_investment += asset.buy_price * asset.quantity * exRateMultiplier;
                    total_valuation += asset.current_price * asset.quantity * exRateMultiplier;
                });
            } else {
                total_investment = snap.total_investment || 0;
                total_valuation = snap.total_valuation || 0;
            }
            
            return {
                date: snap.record_date || snap.date,
                total_investment,
                total_valuation
            };
        });

        // 빈 날짜(주말/공휴일 등)를 이전 데이터로 채워 차트의 X축 간격을 실제 시간 비례로 맞춤
        const normalized: any[] = [];
        if (rawNormalized.length > 0) {
            rawNormalized.sort((a, b) => a.date.localeCompare(b.date));
            const startStr = rawNormalized[0].date;
            const endStr = rawNormalized[rawNormalized.length - 1].date;
            
            let currentStr = startStr;
            let dataIdx = 0;
            let lastData = rawNormalized[0];

            while (currentStr <= endStr) {
                while (dataIdx < rawNormalized.length && rawNormalized[dataIdx].date <= currentStr) {
                    lastData = rawNormalized[dataIdx];
                    dataIdx++;
                }

                normalized.push({
                    date: currentStr,
                    total_investment: lastData.total_investment,
                    total_valuation: lastData.total_valuation
                });

                const d = new Date(currentStr);
                d.setDate(d.getDate() + 1);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                currentStr = `${year}-${month}-${day}`;
            }
        }

        // Calculate Profit Diff based on the FIRST day of the period
        const baseInvestment = normalized[0].total_investment;
        const baseValuation = normalized[0].total_valuation;

        const results: ChartDataPoint[] = [];

        for (let i = 0; i < normalized.length; i++) {
            const current = normalized[i];
            const prev = i > 0 ? normalized[i - 1] : null;

            // 누적 수익금: (오늘 평가금 - 기준일 평가금) - (오늘 투자금 - 기준일 투자금: 순입출금)
            const valuationDiff = current.total_valuation - baseValuation;
            const investmentDiff = current.total_investment - baseInvestment;
            const cumulativeProfit = valuationDiff - investmentDiff;

            // 전일 대비 일일 손익
            let dailyProfitChange = 0;
            if (prev) {
                 const dailyValDiff = current.total_valuation - prev.total_valuation;
                 const dailyInvDiff = current.total_investment - prev.total_investment;
                 dailyProfitChange = dailyValDiff - dailyInvDiff;
            }

            results.push({
                date: current.date,
                investment: current.total_investment,
                valuation: current.total_valuation,
                cumulativeProfit,
                dailyProfitChange
            });
        }

        return results;
    }, [historyData, exchangeRate]);

    return {
        isLoading,
        historyData,
        chartData,
        tradeLogs,
        failedSymbols
    };
}
