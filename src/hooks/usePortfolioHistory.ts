import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePortfolio } from '@/context/PortfolioContext';

export interface PortfolioDailySnapshot {
    id: number;
    record_date: string;
    total_investment: number;
    total_valuation: number;
    assets_snapshot: any[];
}

export interface InvestmentHistoryRow {
    date: string;
    investmentAmount: number;
    diffFromPrev: number;
    usageText: string;
}

export interface ValuationHistoryRow {
    date: string;
    valuationAmount: number;
    diffFromPrev: number;
    summaryText: string;
}

export function usePortfolioHistory() {
    const { user, assets, exchangeRate } = usePortfolio();
    const [historyData, setHistoryData] = useState<PortfolioDailySnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            const supabase = createClient();
            
            const { data, error } = await supabase
                .from('portfolio_daily_history')
                .select('*')
                .eq('user_id', user.id)
                .order('record_date', { ascending: true }); // 과거부터 오름차순
            
            if (!error && data) {
                setHistoryData(data as PortfolioDailySnapshot[]);
            } else {
                console.error("포트폴리오 기록 조회 실패:", error);
            }
            setIsLoading(false);
        };

        fetchHistory();
    }, [user]);

    // 과거 이력의 평가금과 투자금을 현재 환율(오늘 환율 기준)로 일괄 재계산
    // 환율 변동으로 인한 투자금액 변동성을 제거하고 기준을 통일하기 위함
    const processedHistory = useMemo(() => {
        const currentExRate = exchangeRate || 1350;
        return historyData.map(snap => {
            let total_investment = 0;
            let total_valuation = 0;
            
            if (snap.assets_snapshot && snap.assets_snapshot.length > 0) {
                snap.assets_snapshot.forEach((asset: any) => {
                    const exRateMultiplier = asset.category === 'US' ? currentExRate : 1;
                    total_investment += asset.buy_price * asset.quantity * exRateMultiplier;
                    total_valuation += asset.current_price * asset.quantity * exRateMultiplier;
                });
            } else {
                total_investment = snap.total_investment;
                total_valuation = snap.total_valuation;
            }
            
            return {
                ...snap,
                total_investment,
                total_valuation
            };
        });
    }, [historyData, exchangeRate]);

    // 투자금액 히스토리 전처리 함수
    const getInvestmentHistory = (): InvestmentHistoryRow[] => {
        const rows: InvestmentHistoryRow[] = [];
        
        for (let i = 0; i < processedHistory.length; i++) {
            const current = processedHistory[i];
            const prev = i > 0 ? processedHistory[i - 1] : null;
            const diff = prev ? current.total_investment - prev.total_investment : 0;
            
            let usageText = '-';

            // 증감이 발생했을 때, 해당 날짜의 "BUY" 매수 기록을 찾아 요약 (assets 상태 활용)
            if (diff !== 0) {
                // 당일의 trade_logs 중 BUY 찾기
                const todayBuys: string[] = [];
                assets.forEach(asset => {
                    const buysOnDate = asset.trades?.filter(
                        t => t.type === 'BUY' && t.date === current.record_date
                    ) || [];
                    
                    if (buysOnDate.length > 0) {
                        const totalQty = buysOnDate.reduce((sum, t) => sum + t.quantity, 0);
                        todayBuys.push(`${asset.name} ${totalQty}주`);
                    }
                });
                
                if (todayBuys.length > 0) {
                    usageText = todayBuys.join(', ') + (diff > 0 ? ' 매수' : ' (부분 매도/입출금 추정)');
                } else if (diff > 0) {
                     usageText = '추가 납입 (알려지지 않은 거래)';
                } else if (diff < 0) {
                     usageText = '출금 (또는 매도)';
                }
            }

            rows.push({
                date: current.record_date,
                investmentAmount: current.total_investment,
                diffFromPrev: diff,
                usageText
            });
        }
        
        // 최신 내용이 위로 가도록 역순 반환
        return rows.reverse();
    };

    // 평가금액 히스토리 전처리 함수
    const getValuationHistory = (): ValuationHistoryRow[] => {
        const rows: ValuationHistoryRow[] = [];
        
        for (let i = 0; i < processedHistory.length; i++) {
            const current = processedHistory[i];
            const prev = i > 0 ? processedHistory[i - 1] : null;
            
            const valuationDiff = prev ? current.total_valuation - prev.total_valuation : 0;
            const investmentDiff = prev ? current.total_investment - prev.total_investment : 0;
            // 순수 평가손익 = 종합 자산 변동액 - 투자 원금 변동액 (입출금)
            const diff = prev ? valuationDiff - investmentDiff : 0;
            
            let summaryText = '-';

            // 등락 종목 요약
            if (prev && current.assets_snapshot && prev.assets_snapshot) {
                const prevMap = new Map(prev.assets_snapshot.map(a => [a.symbol, a]));
                const currMap = new Map(current.assets_snapshot.map(a => [a.symbol, a]));
                
                const changes: { name: string, changeAmt: number }[] = [];
                const failed: string[] = [];
                
                currMap.forEach((currAsset, symbol) => {
                    if (currAsset.is_failed) {
                        failed.push(currAsset.name);
                        return; // 실패한 에셋은 평가 변동액 계산에서 스킵
                    }
                    const prevAsset = prevMap.get(symbol);
                    if (prevAsset && !prevAsset.is_failed) {
                        const amtDiff = currAsset.valuation_krw - prevAsset.valuation_krw;
                        if (Math.abs(amtDiff) > 100) { // 미세변동 무시
                            changes.push({ name: currAsset.name, changeAmt: amtDiff });
                        }
                    } else {
                        // 신규 발생 종목 (당일 매수로 인한 Valuation 신규)
                        changes.push({ name: currAsset.name, changeAmt: currAsset.valuation_krw - currAsset.invested_krw });
                    }
                });

                // 변동폭 큰 순서대로 내림차순 정렬 (절댓값 기준 상위 노출)
                changes.sort((a, b) => Math.abs(b.changeAmt) - Math.abs(a.changeAmt));
                
                const summaryParts: string[] = [];

                if (failed.length > 0) {
                     // 실패 종목 알림 (최대 2개 표기, 나머지는 외 N종목)
                     const failedText = failed.slice(0, 2).join(', ') + (failed.length > 2 ? ` 외 ${failed.length - 2}종목` : '');
                     summaryParts.push(`⚠️ ${failedText} (조회실패-전일가격유지)`);
                }

                if (changes.length > 0) {
                    // 최대 3개까지만 요약
                    const topChanges = changes.slice(0, 3).map(c => {
                        const mark = c.changeAmt > 0 ? '▲' : '▼';
                        const absM = Math.round(Math.abs(c.changeAmt) / 10000); // 만원 단위로 변환
                        return `${c.name}(${mark}${absM}만)`;
                    });
                    
                    let partsText = topChanges.join(', ');
                    if (changes.length > 3) {
                        partsText += ` 외 ${changes.length - 3}종목`;
                    }
                    summaryParts.push(partsText);
                }
                
                if (summaryParts.length > 0) {
                    summaryText = summaryParts.join(' | ');
                }
            }

            rows.push({
                date: current.record_date,
                valuationAmount: current.total_valuation,
                diffFromPrev: diff,
                summaryText
            });
        }

        return rows.reverse();
    };

    return {
        isLoading,
        investmentHistory: getInvestmentHistory(),
        valuationHistory: getValuationHistory(),
    };
}
