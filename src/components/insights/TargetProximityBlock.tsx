"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';

export default function TargetProximityBlock() {
    const { assets } = usePortfolio();
    const { subscribe, lastData } = useWebSocketContext();

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
                            // KIS Overseas: last (current), base (prev close), clos (close?)
                            // If market closed, 'last' might be 0. Try 'base' or 'clos'.
                            price = parseFloat(data.output?.last || data.output?.base || data.output?.clos || 0);
                        } else {
                            // Domestic
                            price = parseInt(data.output?.stck_prpr || 0);
                            // Fallback to Previous Close (stck_sdpr) if current is 0
                            if (price === 0) {
                                price = parseInt(data.output?.stck_sdpr || 0);
                            }
                        }

                        if (price > 0) {
                            priceMap.set(asset.symbol, price);
                        } else {
                            // Still 0?
                            const rawStr = JSON.stringify(data.output).slice(0, 100);
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

    // 1. Prepare Data
    const { finalData, processingLogs } = useMemo(() => {
        const logs: string[] = [];
        const rawData = assets
            .map(asset => {
                // 1. Filter: Sold Out
                if (!asset.symbol || asset.quantity <= 0) {
                    logs.push(`[제외] ${asset.name}: 보유수량 0 또는 기호 없음`);
                    return null;
                }

                const liveData = lastData.get(asset.symbol);
                const currentPrice = liveData?.price || initialPrices.get(asset.symbol);

                // 2. Filter: No Price
                if (!currentPrice) {
                    logs.push(`[제외] ${asset.name}: 현재가 조회 실패 (API/WS 미수신)`);
                    return null;
                }

                // Calculate Distances
                let lowerDistance = null;
                let upperDistance = null;

                if (asset.targetPriceLower) {
                    lowerDistance = ((currentPrice - asset.targetPriceLower) / currentPrice) * 100;
                }

                if (asset.targetPriceUpper) {
                    upperDistance = ((asset.targetPriceUpper - currentPrice) / currentPrice) * 100;
                }

                // 3. Filter: No Targets
                if (lowerDistance === null && upperDistance === null) {
                    logs.push(`[제외] ${asset.name}: 목표가 미설정`);
                    return null;
                }

                const distL = lowerDistance !== null ? Math.abs(lowerDistance) : Infinity;
                const distU = upperDistance !== null ? Math.abs(upperDistance) : Infinity;
                const closestDist = Math.min(distL, distU);

                // Calculate Bars
                const MAX_RANGE = 30;
                let lowerBar = 0;
                let upperBar = 0;

                if (lowerDistance !== null && Math.abs(lowerDistance) <= MAX_RANGE) {
                    lowerBar = -(MAX_RANGE - Math.abs(lowerDistance));
                }

                if (upperDistance !== null && Math.abs(upperDistance) <= MAX_RANGE) {
                    upperBar = MAX_RANGE - Math.abs(upperDistance);
                }

                return {
                    name: asset.name || asset.symbol,
                    symbol: asset.symbol,
                    currentPrice,
                    targetLower: asset.targetPriceLower,
                    targetUpper: asset.targetPriceUpper,
                    lowerDistance,
                    upperDistance,
                    closestDist,
                    lowerBar,
                    upperBar,
                    displayLowerDist: lowerDistance !== null ? lowerDistance.toFixed(2) : '-',
                    displayUpperDist: upperDistance !== null ? upperDistance.toFixed(2) : '-',
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.closestDist - b.closestDist);

        return { finalData: rawData, processingLogs: logs };
    }, [assets, lastData, initialPrices]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50">
                    <p className="font-bold mb-1 text-slate-800">{label}</p>
                    <p className="text-slate-600">현재가: <span className="font-mono">{data.currentPrice.toLocaleString()}</span></p>
                    {data.targetLower && (
                        <p className="text-blue-600">
                            하한목표: {data.targetLower.toLocaleString()}
                            <span className="ml-1 text-[10px] text-slate-400">(남은거리: {data.displayLowerDist}%)</span>
                        </p>
                    )}
                    {data.targetUpper && (
                        <p className="text-red-500">
                            상한목표: {data.targetUpper.toLocaleString()}
                            <span className="ml-1 text-[10px] text-slate-400">(남은거리: {data.displayUpperDist}%)</span>
                        </p>
                    )}
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

    if (finalData.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center text-slate-400 h-[500px] flex flex-col items-center justify-center space-y-4">
                <p>표시할 데이터가 (유효한 목표가 설정 종목) 없습니다.</p>

                <div className="w-full max-w-md bg-slate-50 p-4 rounded-lg text-left overflow-y-auto max-h-48 border border-slate-200">
                    <p className="text-slate-700 font-bold mb-2 text-xs">🔍 제외된 종목 리포트:</p>
                    <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                        {processingLogs.map((log, idx) => (
                            <li key={idx} className={log.includes("실패") ? "text-red-400" : ""}>{log}</li>
                        ))}
                    </ul>
                    {fetchErrors.length > 0 && (
                        <>
                            <div className="border-t border-slate-200 my-2"></div>
                            <p className="text-red-600 font-bold mb-2 text-xs">⚠ API 오류:</p>
                            <ul className="list-disc list-inside text-xs text-red-500 space-y-1">
                                {fetchErrors.map((err, idx) => <li key={`err-${idx}`}>{err}</li>)}
                            </ul>
                        </>
                    )}
                </div>

                <p className="text-xs text-slate-400">목표가 설정 여부 및 시세 조회 상태를 확인해주세요.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative animate-in fade-in zoom-in duration-500">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-indigo-600">🎯</span> 목표가 달성 순위
            </h2>
            <div className="absolute top-6 right-6 text-xs text-slate-400">
                * 중심선에 가까울수록 목표가 도달 임박
            </div>

            <div className="mb-6 text-xs text-slate-500 flex justify-center items-center gap-6 bg-slate-50 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="w-16 h-2 rounded-full bg-gradient-to-l from-blue-500 to-transparent"></span>
                    <span>하한가 임박</span>
                </div>
                <span className="font-bold text-slate-300">|</span>
                <div className="flex items-center gap-2">
                    <span>상한가 임박</span>
                    <span className="w-16 h-2 rounded-full bg-gradient-to-r from-red-500 to-transparent"></span>
                </div>
            </div>

            {/* Debug Info Condensed (if data exists but clean logic might toggle) */}
            {(processingLogs.length > 0 && finalData.length < assets.length) && (
                <details className="mb-4 text-xs text-slate-400 cursor-pointer">
                    <summary>📋 일부 종목 제외됨 ({processingLogs.length}건)</summary>
                    <ul className="mt-2 list-disc list-inside bg-slate-50 p-2 rounded">
                        {processingLogs.map((log, idx) => <li key={idx}>{log}</li>)}
                    </ul>
                </details>
            )}

            {/* Error Banner if Partial Errors exist but some data is shown */}
            {fetchErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                    <p className="font-bold">⚠ 일부 종목 시세 조회 실패 ({fetchErrors.length}건)</p>
                    <details className="mt-1 cursor-pointer">
                        <summary>상세 보기</summary>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-red-500">
                            {fetchErrors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </details>
                </div>
            )}

            {/* Chart Container */}
            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={finalData}
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                        stackOffset="sign"
                    >
                        <XAxis type="number" hide domain={[-35, 35]} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                            interval={0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                        <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />

                        {/* Lower Bound Bar (Left/Blue) */}
                        <Bar dataKey="lowerBar" stackId="stack" barSize={12} radius={[4, 0, 0, 4]}>
                            {finalData.map((entry, index) => (
                                <Cell key={`cell-lower-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                            ))}
                        </Bar>

                        {/* Upper Bound Bar (Right/Red) */}
                        <Bar dataKey="upperBar" stackId="stack" barSize={12} radius={[0, 4, 4, 0]}>
                            {finalData.map((entry, index) => (
                                <Cell key={`cell-upper-${index}`} fill="#ef4444" fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
