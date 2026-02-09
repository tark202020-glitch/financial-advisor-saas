"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function PortfolioCompositionBlock() {
    const { assets } = usePortfolio();
    const { subscribe, lastData } = useWebSocketContext();

    const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US'>('ALL');
    const [sortFilter, setSortFilter] = useState<'AMOUNT' | 'RETURN'>('AMOUNT');

    // Price State
    const [initialPrices, setInitialPrices] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch (similar to TargetProximityBlock)
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!assets || assets.length === 0) {
                if (isMounted) setIsLoading(false);
                return;
            }

            const priceMap = new Map<string, number>();

            // Subscribe & Fetch
            for (const asset of assets) {
                if (!asset.symbol || asset.quantity <= 0) continue;
                subscribe(asset.symbol, asset.category);

                try {
                    let cleanSymbol = asset.symbol;
                    if (asset.symbol.includes('.')) cleanSymbol = asset.symbol.split('.')[0];

                    const endpoint = asset.category === 'US'
                        ? `/api/kis/price/overseas/${cleanSymbol}`
                        : `/api/kis/price/domestic/${cleanSymbol}`;

                    const res = await fetch(endpoint);
                    const data = await res.json();

                    if (res.ok) {
                        let price = 0;
                        if (asset.category === 'US') {
                            price = parseFloat(data.last || data.base || data.clos || 0);
                        } else {
                            price = parseInt(data.stck_prpr || data.stck_sdpr || 0);
                        }
                        if (price > 0) priceMap.set(asset.symbol, price);
                    }
                } catch (e) {
                    console.error("Price fetch error", asset.symbol, e);
                }
            }

            if (isMounted) {
                setInitialPrices(priceMap);
                setIsLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [assets, subscribe]);

    // Data Processing
    const processedData = useMemo(() => {
        if (!assets) return [];

        return assets.map(asset => {
            if (asset.quantity <= 0) return null;

            // Get Current Price
            let currentPrice = initialPrices.get(asset.symbol) || 0;
            const realtime = lastData.get(asset.symbol);
            if (realtime) {
                currentPrice = realtime.price;
            }

            if (currentPrice === 0) return null;

            // Calculations
            const totalValue = currentPrice * asset.quantity;
            const avgPrice = asset.pricePerShare || 0;
            const profitLoss = (currentPrice - avgPrice) * asset.quantity;
            const returnRate = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
            const dailyChangeRate = realtime ? realtime.rate : 0; // Approx

            return {
                ...asset,
                currentPrice,
                totalValue,
                profitLoss,
                returnRate,
                dailyChangeRate
            };
        }).filter(item => item !== null) as any[];

    }, [assets, initialPrices, lastData]);

    // Filtering & Sorting
    const { chartData, top5Data, totalPortfolioValue } = useMemo(() => {
        let filtered = processedData;

        // 1. Filter Market
        if (marketFilter !== 'ALL') {
            filtered = filtered.filter(item => item.category === marketFilter);
        }

        // 2. Sort
        if (sortFilter === 'AMOUNT') {
            filtered.sort((a, b) => b.totalValue - a.totalValue);
        } else {
            filtered.sort((a, b) => b.returnRate - a.returnRate);
        }

        const totalValue = filtered.reduce((sum, item) => sum + item.totalValue, 0);

        // 3. Top 5 for List
        const top5 = filtered.slice(0, 5);

        // 4. Data for Pie Chart (Top 4 + Others)
        // Re-sort by Value for Pie Chart visual consistency usually, but here likely want to match list or just Value
        // Pie Chart is ALWAYS allocation (Value), regardless of list sort
        const valueSorted = [...filtered].sort((a, b) => b.totalValue - a.totalValue);
        let pieSlice = valueSorted.slice(0, 4);
        const others = valueSorted.slice(4);

        const finalPie = pieSlice.map(item => ({
            name: item.name,
            value: item.totalValue,
            fill: '' // will assign colors later
        }));

        if (others.length > 0) {
            const othersValue = others.reduce((sum, item) => sum + item.totalValue, 0);
            finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#cbd5e1' });
        }

        return { chartData: finalPie, top5Data: top5, totalPortfolioValue: totalValue };
    }, [processedData, marketFilter, sortFilter]);

    // Formatters
    const formatCurrency = (val: number, cat: string = 'KR') => {
        return cat === 'US'
            ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : `₩${Math.round(val).toLocaleString()}`;
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

    if (isLoading && initialPrices.size === 0) {
        return <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 h-64 flex items-center justify-center text-slate-400">
            포트폴리오 분석 중...
        </div>;
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 relative animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-indigo-600">📊</span> 포트폴리오 구성 (Top Holdings)
                </h2>

                {/* Controls */}
                <div className="flex items-center gap-4 text-sm">
                    {/* Market Filter */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['ALL', 'KR', 'US'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMarketFilter(m as any)}
                                className={`px-3 py-1 rounded-md transition-all ${marketFilter === m ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {m === 'ALL' ? '구분' : m}
                            </button>
                        ))}
                    </div>

                    {/* Sort Filter */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setSortFilter('AMOUNT')}
                            className={`px-3 py-1 rounded-md transition-all ${sortFilter === 'AMOUNT' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            금액순
                        </button>
                        <button
                            onClick={() => setSortFilter('RETURN')}
                            className={`px-3 py-1 rounded-md transition-all ${sortFilter === 'RETURN' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            수익률순
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Left: Pie Chart */}
                <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `₩${Math.round(value).toLocaleString()}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                        <div className="text-xs text-slate-400">총 평가금액</div>
                        <div className="text-sm font-bold text-slate-800">
                            {totalPortfolioValue > 100000000
                                ? `${(totalPortfolioValue / 100000000).toFixed(2)}억`
                                : `${(totalPortfolioValue / 10000).toFixed(0)}만`}
                        </div>
                    </div>
                </div>

                {/* Right: Top 5 List */}
                <div className="flex flex-col gap-3">
                    {top5Data.map((asset, index) => {
                        const isProfit = asset.profitLoss >= 0;
                        const weight = totalPortfolioValue > 0 ? (asset.totalValue / totalPortfolioValue) * 100 : 0;

                        return (
                            <div key={asset.symbol} className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                                {/* Top Row: Rank, Name, Total Value */}
                                <div className="flexjustify-between items-center mb-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index < 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-bold text-slate-800 truncate max-w-[120px] md:max-w-[200px]" title={asset.name}>
                                            {asset.name}
                                        </span>
                                    </div>
                                    <div className="text-right font-bold text-slate-800">
                                        ₩{Math.round(asset.totalValue).toLocaleString()}
                                    </div>
                                </div>

                                {/* Bottom Row: Price, Changes */}
                                <div className="flex justify-between items-center text-xs">
                                    {/* Left: Weight Bar */}
                                    <div className="flex items-center gap-2 w-1/3">
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                        </div>
                                        <span className="text-slate-400 w-8">{weight.toFixed(1)}%</span>
                                    </div>

                                    {/* Right: Price & Returns */}
                                    <div className="flex items-center gap-4 text-right">
                                        <div className="text-slate-500">
                                            {asset.currentPrice.toLocaleString()}
                                            {/* Daily Change could go here if available */}
                                        </div>
                                        <div className={`${isProfit ? 'text-red-500' : 'text-blue-500'} font-medium`}>
                                            {isProfit ? '▲' : '▼'} {Math.abs(asset.profitLoss).toLocaleString()} ({asset.returnRate.toFixed(2)}%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {top5Data.length === 0 && (
                        <div className="text-center text-slate-400 py-10">
                            데이터가 없습니다.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
