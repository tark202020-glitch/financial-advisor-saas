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
                <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
                <div className="h-96 bg-slate-100 rounded"></div>
            </div>
        );
    }

    if (error || sectors.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl text-slate-800">KOSPI 업종별 등락률</h3>
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">HTS 0218</span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">단위: %</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="px-6 pt-6 pb-4">
                <div className="relative" style={{ height: '350px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-slate-500 text-right pr-2">
                        <span>{maxAbs}</span>
                        <span>{(maxAbs / 2).toFixed(1)}</span>
                        <span>0</span>
                        <span>-{(maxAbs / 2).toFixed(1)}</span>
                        <span>-{maxAbs}</span>
                    </div>

                    {/* Chart area */}
                    <div className="ml-10 h-full flex flex-col">
                        {/* Bars container */}
                        <div className="flex-1 relative" style={{ minHeight: '280px' }}>
                            {/* Zero line */}
                            <div className="absolute left-0 right-0 border-t border-slate-300 z-10" style={{ top: '50%' }}></div>

                            {/* Grid lines */}
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '0%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '25%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '75%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: '100%' }}></div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full flex justify-between px-1" style={{ gap: '4px' }}>
                                    {sectors.map((sector, idx) => {
                                        const barHeight = Math.abs(sector.changeRate) / maxAbs * 50; // 50% = half height
                                        const isUp = sector.changeRate >= 0;
                                        const isHighlight = Math.abs(sector.changeRate) >= 3;

                                        return (
                                            <div key={sector.code} className="flex flex-col items-center flex-1" style={{ minWidth: 0 }}>
                                                <div className="relative w-full flex justify-center" style={{ height: '280px' }}>
                                                    {/* Positive bar */}
                                                    {isUp && (
                                                        <div
                                                            className={`absolute w-[85%] max-w-[40px] rounded-t transition-all duration-700 ease-out
                                                                ${isHighlight ? 'bg-gradient-to-t from-rose-600 to-pink-500' : 'bg-gradient-to-t from-rose-400 to-rose-300'}`}
                                                            style={{
                                                                bottom: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                        >
                                                            {/* Value label */}
                                                            {Math.abs(sector.changeRate) >= 0.5 && (
                                                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-700 whitespace-nowrap">
                                                                    +{sector.changeRate.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Negative bar */}
                                                    {!isUp && (
                                                        <div
                                                            className={`absolute w-[85%] max-w-[40px] rounded-b transition-all duration-700 ease-out
                                                                ${isHighlight ? 'bg-gradient-to-b from-blue-600 to-indigo-500' : 'bg-gradient-to-b from-blue-500 to-blue-300'}`}
                                                            style={{
                                                                top: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                        >
                                                            {Math.abs(sector.changeRate) >= 0.5 && (
                                                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-700 whitespace-nowrap">
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
                        <div className="flex justify-between px-1 mt-2 mb-1" style={{ gap: '4px' }}>
                            {sectors.map((sector) => (
                                <div key={sector.code} className="flex-1 text-center" style={{ minWidth: 0 }}>
                                    <span className="text-[10px] sm:text-xs text-slate-600 font-medium leading-tight block truncate" title={sector.name}>
                                        {sector.name.length > 4 ? sector.name.slice(0, 4) : sector.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend Table */}
            <div className="px-6 pb-6 pt-2">
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        {/* Column 1 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-slate-500 font-semibold bg-slate-100/80 px-4 py-3 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {[...marketSectors, ...industrySectors.slice(0, 5)].map(s => (
                                <div key={s.code} className={`grid grid-cols-3 text-sm px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-white transition-colors
                                    ${['0001', '0002', '0003', '0004'].includes(s.code) ? 'font-bold bg-white' : ''}`}>
                                    <span className="text-slate-800 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-bold font-mono tracking-tight ${s.changeRate >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-slate-500 font-semibold bg-slate-100/80 px-4 py-3 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(5, 12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                    <span className="text-slate-700 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono tracking-tight ${s.changeRate >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 3 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-slate-500 font-semibold bg-slate-100/80 px-4 py-3 border-b border-slate-200">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                    <span className="text-slate-700 truncate">{s.name}</span>
                                    <span className="text-right text-slate-600 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono tracking-tight ${s.changeRate >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}%
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
