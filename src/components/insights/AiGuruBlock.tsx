'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePortfolio } from '@/context/PortfolioContext';

interface Advice {
    id: number;
    category: string;
    text: string;
}

export default function AiGuruBlock() {
    const { assets, isLoading: isPortfolioLoading } = usePortfolio(); // Updated destructuring
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
                        return await res.json(); // Returns { symbol: data, ... }
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
                    let currentPrice = a.pricePerShare; // Default fallback
                    let changeRate = 0;

                    if (rawData) {
                        if (a.category === 'US') {
                            currentPrice = parseFloat(rawData.last || rawData.base || rawData.clos || 0);
                            // US Mock/API usually has 'rate' or similar? KIS Overseas structure varies.
                            // Assuming 'rate' is change rate if available, or calc from open/close.
                            changeRate = parseFloat(rawData.rate || 0);
                        } else {
                            currentPrice = parseInt(rawData.stck_prpr || '0');
                            changeRate = parseFloat(rawData.prdy_ctrt || '0');
                        }
                    }

                    if (currentPrice === 0) currentPrice = a.pricePerShare;

                    const value = currentPrice * a.quantity;
                    calculatedTotalValue += value;

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
                        changeRate: changeRate
                    };
                });

                // 3. Call AI Advice API
                const res = await fetch('/api/ai/advice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        portfolio: enrichedPortfolio,
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
    }, [assets]); // Removed adviceList from dep array to avoid loops, though handled by condition

    if (isPortfolioLoading || isLoading) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 shadow-sm border border-indigo-100 mb-6 flex flex-col items-center justify-center gap-4 text-center min-h-[200px] animate-in fade-in duration-500">
                <div className="relative w-24 h-24 md:w-32 md:h-32 animate-bounce">
                    <Image
                        src="/images/guru_whale.png"
                        alt="AI Guru Loading"
                        fill
                        className="object-contain drop-shadow-md"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-indigo-700 mb-1">AI 주식 도사 고래가 분석 중이여유...</h3>
                    <p className="text-sm text-indigo-500 animate-pulse">
                        "잠깐만 기달려봐유, 자네 주식들 싹 훑어보고 있응께!"
                    </p>
                </div>
            </div>
        );
    }

    if (!assets || assets.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-indigo-100 mb-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden animate-in fade-in duration-700">

            {/* Character Section */}
            <div className="flex-shrink-0 relative z-10 text-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
                    <Image
                        src="/images/guru_dog.png"
                        alt="AI Guru"
                        fill
                        className="object-contain drop-shadow-lg transform hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="mt-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm inline-block">
                    AI 주식 도사 고래
                </div>
            </div>

            {/* Bubble Section */}
            <div className="flex-grow w-full z-10 relative">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative">
                    {/* Triangle for bubble effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[8px] w-4 h-4 bg-white border-t border-l border-slate-100 transform rotate-45 md:top-1/2 md:left-0 md:-translate-x-[8px] md:-translate-y-1/2 md:-rotate-45"></div>

                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span>📢</span> 오늘의 훈수
                    </h3>

                    {hasError ? (
                        <div className="text-slate-400 text-sm">
                            "오늘은 목이 좀 아퍼서... 나중에 다시 오슈." (조언 불러오기 실패)
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {adviceList.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-slate-700 text-sm leading-relaxed items-start">
                                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span>
                                        <b className="text-indigo-900 mr-1">[{item.category}]</b>
                                        {item.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-yellow-300/10 rounded-full blur-3xl z-0"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl z-0"></div>
        </div>
    );
}
