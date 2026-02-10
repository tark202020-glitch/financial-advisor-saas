"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

    const [viewMode, setViewMode] = useState<'ASSET' | 'SECTOR'>('ASSET');
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    // Reset selection when view mode changes
    useEffect(() => {
        setSelectedSector(null);
    }, [viewMode]);

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
    const { chartData, top10Data, totalPortfolioValue, sectorAssets } = useMemo(() => {
        let filtered = processedData;

        // 1. Filter Market
        if (marketFilter !== 'ALL') {
            filtered = filtered.filter(item => item.category === marketFilter);
        }

        // 2. Sort (Assets)
        if (sortFilter === 'AMOUNT') {
            filtered.sort((a, b) => b.totalValue - a.totalValue);
        } else {
            filtered.sort((a, b) => b.returnRate - a.returnRate);
        }

        const totalValue = filtered.reduce((sum, item) => sum + item.totalValue, 0);

        // 3. Top 10 for List (Always Assets)
        let top10 = filtered.slice(0, 10);
        let sectorAssetList: any[] = [];

        // 4. Data for Pie Chart
        let finalPie: any[] = [];

        if (viewMode === 'ASSET') {
            const valueSorted = [...filtered].sort((a, b) => b.totalValue - a.totalValue);
            let pieSlice = valueSorted.slice(0, 10);
            const others = valueSorted.slice(10);

            finalPie = pieSlice.map(item => ({
                name: item.name,
                value: item.totalValue,
                fill: ''
            }));

            if (others.length > 0) {
                const othersValue = others.reduce((sum, item) => sum + item.totalValue, 0);
                finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#cbd5e1' });
            }
        } else {
            // SECTOR Mode
            const sectorMap = new Map<string, number>();
            filtered.forEach(item => {
                const sector = item.sector || '미분류';
                const current = sectorMap.get(sector) || 0;
                sectorMap.set(sector, current + item.totalValue);
            });

            // Convert to array and sort
            const sectorArray = Array.from(sectorMap.entries()).map(([name, value]) => ({
                name,
                value,
                fill: ''
            }));
            sectorArray.sort((a, b) => b.value - a.value);

            // Cap at Top 10 Sectors if too many? usually sectors aren't that many
            // But let's apply same logic just in case
            if (sectorArray.length > 10) {
                const topSectors = sectorArray.slice(0, 10);
                const otherSectors = sectorArray.slice(10);
                const othersValue = otherSectors.reduce((sum, item) => sum + item.value, 0);

                finalPie = topSectors;
                finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#cbd5e1' });
            } else {
                finalPie = sectorArray;
            }

            // If a sector is selected, filter assets for that sector
            if (selectedSector) {
                sectorAssetList = filtered.filter(item => (item.sector || '미분류') === selectedSector);
                // Sort sector assets by total value by default
                sectorAssetList.sort((a, b) => b.totalValue - a.totalValue);
            }
        }

        return { chartData: finalPie, top10Data: top10, totalPortfolioValue: totalValue, sectorAssets: sectorAssetList };
    }, [processedData, marketFilter, sortFilter, viewMode, selectedSector]);

    // Formatters
    const formatCurrency = (val: number, cat: string = 'KR') => {
        return cat === 'US'
            ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : `₩${Math.round(val).toLocaleString()}`;
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#06b6d4', '#84cc16', '#a855f7', '#f43f5e'];

    // Handlers
    const handlePieClick = (data: any) => {
        if (viewMode === 'SECTOR' && data && data.name && data.name !== '기타 (Others)') {
            setSelectedSector(data.name);
        }
    };

    const handleSectorListClick = (sectorName: string) => {
        if (viewMode === 'SECTOR' && sectorName !== '기타 (Others)') {
            setSelectedSector(sectorName);
        }
    };

    if (isLoading && initialPrices.size === 0) {
        return <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 h-64 flex items-center justify-center text-slate-400">
            포트폴리오 분석 중...
        </div>;
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 relative animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-indigo-600">📊</span> 포트폴리오 구성
                    </h2>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('ASSET')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'ASSET' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            종목별
                        </button>
                        <button
                            onClick={() => setViewMode('SECTOR')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'SECTOR' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            업종별
                        </button>
                    </div>
                </div>

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

                    {/* Sort Filter (Only affects List) */}
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
                <div className="h-[500px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={120}
                                outerRadius={180}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={handlePieClick}
                                style={{ cursor: viewMode === 'SECTOR' ? 'pointer' : 'default' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `₩${Math.round(value).toLocaleString()}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-4">
                        <div className="text-xs text-slate-400">{viewMode === 'ASSET' ? '총 평가금액' : '업종별 비중'}</div>
                        <div className="text-sm font-bold text-slate-800">
                            {totalPortfolioValue > 100000000
                                ? `${(totalPortfolioValue / 100000000).toFixed(2)}억`
                                : `${(totalPortfolioValue / 10000).toFixed(0)}만`}
                        </div>
                    </div>
                </div>

                {/* Right: List (Asset / Sector / Sector Details) */}
                <div className="flex flex-col gap-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">

                    {/* Header for Sector Details */}
                    {viewMode === 'SECTOR' && selectedSector && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                            <button
                                onClick={() => setSelectedSector(null)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                ⬅
                            </button>
                            <span className="font-bold text-indigo-600">{selectedSector}</span>
                            <span className="text-xs text-slate-400">보유 종목</span>
                        </div>
                    )}

                    {viewMode === 'ASSET' ? (
                        /* Asset List */
                        top10Data.map((asset, index) => {
                            const isProfit = asset.profitLoss >= 0;
                            const weight = totalPortfolioValue > 0 ? (asset.totalValue / totalPortfolioValue) * 100 : 0;

                            return (
                                <div key={asset.symbol} className="flex flex-col pb-3 border-b border-slate-100 last:border-0">
                                    <div className="flex justify-between items-center mb-1">
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
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                            </div>
                                            <span className="text-slate-400 w-8">{weight.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="text-slate-500">
                                                {asset.currentPrice.toLocaleString()}
                                            </div>
                                            <div className={`${isProfit ? 'text-red-500' : 'text-blue-500'} font-medium`}>
                                                {isProfit ? '▲' : '▼'} {Math.abs(asset.profitLoss).toLocaleString()} ({asset.returnRate.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        /* SECTOR MODE */
                        selectedSector ? (
                            /* Sector Details (Filtered Assets) */
                            sectorAssets.length > 0 ? (
                                sectorAssets.map((asset, index) => {
                                    const isProfit = asset.profitLoss >= 0;
                                    // Weight within the sector or total? Let's show weight within total for consistency, or maybe local?
                                    // User usually cares about global impact.
                                    const weight = totalPortfolioValue > 0 ? (asset.totalValue / totalPortfolioValue) * 100 : 0;

                                    return (
                                        <div key={asset.symbol} className="flex flex-col pb-3 border-b border-slate-100 last:border-0 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-800 truncate max-w-[150px]" title={asset.name}>
                                                        {asset.name}
                                                    </span>
                                                </div>
                                                <div className="text-right font-bold text-slate-800">
                                                    ₩{Math.round(asset.totalValue).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2 w-1/3">
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                    </div>
                                                    <span className="text-slate-400 w-8">{weight.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div className="text-slate-500">
                                                        {asset.currentPrice.toLocaleString()}
                                                    </div>
                                                    <div className={`${isProfit ? 'text-red-500' : 'text-blue-500'} font-medium`}>
                                                        {isProfit ? '▲' : '▼'} {Math.abs(asset.profitLoss).toLocaleString()} ({asset.returnRate.toFixed(2)}%)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-slate-400 py-10">이 업종에 해당하는 종목이 없습니다.</div>
                            )
                        ) : (
                            /* Sector List (Overview) */
                            chartData.map((sector: any, index: number) => {
                                const weight = totalPortfolioValue > 0 ? (sector.value / totalPortfolioValue) * 100 : 0;
                                return (
                                    <div
                                        key={sector.name}
                                        className="flex flex-col pb-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                        onClick={() => handleSectorListClick(sector.name)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index < 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {index + 1}
                                                </span>
                                                <span className="font-bold text-slate-800 truncate" title={sector.name}>
                                                    {sector.name}
                                                </span>
                                            </div>
                                            <div className="text-right font-bold text-slate-800">
                                                ₩{Math.round(sector.value).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs w-full">
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                            </div>
                                            <span className="text-slate-500 font-bold min-w-[40px] text-right">{weight.toFixed(1)}%</span>
                                        </div>
                                        {sector.name !== '기타 (Others)' && (
                                            <div className="text-[10px] text-slate-400 text-right mt-1">
                                                클릭하여 상세 보기 ➡
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )
                    )}

                    {top10Data.length === 0 && (
                        <div className="text-center text-slate-400 py-10">
                            데이터가 없습니다.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
