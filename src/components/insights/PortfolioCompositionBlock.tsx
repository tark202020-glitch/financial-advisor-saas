"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function PortfolioCompositionBlock() {
    const {
        assets,
        getKrData, krLoading,
        getUsData, usLoading,
        goldData, goldLoading
    } = usePortfolio();

    const [marketFilter, setMarketFilter] = useState<'ALL' | 'KR' | 'US'>('ALL');
    const [sortFilter, setSortFilter] = useState<'AMOUNT' | 'RETURN'>('AMOUNT');

    const isLoading = krLoading || usLoading || goldLoading;

    const [viewMode, setViewMode] = useState<'ASSET' | 'SECTOR' | 'SECONDARY'>('ASSET');
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    // Reset selection when view mode changes
    useEffect(() => {
        setSelectedSector(null);
    }, [viewMode]);

    // Helper: get current price from context data
    const getPrice = (asset: Asset): number => {
        if (asset.category === 'GOLD') return goldData?.price > 0 ? goldData.price : 0;
        const cleanSymbol = asset.symbol.replace('.KS', '');
        const data = asset.category === 'KR' ? getKrData(cleanSymbol) : getUsData(asset.symbol);
        return data?.price || 0;
    };

    // Data Processing
    const { processedItems, skippedCount } = useMemo(() => {
        if (!assets) return { processedItems: [], skippedCount: 0 };

        let skipped = 0;
        const items = assets.map(asset => {
            if (asset.quantity <= 0) return null;

            // Get Current Price from Context
            const currentPrice = getPrice(asset);

            if (currentPrice === 0) {
                skipped++;
                return null;
            }

            // Calculations
            const totalValue = currentPrice * asset.quantity;
            const avgPrice = asset.pricePerShare || 0;
            const profitLoss = (currentPrice - avgPrice) * asset.quantity;
            const returnRate = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
            const dailyChangeRate = 0; // Context 데이터 기반으로 별도 산출 가능

            return {
                ...asset,
                currentPrice,
                totalValue,
                profitLoss,
                returnRate,
                dailyChangeRate
            };
        }).filter(item => item !== null) as any[];

        return { processedItems: items, skippedCount: skipped };
    }, [assets, getKrData, getUsData, goldData]);

    // Filtering & Sorting
    const { chartData, top10Data, totalPortfolioValue, sectorAssets } = useMemo(() => {
        let filtered = processedItems;

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
                finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#4B5563' }); // Darker gray for others
            }
        } else if (viewMode === 'SECTOR') {
            // SECTOR Mode
            const sectorMap = new Map<string, number>();
            filtered.forEach(item => {
                const sector = item.sector || '미분류';
                const current = sectorMap.get(sector) || 0;
                sectorMap.set(sector, current + item.totalValue);
            });

            const sectorArray = Array.from(sectorMap.entries()).map(([name, value]) => ({
                name,
                value,
                fill: ''
            }));
            sectorArray.sort((a, b) => b.value - a.value);

            if (sectorArray.length > 10) {
                const topSectors = sectorArray.slice(0, 10);
                const otherSectors = sectorArray.slice(10);
                const othersValue = otherSectors.reduce((sum, item) => sum + item.value, 0);

                finalPie = topSectors;
                finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#4B5563' });
            } else {
                finalPie = sectorArray;
            }

            if (selectedSector) {
                sectorAssetList = filtered.filter(item => (item.sector || '미분류') === selectedSector);
                sectorAssetList.sort((a, b) => b.totalValue - a.totalValue);
            }
        } else if (viewMode === 'SECONDARY') {
            // SECONDARY Mode
            const secMap = new Map<string, number>();
            filtered.forEach(item => {
                const sec = item.secondary_category || '미분류';
                const current = secMap.get(sec) || 0;
                secMap.set(sec, current + item.totalValue);
            });

            const secArray = Array.from(secMap.entries()).map(([name, value]) => ({
                name,
                value,
                fill: ''
            }));
            secArray.sort((a, b) => b.value - a.value);

            if (secArray.length > 10) {
                const topSecs = secArray.slice(0, 10);
                const otherSecs = secArray.slice(10);
                const othersValue = otherSecs.reduce((sum, item) => sum + item.value, 0);

                finalPie = topSecs;
                finalPie.push({ name: '기타 (Others)', value: othersValue, fill: '#4B5563' });
            } else {
                finalPie = secArray;
            }

            if (selectedSector) {
                sectorAssetList = filtered.filter(item => (item.secondary_category || '미분류') === selectedSector);
                sectorAssetList.sort((a, b) => b.totalValue - a.totalValue);
            }
        }

        return { chartData: finalPie, top10Data: top10, totalPortfolioValue: totalValue, sectorAssets: sectorAssetList };
    }, [processedItems, marketFilter, sortFilter, viewMode, selectedSector]);

    // Formatters
    const formatCurrency = (val: number, cat: string = 'KR') => {
        return cat === 'US'
            ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : `₩${Math.round(val).toLocaleString()}`;
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#06b6d4', '#84cc16', '#a855f7', '#f43f5e'];

    // Handlers
    const handlePieClick = (data: any) => {
        if ((viewMode === 'SECTOR' || viewMode === 'SECONDARY') && data && data.name && data.name !== '기타 (Others)') {
            setSelectedSector(data.name);
        }
    };

    const handleSectorListClick = (sectorName: string) => {
        if ((viewMode === 'SECTOR' || viewMode === 'SECONDARY') && sectorName !== '기타 (Others)') {
            setSelectedSector(sectorName);
        }
    };

    if (isLoading) {
        return <div className="p-6 bg-[#1E1E1E] rounded-2xl shadow-lg shadow-black/20 border border-[#333] h-64 flex items-center justify-center text-gray-400">
            포트폴리오 분석 중...
        </div>;
    }

    return (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg shadow-black/20 border border-[#333] mb-6 relative animate-in fade-in zoom-in duration-500">
            {/* Skipped stocks alert */}
            {skippedCount > 0 && (
                <div className="mb-4 bg-amber-950/20 rounded-lg p-2.5 border border-amber-900/30 text-xs text-amber-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>시세 미조회 {skippedCount}개 종목이 차트에서 제외되었습니다. 상단 배너에서 재시도할 수 있습니다.</span>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-[#F7D047]">📊</span> 포트폴리오 구성
                    </h2>

                    {/* View Mode Toggle */}
                    <div className="flex bg-[#252525] rounded-lg p-1 border border-[#333]">
                        <button
                            onClick={() => setViewMode('ASSET')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'ASSET' ? 'bg-[#F7D047] text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            종목별
                        </button>
                        <button
                            onClick={() => setViewMode('SECTOR')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'SECTOR' ? 'bg-[#F7D047] text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            업종별
                        </button>
                        <button
                            onClick={() => setViewMode('SECONDARY')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'SECONDARY' ? 'bg-[#F7D047] text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            분류별
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 text-sm">
                    {/* Market Filter */}
                    <div className="flex bg-[#252525] rounded-lg p-1 border border-[#333]">
                        {['ALL', 'KR', 'US'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMarketFilter(m as any)}
                                className={`px-3 py-1 rounded-md transition-all ${marketFilter === m ? 'bg-[#333] text-white font-bold shadow-sm border border-[#444]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {m === 'ALL' ? '구분' : m}
                            </button>
                        ))}
                    </div>

                    {/* Sort Filter (Only affects List) */}
                    <div className="flex bg-[#252525] rounded-lg p-1 border border-[#333]">
                        <button
                            onClick={() => setSortFilter('AMOUNT')}
                            className={`px-3 py-1 rounded-md transition-all ${sortFilter === 'AMOUNT' ? 'bg-[#333] text-white font-bold shadow-sm border border-[#444]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            금액순
                        </button>
                        <button
                            onClick={() => setSortFilter('RETURN')}
                            className={`px-3 py-1 rounded-md transition-all ${sortFilter === 'RETURN' ? 'bg-[#333] text-white font-bold shadow-sm border border-[#444]' : 'text-gray-500 hover:text-gray-300'}`}
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
                                stroke="none"
                                style={{ cursor: (viewMode === 'SECTOR' || viewMode === 'SECONDARY') ? 'pointer' : 'default' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `₩${Math.round(value).toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #333', backgroundColor: '#252525', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                itemStyle={{ color: '#ccc' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-4">
                        <div className="text-xs text-gray-500 mb-1">{viewMode === 'ASSET' ? '총 평가금액' : (viewMode === 'SECTOR' ? '업종별 비중' : '분류별 비중')}</div>
                        <div className="text-sm font-bold text-white">
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
                        <div className="mb-4 sticky top-0 bg-[#1E1E1E] z-10 pb-2 border-b border-[#333]">
                            <button
                                onClick={() => setSelectedSector(null)}
                                className="w-full py-3 px-4 bg-[#252525] hover:bg-[#333] text-gray-300 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm mb-3 group border border-[#333]"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">⬅</span>
                                전체 {viewMode === 'SECTOR' ? '업종' : '분류'} 목록으로 돌아가기
                            </button>
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[#F7D047] text-xl">📂</span>
                                <span className="font-bold text-white text-lg">{selectedSector}</span>
                                <span className="text-sm text-gray-500 ml-auto">보유 종목</span>
                            </div>
                        </div>
                    )}

                    {viewMode === 'ASSET' ? (
                        /* Asset List */
                        top10Data.map((asset, index) => {
                            const isProfit = asset.profitLoss >= 0;
                            const weight = totalPortfolioValue > 0 ? (asset.totalValue / totalPortfolioValue) * 100 : 0;

                            return (
                                <div key={asset.symbol} className="flex flex-col pb-3 border-b border-[#333] last:border-0 hover:bg-[#252525] p-2 rounded-lg transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index < 3 ? 'bg-[#F7D047] text-black' : 'bg-[#333] text-gray-400'}`}>
                                                {index + 1}
                                            </span>
                                            <span className="font-bold text-white truncate max-w-[120px] md:max-w-[200px]" title={asset.name}>
                                                {asset.name}
                                            </span>
                                        </div>
                                        <div className="text-right font-bold text-white">
                                            ₩{Math.round(asset.totalValue).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                            </div>
                                            <span className="text-gray-500 w-8">{weight.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="text-gray-400">
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
                                    const weight = totalPortfolioValue > 0 ? (asset.totalValue / totalPortfolioValue) * 100 : 0;

                                    return (
                                        <div key={asset.symbol} className="flex flex-col pb-3 border-b border-[#333] last:border-0 hover:bg-[#252525] p-2 rounded-lg transition-colors animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-white truncate max-w-[150px]" title={asset.name}>
                                                        {asset.name}
                                                    </span>
                                                </div>
                                                <div className="text-right font-bold text-white">
                                                    ₩{Math.round(asset.totalValue).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2 w-1/3">
                                                    <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-500 w-8">{weight.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div className="text-gray-400">
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
                                <div className="text-center text-gray-500 py-10">이 업종에 해당하는 종목이 없습니다.</div>
                            )
                        ) : (
                            /* Sector List (Overview) */
                            chartData.map((sector: any, index: number) => {
                                const weight = totalPortfolioValue > 0 ? (sector.value / totalPortfolioValue) * 100 : 0;
                                return (
                                    <div
                                        key={sector.name}
                                        className="flex flex-col pb-3 border-b border-[#333] last:border-0 cursor-pointer hover:bg-[#252525] p-2 rounded-lg transition-colors"
                                        onClick={() => handleSectorListClick(sector.name)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index < 3 ? 'bg-[#F7D047] text-black' : 'bg-[#333] text-gray-400'}`}>
                                                    {index + 1}
                                                </span>
                                                <span className="font-bold text-white truncate" title={sector.name}>
                                                    {sector.name}
                                                </span>
                                            </div>
                                            <div className="text-right font-bold text-white">
                                                ₩{Math.round(sector.value).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs w-full">
                                            <div className="h-2 w-full bg-[#333] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${weight}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                            </div>
                                            <span className="text-gray-500 font-bold min-w-[40px] text-right">{weight.toFixed(1)}%</span>
                                        </div>
                                        {sector.name !== '기타 (Others)' && (
                                            <div className="text-[10px] text-gray-500 text-right mt-1">
                                                클릭하여 상세 보기 ➡
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )
                    )}

                    {top10Data.length === 0 && (
                        <div className="text-center text-gray-500 py-10">
                            데이터가 없습니다.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
