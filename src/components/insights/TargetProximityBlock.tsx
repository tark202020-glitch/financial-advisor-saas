"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import StockDetailChartModal from '../modals/StockDetailChartModal';

export default function TargetProximityBlock() {
    const { assets } = usePortfolio();
    const { subscribe, lastData } = useWebSocketContext();

    // Modal State
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Progressive Loading State
    const [initialPrices, setInitialPrices] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0); // 0-100
    const [loadingStatus, setLoadingStatus] = useState("데이터 준비 중...");
    const [fetchErrors, setFetchErrors] = useState<string[]>([]);

    // 0. Initial Progressive Fetch
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!assets || assets.length === 0) {
                if (isMounted) setIsLoading(false);
                return;
            }

            const priceMap = new Map<string, number>();
            const total = assets.length;
            const errors: string[] = [];

            // Subscribe to WS for future updates
            assets.forEach(asset => {
                if (asset.symbol) subscribe(asset.symbol, asset.category);
            });

            // Iterate sequentially with filtering
            for (let i = 0; i < total; i++) {
                const asset = assets[i];

                // Exclude: Empty symbol or Zero quantity (Sold out)
                if (!asset.symbol || asset.quantity <= 0) continue;

                if (isMounted) {
                    setLoadingStatus(`${asset.name} (${asset.symbol}) 시세 조회 중...`);
                    // Calculate progress based on (i+1) instead of i for better progression
                    setLoadingProgress(Math.round(((i + 1) / total) * 100));
                }

                try {
                    // Clean symbol
                    let cleanSymbol = asset.symbol;
                    if (asset.symbol.includes('.')) {
                        cleanSymbol = asset.symbol.split('.')[0];
                    }

                    const endpoint = asset.category === 'US'
                        ? `/api/kis/price/overseas/${cleanSymbol}`
                        : `/api/kis/price/domestic/${cleanSymbol}`;

                    const res = await fetch(endpoint);
                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || `Status ${res.status}`);
                    }

                    if (res.ok) {
                        let price = 0;
                        if (asset.category === 'US') {
                            // KIS Overseas API
                            price = parseFloat(data.last || data.base || data.clos || 0);
                        } else {
                            // Domestic API
                            price = parseInt(data.stck_prpr || 0);
                            // Fallback to Previous Close (stck_sdpr) if current is 0
                            if (price === 0) {
                                price = parseInt(data.stck_sdpr || 0);
                            }
                        }

                        if (price > 0) {
                            priceMap.set(asset.symbol, price);
                        } else {
                            // Still 0?
                            // Safely stringify
                            const rawStr = JSON.stringify(data || {}).slice(0, 100);
                            console.warn(`[PriceZero] ${asset.symbol}: ${rawStr}`);
                            errors.push(`${asset.symbol}: Price 0 (Check Market Status)`);
                        }
                    }
                } catch (e: any) {
                    const errMsg = `${asset.name} (${asset.symbol}): ${e.message}`;
                    console.error(errMsg);
                    errors.push(errMsg);
                }

                // Small delay to make the UI update perceptible if desired
                // await new Promise(r => setTimeout(r, 50)); 
            }

            if (isMounted) {
                setLoadingProgress(100);
                setTimeout(() => {
                    if (isMounted) {
                        setInitialPrices(priceMap);
                        setFetchErrors(errors);
                        setIsLoading(false);
                    }
                }, 500);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [assets, subscribe]);

    // 1. Prepare Data Split (Lower / Upper)
    const { lowerData, upperData, processingLogs } = useMemo(() => {
        const logs: string[] = [];
        const lowerList: any[] = [];
        const upperList: any[] = [];

        assets.forEach(asset => {
            if (!asset.symbol || asset.quantity <= 0) {
                // logs.push(`[제외] ${asset.name}: 보유수량 0 또는 기호 없음`); // log noise reduction
                return;
            }

            const liveData = lastData.get(asset.symbol);
            const currentPrice = liveData?.price || initialPrices.get(asset.symbol);

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
    }, [assets, lastData, initialPrices]);

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
                <foreignObject x={-100} y={-15} width={90} height={40}>
                    <div className="h-full flex items-center justify-end">
                        <p className={`text-[11px] font-bold leading-tight text-right line-clamp-2 overflow-hidden text-ellipsis break-keep ${isUrgent5 ? 'text-red-600 scale-105 origin-right' : 'text-gray-400'}`}>
                            {isUrgent5 && <span className="mr-1 inline-block animate-bounce">🔥</span>}
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
                    <p className="text-gray-500 text-sm animate-pulse">{loadingStatus}</p>
                    <div className="w-full bg-[#252525] rounded-full h-2 overflow-hidden mt-4">
                        <div
                            className="bg-[#F7D047] h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-600 text-right mt-1">{loadingProgress}%</p>
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
                                        width={100}
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
                                        width={100}
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
                            {fetchErrors.length > 0 && (
                                <div className="mb-2 pb-2 border-b border-red-900/30 text-red-500">
                                    <strong>⚠ API 오류:</strong>
                                    <ul className="list-disc list-inside">
                                        {fetchErrors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}
                            <ul className="list-disc list-inside">
                                {processingLogs.map((log, idx) => <li key={idx}>{log}</li>)}
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
