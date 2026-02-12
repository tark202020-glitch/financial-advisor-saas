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
            <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-sm border border-[#333] animate-pulse">
                <div className="h-8 bg-[#333] rounded w-48 mb-6"></div>
                <div className="h-96 bg-[#252525] rounded"></div>
            </div>
        );
    }

    if (error || sectors.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#1E1E1E] rounded-xl shadow-lg shadow-black/20 border border-[#333] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#333]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl text-white">KOSPI 업종별 등락률</h3>
                        <span className="text-xs px-2.5 py-1 bg-[#F7D047]/20 text-[#F7D047] border border-[#F7D047]/50 rounded-full font-bold">HTS 0218</span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">단위: %</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="px-6 pt-6 pb-4">
                <div className="relative" style={{ height: '350px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-500 text-right pr-2">
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
                            <div className="absolute left-0 right-0 border-t border-gray-600 z-10" style={{ top: '50%' }}></div>

                            {/* Grid lines */}
                            <div className="absolute left-0 right-0 border-t border-dashed border-[#333]" style={{ top: '0%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-[#333]" style={{ top: '25%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-[#333]" style={{ top: '75%' }}></div>
                            <div className="absolute left-0 right-0 border-t border-dashed border-[#333]" style={{ top: '100%' }}></div>

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
                                                                ${isHighlight ? 'bg-gradient-to-t from-red-600 to-red-500' : 'bg-gradient-to-t from-red-500 to-red-400'}`}
                                                            style={{
                                                                bottom: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                        >
                                                            {/* Value label */}
                                                            {Math.abs(sector.changeRate) >= 0.5 && (
                                                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-500 whitespace-nowrap">
                                                                    +{sector.changeRate.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Negative bar */}
                                                    {!isUp && (
                                                        <div
                                                            className={`absolute w-[85%] max-w-[40px] rounded-b transition-all duration-700 ease-out
                                                                ${isHighlight ? 'bg-gradient-to-b from-blue-600 to-blue-500' : 'bg-gradient-to-b from-blue-500 to-blue-400'}`}
                                                            style={{
                                                                top: '50%',
                                                                height: `${barHeight}%`,
                                                            }}
                                                        >
                                                            {Math.abs(sector.changeRate) >= 0.5 && (
                                                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-500 whitespace-nowrap">
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
                                    <span className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight block truncate" title={sector.name}>
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
                <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#333] shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#333]">
                        {/* Column 1 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-gray-500 font-semibold bg-[#252525] px-4 py-3 border-b border-[#333]">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {[...marketSectors, ...industrySectors.slice(0, 5)].map(s => (
                                <div key={s.code} className={`grid grid-cols-3 text-sm px-4 py-2.5 border-b border-[#333] last:border-0 hover:bg-[#333] transition-colors
                                    ${['0001', '0002', '0003', '0004'].includes(s.code) ? 'font-bold bg-[#1E1E1E]' : ''}`}>
                                    <span className="text-gray-300 truncate">{s.name}</span>
                                    <span className="text-right text-gray-500 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-bold font-mono tracking-tight ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-gray-500 font-semibold bg-[#252525] px-4 py-3 border-b border-[#333]">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(5, 12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-[#333] last:border-0 hover:bg-[#333] transition-colors">
                                    <span className="text-gray-300 truncate">{s.name}</span>
                                    <span className="text-right text-gray-500 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono tracking-tight ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                        {s.changeRate >= 0 ? '+' : ''}{s.changeRate.toFixed(2)}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Column 3 */}
                        <div>
                            <div className="grid grid-cols-3 text-sm text-gray-500 font-semibold bg-[#252525] px-4 py-3 border-b border-[#333]">
                                <span>업종명</span>
                                <span className="text-right">지수</span>
                                <span className="text-right">등락률</span>
                            </div>
                            {industrySectors.slice(12).map(s => (
                                <div key={s.code} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-[#333] last:border-0 hover:bg-[#333] transition-colors">
                                    <span className="text-gray-300 truncate">{s.name}</span>
                                    <span className="text-right text-gray-500 font-mono tracking-tight">{s.index.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-right font-medium font-mono tracking-tight ${s.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
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
