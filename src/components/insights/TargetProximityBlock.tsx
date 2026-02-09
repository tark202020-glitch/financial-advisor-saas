"use client";

import React, { useMemo, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';

export default function TargetProximityBlock() {
    const { assets } = usePortfolio();
    const { subscribe, lastData } = useWebSocketContext();
    const [initialPrices, setInitialPrices] = React.useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = React.useState(true);

    // 0. Subscribe and Fetch Initial Data
    useEffect(() => {
        if (assets && assets.length > 0) {
            // Subscribe WS
            assets.forEach(asset => {
                if (asset.symbol) {
                    subscribe(asset.symbol, asset.category);
                }
            });

            // Fetch Initial Snapshot (for off-hours or immediate display)
            const fetchPrices = async () => {
                const priceMap = new Map<string, number>();

                await Promise.all(assets.map(async (asset) => {
                    try {
                        if (!asset.symbol) return;
                        // Use domestic/overseas generic endpoint logic or specific
                        const endpoint = asset.category === 'US'
                            ? `/api/kis/price/overseas/${asset.symbol}`
                            : `/api/kis/price/domestic/${asset.symbol}`;

                        const res = await fetch(endpoint);
                        const data = await res.json();

                        // Parse Price
                        let price = 0;
                        if (asset.category === 'US') {
                            // Overseas format might vary, check structure
                            // data.output.last (price)
                            price = parseFloat(data.output?.last || data.output?.base || 0);
                        } else {
                            // Domestic
                            // data.output.stck_prpr
                            price = parseInt(data.output?.stck_prpr || 0);
                        }

                        if (price > 0) {
                            priceMap.set(asset.symbol, price);
                        }
                    } catch (e) {
                        console.error(`Failed to fetch price for ${asset.symbol}`, e);
                    }
                }));

                setInitialPrices(priceMap);
                setIsLoading(false);
            };

            fetchPrices();
        } else {
            setIsLoading(false);
        }
    }, [assets, subscribe]);

    // 1. Prepare Data
    const data = useMemo(() => {
        return assets
            .map(asset => {
                const liveData = lastData.get(asset.symbol);
                // Prefer Live WS > Initial Fetch > Fallback
                const currentPrice = liveData?.price || initialPrices.get(asset.symbol);

                if (!currentPrice) return null; // Skip if no price data yet

                // Calculate Distances
                let lowerDistance = null;
                let upperDistance = null;

                if (asset.targetPriceLower) {
                    // (Current - Lower) / Current * 100
                    lowerDistance = ((currentPrice - asset.targetPriceLower) / currentPrice) * 100;
                }

                if (asset.targetPriceUpper) {
                    // (Upper - Current) / Current * 100
                    upperDistance = ((asset.targetPriceUpper - currentPrice) / currentPrice) * 100;
                }

                // Determine effective distance for sorting (smallest absolute value)
                const distL = lowerDistance !== null ? Math.abs(lowerDistance) : Infinity;
                const distU = upperDistance !== null ? Math.abs(upperDistance) : Infinity;

                // We pick the closer one.
                const closestDist = Math.min(distL, distU);

                const MAX_RANGE = 30; // Max percentage to visualize (e.g. 30% away)

                let lowerBar = 0;
                let upperBar = 0;

                if (lowerDistance !== null && Math.abs(lowerDistance) <= MAX_RANGE) {
                    lowerBar = -(MAX_RANGE - Math.abs(lowerDistance));
                }

                if (upperDistance !== null && Math.abs(upperDistance) <= MAX_RANGE) {
                    upperBar = MAX_RANGE - Math.abs(upperDistance);
                }

                // Filtering: Only show if valid targets exist
                if (lowerDistance === null && upperDistance === null) return null;

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
            // Sort: Smallest absolute distance first (closest to 0)
            .sort((a, b) => a.closestDist - b.closestDist);
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

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center text-slate-400 h-[500px] flex items-center justify-center">
                데이터를 불러오는 중입니다...
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

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center text-slate-400 h-[500px] flex items-center justify-center">
                표시할 데이터가 없거나 시세 정보를 불러오지 못했습니다. <br />
                (목표가를 설정했는지 확인해주세요)
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative">
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

            {/* Chart Container */}
            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
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
                            {data.map((entry, index) => (
                                <Cell key={`cell-lower-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                            ))}
                        </Bar>

                        {/* Upper Bound Bar (Right/Red) */}
                        <Bar dataKey="upperBar" stackId="stack" barSize={12} radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-upper-${index}`} fill="#ef4444" fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
