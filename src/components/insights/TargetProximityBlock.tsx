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
            // 1. Filter: Sold Out
            if (!asset.symbol || asset.quantity <= 0) {
                logs.push(`[제외] ${asset.name}: 보유수량 0 또는 기호 없음`);
                return;
            }

            const liveData = lastData.get(asset.symbol);
            const currentPrice = liveData?.price || initialPrices.get(asset.symbol);

            // 2. Filter: No Price
            if (!currentPrice) {
                logs.push(`[제외] ${asset.name}: 현재가 조회 실패 (API/WS 미수신)`);
                return;
            }

            // --- Upper Target Processing ---
            if (asset.targetPriceUpper) {
                const dist = ((asset.targetPriceUpper - currentPrice) / currentPrice) * 100;
                upperList.push({
                    name: asset.name,
                    symbol: asset.symbol,
                    currentPrice,
                    target: asset.targetPriceUpper,
                    distance: dist,
                    displayDist: dist.toFixed(2),
                    assetObj: asset // Keep reference for modal
                });
            }

            // --- Lower Target Processing ---
            if (asset.targetPriceLower) {
                const dist = ((currentPrice - asset.targetPriceLower) / currentPrice) * 100;
                lowerList.push({
                    name: asset.name,
                    symbol: asset.symbol,
                    currentPrice,
                    target: asset.targetPriceLower,
                    distance: dist,
                    displayDist: dist.toFixed(2),
                    assetObj: asset // Keep reference for modal
                });
            }

            if (!asset.targetPriceLower && !asset.targetPriceUpper) {
                logs.push(`[제외] ${asset.name}: 목표가 미설정`);
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

    const CustomTooltip = ({ active, payload, type }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isLower = type === 'lower';
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50">
                    <p className="font-bold mb-1 text-slate-800">{data.name}</p>
                    <p className="text-slate-600">현재가: <span className="font-mono">{data.currentPrice.toLocaleString()}</span></p>
                    <p className={isLower ? "text-blue-600" : "text-red-500"}>
                        {isLower ? "하한목표" : "상한목표"}: {data.target.toLocaleString()}
                    </p>
                    <p className="text-slate-500 mt-1">
                        남은 거리:
                        <span className="font-bold ml-1">
                            {Math.abs(data.distance).toFixed(2)}%
                        </span>
                        {data.distance < 0 && <span className="text-xs text-red-400 ml-1">(도달/초과)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 text-center border-t pt-1">
                        클릭하여 상세 보기
                    </p>
                </div>
            );
        }
        return null;
    };

    // Render Loading State
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-[500px] flex flex-col items-center justify-center space-y-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <div className="w-full max-w-xs space-y-2 text-center">
                    <p className="text-slate-800 font-medium text-lg">포트폴리오 분석 중...</p>
                    <p className="text-slate-500 text-sm animate-pulse">{loadingStatus}</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-4">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-400 text-right mt-1">{loadingProgress}%</p>
                </div>
            </div>
        )
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center text-slate-400">
                보유한 주식이 없습니다.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Block 1: Upper Target (Red) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative animate-in fade-in zoom-in duration-500">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-red-500">⬆️</span> 상한 목표 달성 순위
                    </h2>
                    {upperData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-slate-400 text-sm">
                            상한 목표가 설정된 종목이 없습니다.
                        </div>
                    ) : (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={upperData}
                                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 12, fill: '#475569', fontWeight: 500, cursor: 'pointer' }}
                                        interval={0}
                                        onClick={handleBarClick}
                                    />
                                    <Tooltip content={<CustomTooltip type='upper' />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                                    <Bar dataKey="distance" barSize={20} radius={[0, 4, 4, 0]} onClick={handleBarClick}>
                                        {upperData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill='#ef4444' fillOpacity={0.7} style={{ cursor: 'pointer' }} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Block 2: Lower Target (Blue) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative animate-in fade-in zoom-in duration-500">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-blue-500">⬇️</span> 하한 목표 달성 순위
                    </h2>
                    {lowerData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-slate-400 text-sm">
                            하한 목표가 설정된 종목이 없습니다.
                        </div>
                    ) : (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={lowerData}
                                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 12, fill: '#475569', fontWeight: 500, cursor: 'pointer' }}
                                        interval={0}
                                        onClick={handleBarClick}
                                    />
                                    <Tooltip content={<CustomTooltip type='lower' />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                                    <Bar dataKey="distance" barSize={20} radius={[0, 4, 4, 0]} onClick={handleBarClick}>
                                        {lowerData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill='#3b82f6' fillOpacity={0.7} style={{ cursor: 'pointer' }} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Debug Info Condensed */}
            {(processingLogs.length > 0) && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <details className="text-xs text-slate-400 cursor-pointer">
                        <summary>📋 데이터 리포트 (제외된 종목 포함)</summary>
                        <div className="mt-2 text-slate-500 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100">
                            {fetchErrors.length > 0 && (
                                <div className="mb-2 pb-2 border-b border-red-100 text-red-500">
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
