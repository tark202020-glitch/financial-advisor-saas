"use client";

import { useState, useEffect, useMemo } from 'react';

interface SectorData {
    code: string;
    name: string;
    index: number;
    change: number;
    changeRate: number;
    sign: string; // "2"=up, "5"=down
}

export default function SectorBarChart() {
    const [sectors, setSectors] = useState<SectorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSectors = async () => {
            try {
                const res = await fetch('/api/kis/market/sector');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (data.sectors) {
                    setSectors(data.sectors);
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSectors();
        const interval = setInterval(fetchSectors, 120000); // 2min refresh
        return () => clearInterval(interval);
    }, []);

    // Separate "종합/대형주/중형주/소형주" from industry sectors
    const marketSectors = useMemo(() => sectors.filter(s =>
        ['0001', '0002', '0003', '0004'].includes(s.code)
    ), [sectors]);

    const industrySectors = useMemo(() => sectors.filter(s =>
        !['0001', '0002', '0003', '0004'].includes(s.code)
    ), [sectors]);

    // For chart scaling
    const allRates = sectors.map(s => s.changeRate);
    const maxAbs = Math.max(Math.ceil(Math.max(...allRates.map(Math.abs), 1)), 1);

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
                <div className="h-64 bg-slate-100 rounded"></div>
            </div>
        );
    }

    if (error || sectors.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-800">KOSPI 업종별 등락률</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">HTS 0218</span>
                    </div>
                    <span className="text-xs text-slate-400">단위: %</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="px-4 pt-4 pb-2">
                <div className="relative" style={{ height: '280px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-24 w-8 flex flex-col justify-between text-[10px] text-slate-400 text-right pr-1">
                        <span>{maxAbs}</span>
                        <span>{(maxAbs / 2).toFixed(1)}</span>
                        <span>0</span>
                        <span>-{(maxAbs / 2).toFixed(1)}</span>
                        <span>-{maxAbs}</span>
                    </div>

                    {/* Chart area */}
                    <div className="ml-8 h-full flex flex-col">
                        {/* Bars container */}
                        <div className="flex-1 relative" style={{ minHeight: '200px' }}>
                            {/* Zero line */}
                            <div className="absolute left-0 right-0 border-t border-slate-300" style={{ top: '50%' }}></div>

                            {/* Grid lines */}
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '0%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '25%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '75%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '100%' }}></div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full flex justify-between px-1" style={{ gap: '2px' }}>
                                    {sectors.map((sector, idx) => {
                                        const barHeight = Math.abs(sector.changeRate) / maxAbs * 50; // 50% = half height
                                        const isUp = sector.changeRate >= 0;
                                        const isHighlight = Math.abs(sector.changeRate) >= 3;

                                        return (
                                            <div key={sector.code} className="flex flex-col items-center flex-1" style={{ minWidth: 0 }}>
                                                <div className="relative w-full flex justify-center" style={{ height: '200px' }}>
                                                    {/* Positive bar (grows upward from center) */}
                                                    {isUp && (
                                                        <div
                                                            className={`absolute w-[80%] max-w-[28px] rounded-t-sm transition-all duration-700 ease-out
                                                                ${isHighlight ? 'bg-gradient-to-t from-rose-500 to-pink-400' : 'bg-gradient-to-t from-rose-400 to-rose-300'}`}
                                                            style={{
                                                                bottom: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                            title={`${sector.name}: ${sector.changeRate > 0 ? '+' : ''}${sector.changeRate.toFixed(2)}%`}
                                                        >
                                                            {/* Value label on top */}
                                                            {Math.abs(sector.changeRate) >= 1 && (
                                                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-600 whitespace-nowrap">
                                                                    +{sector.changeRate.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Negative bar (grows downward from center) */}
                                                    {!isUp && (
                                                        <div
                                                            className={`absolute w-[80%] max-w-[28px] rounded-b-sm transition-all duration-700 ease-out
                                                                ${isHighlight ? 'bg-gradient-to-b from-blue-500 to-indigo-400' : 'bg-gradient-to-b from-blue-400 to-blue-300'}`}
                                                            style={{
                                                                top: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                            title={`${sector.name}: ${sector.changeRate.toFixed(2)}%`}
                                                        >
                                                            {Math.abs(sector.changeRate) >= 1 && (
                                                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-600 whitespace-nowrap">
                                                                    {sector.changeRate.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-between px-1 mt-1" style={{ gap: '2px' }}>
                            {sectors.map((sector) => (
                                <div key={sector.code} className="flex-1 text-center" style={{ minWidth: 0 }}>
                                    <span className="text-[8px] text-slate-500 leading-none block truncate" title={sector.name}>
                                        {sector.name.length > 3 ? sector.name.slice(0, 3) : sector.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend Table */}
            <div className="px-4 pb-4 pt-2">
                <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <div className="grid grid-cols-3 divide-x divide-slate-200">
                        {/* Column 1 */}
                        <div>
                            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1.5 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {[...marketSectors, ...industrySectors.slice(0, 5)].map(s => (
                                <div key={s.code} className={`grid grid-cols-3 text-[11px] px-2 py-1 border-b border-slate-50 hover:bg-white transition-colors
                                    ${['0001', '0002', '0003', '0004'].includes(s.code) ? 'font-bold' : ''}`}>
                                    <span className="text-slate-700 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div>
                            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1.5 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(5, 12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-[11px] px-2 py-1 border-b border-slate-50 hover:bg-white transition-colors">
                                    <span className="text-slate-700 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 3 */}
                        <div>
                            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1.5 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-[11px] px-2 py-1 border-b border-slate-50 hover:bg-white transition-colors">
                                    <span className="text-slate-700 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
