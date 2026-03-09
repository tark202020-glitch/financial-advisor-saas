"use client";

import React, { useMemo, useState } from 'react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import StockDetailChartModal from '../modals/StockDetailChartModal';

export default function TargetProximityBlock() {
    const {
        assets,
        getKrData, krLoading,
        getUsData, usLoading,
        goldData, goldLoading
    } = usePortfolio();

    // Modal State
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const isLoading = krLoading || usLoading || goldLoading;

    // Helper: get current price from context data
    const getPrice = (asset: Asset): number => {
        if (asset.category === 'GOLD') return goldData?.price > 0 ? goldData.price : 0;
        const cleanSymbol = asset.symbol.replace('.KS', '');
        const data = asset.category === 'KR' ? getKrData(cleanSymbol) : getUsData(asset.symbol);
        return data?.price || 0;
    };

    // 1. Prepare Data Split (Lower / Upper)
    const { lowerData, upperData, processingLogs } = useMemo(() => {
        const logs: string[] = [];
        const lowerList: any[] = [];
        const upperList: any[] = [];

        assets.forEach(asset => {
            if (!asset.symbol || asset.quantity <= 0) {
                return;
            }

            const currentPrice = getPrice(asset);

            if (!currentPrice) return;

            // Common Logic: Filter > 30%
            const isRelevant = (dist: number) => Math.abs(dist) <= 30;

            // --- Upper Target Processing ---
            if (asset.targetPriceUpper) {
                const dist = ((asset.targetPriceUpper - currentPrice) / currentPrice) * 100;
                if (isRelevant(dist)) {
                    upperList.push({
                        name: asset.name,
                        symbol: asset.symbol,
                        currentPrice,
                        target: asset.targetPriceUpper,
                        distance: dist,
                        assetObj: asset
                    });
                }
            }

            // --- Lower Target Processing ---
            if (asset.targetPriceLower) {
                const dist = ((currentPrice - asset.targetPriceLower) / currentPrice) * 100;
                if (isRelevant(dist)) {
                    lowerList.push({
                        name: asset.name,
                        symbol: asset.symbol,
                        currentPrice,
                        target: asset.targetPriceLower,
                        distance: dist,
                        assetObj: asset
                    });
                }
            }
        });

        // Sort by ABS distance (Closest first)
        lowerList.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));
        upperList.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));

        return { lowerData: lowerList, upperData: upperList, processingLogs: logs };
    }, [assets, getKrData, getUsData, goldData]);

    const handleBarClick = (data: any) => {
        if (data && data.assetObj) {
            setSelectedAsset(data.assetObj);
        }
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, type }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isLower = type === 'lower';
            const isUrgent5 = Math.abs(data.distance) <= 5;

            return (
                <div className={`bg-[#252525] p-3 border shadow-lg shadow-black/30 rounded-lg text-xs z-50 ${isUrgent5 ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#333]'}`}>
                    <p className="font-bold mb-1 text-white flex items-center gap-1">
                        {data.name}
                        {isUrgent5 && <span className="text-red-500 text-[10px] animate-pulse">🔥 Limit 5%</span>}
                    </p>
                    <p className="text-gray-400">현재가: <span className="font-mono text-white">{data.currentPrice.toLocaleString()}</span></p>
                    <p className={isLower ? "text-blue-400" : "text-red-400"}>
                        {isLower ? "하한목표" : "상한목표"}: {data.target.toLocaleString()}
                    </p>
                    <p className="text-gray-500 mt-1">
                        남은 거리:
                        <span className={`font-bold ml-1 ${isUrgent5 ? 'text-red-500 text-sm' : 'text-gray-300'}`}>
                            {Math.abs(data.distance).toFixed(2)}%
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom Y-Axis Tick with Text Wrapping & Highlight
    const CustomYAxisTick = ({ x, y, payload, data }: any) => {
        // Find the specific item data to check urgency
        const item = data && data.find((d: any) => d.name === payload.value);
        const isUrgent5 = item ? Math.abs(item.distance) <= 5 : false;

        return (
            <g transform={`translate(${x},${y})`}>
                {/* Fixed width for safety on iPad/Mobile */}
                <foreignObject x={-115} y={-15} width={110} height={40}>
                    <div className="h-full flex items-center justify-end pr-1">
                        <p className={`text-[11px] font-bold leading-tight text-right line-clamp-2 overflow-hidden text-ellipsis break-keep ${isUrgent5 ? 'text-red-600' : 'text-gray-400'}`}>
                            {isUrgent5 && <span className="mr-1 inline-block">🔥</span>}
                            {payload.value}
                        </p>
                    </div>
                </foreignObject>
            </g>
        );
    };

    // Render Loading State
    if (isLoading) {
        return (
            <div className="bg-[#1E1E1E] rounded-2xl p-8 shadow-sm border border-[#333] h-[500px] flex flex-col items-center justify-center space-y-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7D047]"></div>
                <div className="w-full max-w-xs space-y-2 text-center">
                    <p className="text-white font-medium text-lg">포트폴리오 분석 중...</p>
                    <p className="text-gray-500 text-sm animate-pulse">시세 데이터를 불러오는 중입니다</p>
                </div>
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="bg-[#1E1E1E] rounded-2xl p-8 shadow-sm border border-[#333] text-center text-gray-500">
                보유한 주식이 없습니다.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Block 1: Upper Target (Red) */}
                <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg shadow-black/20 border border-[#333] relative animate-in fade-in zoom-in duration-500">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-red-500">⬆️</span> 상한 목표 (30% 이내)
                    </h2>
                    {upperData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
                            설정된 범위(30%) 내 종목이 없습니다.
                        </div>
                    ) : (
                        <div className="w-full" style={{ height: Math.max(400, upperData.length * 50) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={upperData}
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <XAxis type="number" domain={[0, 30]} hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={<CustomYAxisTick data={upperData} />}
                                        interval={0}
                                        onClick={handleBarClick}
                                    />
                                    <Tooltip content={<CustomTooltip type='upper' />} cursor={{ fill: '#333', opacity: 0.3 }} />
                                    <Bar dataKey="distance" barSize={16} radius={[0, 4, 4, 0]} onClick={handleBarClick}>
                                        {upperData.map((entry: any, index: number) => {
                                            const isUrgent5 = Math.abs(entry.distance) <= 5;
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={isUrgent5 ? '#dc2626' : '#ef4444'}
                                                    fillOpacity={isUrgent5 ? 1 : 0.6}
                                                    stroke={isUrgent5 ? '#f87171' : 'none'}
                                                    strokeWidth={isUrgent5 ? 2 : 0}
                                                    className={isUrgent5 ? "animate-pulse" : ""}
                                                    style={{ cursor: 'pointer', filter: isUrgent5 ? 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.5))' : 'none' }}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Block 2: Lower Target (Blue) */}
                <div className="bg-[#1E1E1E] rounded-2xl p-6 shadow-lg shadow-black/20 border border-[#333] relative animate-in fade-in zoom-in duration-500">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-blue-500">⬇️</span> 하한 목표 (30% 이내)
                    </h2>
                    {lowerData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
                            설정된 범위(30%) 내 종목이 없습니다.
                        </div>
                    ) : (
                        <div className="w-full" style={{ height: Math.max(400, lowerData.length * 50) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={lowerData}
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <XAxis type="number" domain={[0, 30]} hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={<CustomYAxisTick data={lowerData} />}
                                        interval={0}
                                        onClick={handleBarClick}
                                    />
                                    <Tooltip content={<CustomTooltip type='lower' />} cursor={{ fill: '#333', opacity: 0.3 }} />
                                    <Bar dataKey="distance" barSize={16} radius={[0, 4, 4, 0]} onClick={handleBarClick}>
                                        {lowerData.map((entry: any, index: number) => {
                                            const isUrgent5 = Math.abs(entry.distance) <= 5;
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={isUrgent5 ? '#2563eb' : '#3b82f6'}
                                                    fillOpacity={isUrgent5 ? 1 : 0.6}
                                                    stroke={isUrgent5 ? '#60a5fa' : 'none'}
                                                    strokeWidth={isUrgent5 ? 2 : 0}
                                                    className={isUrgent5 ? "animate-pulse" : ""}
                                                    style={{ cursor: 'pointer', filter: isUrgent5 ? 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))' : 'none' }}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Debug Info Condensed */}
            {(processingLogs.length > 0) && (
                <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#333]">
                    <details className="text-xs text-gray-500 cursor-pointer">
                        <summary>📋 데이터 리포트 (제외된 종목 포함)</summary>
                        <div className="mt-2 text-gray-400 max-h-32 overflow-y-auto bg-[#252525] p-2 rounded border border-[#333]">
                            <ul className="list-disc list-inside">
                                {processingLogs.map((log: string, idx: number) => <li key={idx}>{log}</li>)}
                            </ul>
                        </div>
                    </details>
                </div>
            )}

            {/* Modal */}
            {selectedAsset && (
                <StockDetailChartModal
                    isOpen={!!selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    asset={selectedAsset}
                />
            )}
        </div>
    );
}
