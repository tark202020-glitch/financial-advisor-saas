'use client';

import { useState, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';

interface Advice {
    id: number;
    category: string;
    text: string;
}

export default function AiGuruBlock() {
    const { assets, isLoading: isPortfolioLoading } = usePortfolio();
    const [adviceList, setAdviceList] = useState<Advice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const fetchPricesAndAdvice = async () => {
            if (!assets || assets.length === 0) return;

            setIsLoading(true);
            try {
                // 1. Group assets by market
                const krSymbols = assets.filter(a => a.category === 'KR').map(a => a.symbol).join(',');
                const usSymbols = assets.filter(a => a.category === 'US').map(a => a.symbol).join(',');

                const fetchBatch = async (symbols: string, market: string) => {
                    if (!symbols) return {};
                    try {
                        const res = await fetch(`/api/kis/price/batch?market=${market}&symbols=${symbols}`);
                        if (!res.ok) return {};
                        return await res.json();
                    } catch (e) {
                        console.error(e);
                        return {};
                    }
                };

                const [krData, usData] = await Promise.all([
                    fetchBatch(krSymbols, 'KR'),
                    fetchBatch(usSymbols, 'US')
                ]);

                const priceMap = { ...krData, ...usData };

                // 2. Prepare Enriched Portfolio Data
                let calculatedTotalValue = 0;

                const enrichedPortfolio = assets.map(a => {
                    const rawData = priceMap[a.symbol];
                    let currentPrice = a.pricePerShare;
                    let changeRate = 0;

                    if (rawData) {
                        if (a.category === 'US') {
                            currentPrice = parseFloat(rawData.last || rawData.base || rawData.clos || 0);
                            changeRate = parseFloat(rawData.rate || 0);
                        } else {
                            currentPrice = parseInt(rawData.stck_prpr || '0');
                            changeRate = parseFloat(rawData.prdy_ctrt || '0');
                        }
                    }

                    if (currentPrice === 0) currentPrice = a.pricePerShare;

                    const value = currentPrice * a.quantity;
                    calculatedTotalValue += value;

                    // Calculate proximity to targets
                    let proximity = null;
                    const diffLower = a.targetPriceLower ? ((currentPrice - a.targetPriceLower) / currentPrice) * 100 : null;
                    const diffUpper = a.targetPriceUpper ? ((a.targetPriceUpper - currentPrice) / currentPrice) * 100 : null;

                    if (diffLower !== null && Math.abs(diffLower) <= 5) {
                        proximity = `하한가 근접 (${diffLower.toFixed(1)}%)`;
                    } else if (diffUpper !== null && Math.abs(diffUpper) <= 5) {
                        proximity = `상한가 근접 (${diffUpper.toFixed(1)}%)`;
                    }

                    return {
                        symbol: a.symbol,
                        name: a.name,
                        quantity: a.quantity,
                        avgPrice: a.pricePerShare,
                        currentPrice: currentPrice,
                        sector: a.sector,
                        category: a.category,
                        targetLower: a.targetPriceLower,
                        targetUpper: a.targetPriceUpper,
                        changeRate: changeRate,
                        totalValue: value,
                        proximity: proximity // Explicitly tell AI about target proximity
                    };
                });

                // 3. Filter: exclude stocks under 3% of total portfolio
                const significantPortfolio = enrichedPortfolio.filter(p =>
                    calculatedTotalValue > 0 ? (p.totalValue / calculatedTotalValue) * 100 >= 3 : true
                );

                // 4. Call AI Advice API
                const res = await fetch('/api/ai/advice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        portfolio: significantPortfolio,
                        totalValue: calculatedTotalValue
                    })
                });

                if (!res.ok) throw new Error('Failed to fetch advice');

                const data = await res.json();
                if (data.advice) {
                    setAdviceList(data.advice);
                }
            } catch (err) {
                console.error("[AiGuruBlock] Fetch Error:", err);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (assets.length > 0 && adviceList.length === 0) {
            fetchPricesAndAdvice();
        }
    }, [assets]);

    if (isPortfolioLoading || isLoading) {
        return (
            <div className="rounded-2xl border border-[#333] bg-[#1E1E1E] p-6 mb-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#252525] border border-[#333] flex items-center justify-center text-xl">
                        🔍
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">AI 투자 분석</h3>
                        <p className="text-xs text-gray-500">포트폴리오 분석 중...</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-16 h-5 bg-[#333] rounded-md"></div>
                            <div className="flex-1 h-5 bg-[#252525] rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!assets || assets.length === 0) return null;

    return (
        <div className="rounded-2xl border border-[#333] bg-[#1E1E1E] p-6 mb-6 shadow-lg shadow-black/20 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#F7D047] text-black flex items-center justify-center text-xl shadow-lg shadow-yellow-500/20">
                    🪄
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">AI 투자 분석 리포트</h3>
                    <p className="text-xs text-gray-400">포트폴리오 비중 3% 이상 종목 대상</p>
                </div>
            </div>

            {/* Advice Content */}
            {hasError ? (
                <div className="text-gray-500 text-sm py-4 text-center">
                    AI 분석 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
                </div>
            ) : (
                <div className="space-y-3">
                    {adviceList.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#252525] border border-[#333] hover:bg-[#2A2A2A] transition-colors">
                            <span className="inline-flex items-center justify-center flex-shrink-0 bg-[#F7D047]/10 text-[#F7D047] text-[11px] font-bold px-2.5 py-1 rounded-lg mt-0.5 whitespace-nowrap">
                                {item.category}
                            </span>
                            <span className="text-sm text-gray-300 leading-relaxed font-medium">{item.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Subtle accent */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#F7D047]/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
}
