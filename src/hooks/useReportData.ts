import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePortfolio } from '@/context/PortfolioContext';
import { getDynamicValuationHistory } from '@/app/report/actions';

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
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    memo?: string;
    symbol: string;
    name: string;
}

export function useReportData(startDate: string, endDate: string) {
    const { user, exchangeRate } = usePortfolio();
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [tradeLogs, setTradeLogs] = useState<TradeLogWithAsset[]>([]);
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
                // 1. Fetch History Data dynamically via Report Engine
                const currentExRate = exchangeRate || 1350;
                let histData: any[] = [];
                try {
                    histData = await getDynamicValuationHistory(startDate, endDate, currentExRate);
                } catch (err) {
                    console.error("Failed to generate dynamic history:", err);
                }

                // 2. Fetch Trade Logs
                const { data: trades, error: tradeError } = await supabase
                    .from('trade_logs')
                    .select('*, portfolios(symbol, name)')
                    .eq('user_id', user.id)
                    .gte('trade_date', startDate)
                    .lte('trade_date', endDate)
                    .order('trade_date', { ascending: false });

                if (tradeError) throw tradeError;

                if (isMounted) {
                    setHistoryData(histData || []);
                    
                    const formattedTrades = (trades || []).map((t: any) => ({
                        id: t.id,
                        trade_date: t.trade_date,
                        type: t.type,
                        price: t.price,
                        quantity: t.quantity,
                        memo: t.memo,
                        symbol: t.portfolios?.symbol || '',
                        name: t.portfolios?.name || 'Unknown',
                    }));
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
        const normalized = historyData.map(snap => {
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
        chartData,
        tradeLogs
    };
}
