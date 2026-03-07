"use client";

import { useMemo, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Percent, Activity } from 'lucide-react';
import { useMarketIndex } from '@/hooks/useMarketIndex';
import SectorBarChart from './SectorBarChart';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

// --- Types ---
interface InvestorData {
    individual: number;
    foreign: number;
    institution: number;
}

interface InvestorDailyRecord {
    date: string;
    individual: number;
    foreign: number;
    institution: number;
}

interface DailyIndexPoint {
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
}

// --- Types ---
interface YahooData {
    price: number;
    change: number;
    changePercent: number;
    updated: string;
}

interface MarketExtraData {
    exchangeRates: {
        usd_krw: YahooData;
        jpy_krw: YahooData;
        cny_krw: YahooData;
    } | null;
    gold: YahooData | null;
    interestRates: {
        korea: { rate: number; date: string };
        us: { rate: string | number; date: string };
    } | null;
    us10yTreasury: YahooData | null;
    us10yHistory?: Array<{ date: string, close: number, open: number }>;
    futures?: {
        nasdaq: YahooData | null;
        sp500: YahooData | null;
    };
    fetchedAt?: string;
}

// ============================================================
// 1. Overseas Market Block (해외 지수 종합)
// ============================================================
function OverseasMarketBlock({ extra }: { extra: MarketExtraData | null }) {
    if (!extra) {
        return (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-[#333] mb-6 animate-pulse">
                <div className="h-6 bg-[#252525] rounded w-1/4 mb-4" />
                <div className="h-32 bg-[#252525] rounded w-full" />
            </div>
        );
    }

    const refDate = extra.fetchedAt ? new Date(extra.fetchedAt) : new Date();
    const refDateStr = `${String(refDate.getMonth() + 1).padStart(2, '0')}/${String(refDate.getDate()).padStart(2, '0')} ${String(refDate.getHours()).padStart(2, '0')}:${String(refDate.getMinutes()).padStart(2, '0')}`;

    return (
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-lg shadow-black/20 overflow-hidden mb-6">
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#333] flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#3b82f6] rounded-full" />
                <h3 className="text-xl font-bold text-white">해외 지수 종합</h3>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left Column: Indices & Exchange Rates */}
                <div className="space-y-6">
                    {/* Indices */}
                    <div className="grid grid-cols-2 gap-4">
                        <IndexCompactCard name="NASDAQ" symbol="COMP" category="US" flag="🇺🇸" />
                        <IndexCompactCard name="S&P 500" symbol="SPX" category="US" flag="🇺🇸" />
                    </div>

                    {/* Exchange Rates */}
                    <div>
                        <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><DollarSign size={16} className="text-green-400" /> 환율</span>
                            <span className="text-[11px] text-gray-500 font-normal">{refDateStr} 기준</span>
                        </h4>
                        <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-1">
                            {extra.exchangeRates ? (
                                <>
                                    <ExtraRow label="달러/원" data={extra.exchangeRates.usd_krw} flag="🇺🇸" suffix="원" />
                                    <ExtraRow label="100엔/원" data={extra.exchangeRates.jpy_krw} flag="🇯🇵" suffix="원" multiplier={100} />
                                    <ExtraRow label="위안/원" data={extra.exchangeRates.cny_krw} flag="🇨🇳" suffix="원" />
                                </>
                            ) : (
                                <div className="p-3 text-sm text-gray-500 text-center">데이터 없음</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Futures & 10Y Treasury */}
                <div className="space-y-6">
                    {/* US 10Y Treasury Graph */}
                    <div>
                        <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Percent size={16} className="text-amber-400" /> 미국 10년물 국채 금리</span>
                            <span className="text-[11px] text-gray-500 font-normal">{refDateStr} 기준</span>
                        </h4>
                        <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-4 h-[160px] flex flex-col justify-center">
                            {extra.us10yHistory && extra.us10yHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={extra.us10yHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(v) => v.slice(5).replace('-', '/')} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }} formatter={(val: any) => [`${Number(val).toFixed(3)}%`, '국채 금리']} labelFormatter={(v) => v.replace('-', '/')} />
                                        <ReferenceLine y={4.1} stroke="#F7D047" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '4.1%', fill: '#F7D047', fontSize: 10 }} />
                                        <Bar dataKey="close" radius={[2, 2, 2, 2]}>
                                            {extra.us10yHistory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.close >= 4.1 ? '#ef4444' : '#3b82f6'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-6 font-bold">데이터 분석중...</div>
                            )}
                            {extra.us10yTreasury && (
                                <div className="mt-2 text-right">
                                    <span className="text-sm font-bold text-white">{extra.us10yTreasury.price.toFixed(3)}%</span>
                                    <span className={`text-xs ml-2 ${extra.us10yTreasury.change >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {extra.us10yTreasury.change >= 0 ? '▲' : '▼'} {Math.abs(extra.us10yTreasury.change).toFixed(3)} ({Math.abs(extra.us10yTreasury.changePercent).toFixed(2)}%)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Futures */}
                    <div>
                        <h4 className="font-bold text-gray-300 text-sm mb-3 flex items-center gap-1.5">
                            <Activity size={16} className="text-purple-400" /> 선물 지수
                        </h4>
                        <div className="bg-[#1A1A1A] rounded-xl border border-[#333] p-1 grid grid-cols-2 gap-2">
                            {extra.futures && extra.futures.nasdaq && (
                                <div className="p-3 border-r border-[#333] last:border-0">
                                    <div className="text-[11px] text-gray-400 mb-1">NASDAQ 100 선물</div>
                                    <div className="text-base font-bold text-white">{extra.futures.nasdaq.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                    <div className={`text-xs mt-0.5 ${extra.futures.nasdaq.change >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {extra.futures.nasdaq.change >= 0 ? '+' : ''}{extra.futures.nasdaq.change.toFixed(2)} ({extra.futures.nasdaq.changePercent.toFixed(2)}%)
                                    </div>
                                </div>
                            )}
                            {extra.futures && extra.futures.sp500 && (
                                <div className="p-3">
                                    <div className="text-[11px] text-gray-400 mb-1">S&P 500 선물</div>
                                    <div className="text-base font-bold text-white">{extra.futures.sp500.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                    <div className={`text-xs mt-0.5 ${extra.futures.sp500.change >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {extra.futures.sp500.change >= 0 ? '+' : ''}{extra.futures.sp500.change.toFixed(2)} ({extra.futures.sp500.changePercent.toFixed(2)}%)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function ExtraRow({ label, data, flag, prefix = '', suffix = '', multiplier = 1 }: { label: string; data: YahooData; flag?: string; prefix?: string; suffix?: string; multiplier?: number }) {
    if (!data) return null;

    // Apply multiplier (for 100 JPY)
    const price = data.price * multiplier;
    const change = data.change * multiplier;
    const isUp = change >= 0;

    return (
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#252525] rounded-lg transition-colors group">
            <div className="flex items-center gap-2">
                {flag && <span className="text-sm">{flag}</span>}
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            <div className="text-right">
                <div className="text-lg font-bold text-white">
                    {prefix}{price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{suffix}
                </div>
                <div className={`text-xs flex items-center justify-end gap-1 ${isUp ? 'text-red-400' : 'text-blue-400'}`}>
                    <span>{isUp ? '▲' : '▼'} {Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className="opacity-80">({Math.abs(data.changePercent).toFixed(2)}%)</span>
                </div>
            </div>
        </div>
    );
}

function ExtraRowSimple({ label, value, sub, flag }: { label: string; value: string; sub?: string; flag?: string }) {
    return (
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#252525] rounded-lg transition-colors">
            <div className="flex items-center gap-2">
                {flag && <span className="text-sm">{flag}</span>}
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-lg font-bold text-white">{value}</span>
                {sub && <span className="text-xs text-text-gray-500 ml-2 opacity-60">({sub})</span>}
            </div>
        </div>
    );
}
// --- Helper ---
function fmtInvestor(n: number) {
    return Math.abs(n / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtDate(yyyymmdd: string) {
    if (!yyyymmdd || yyyymmdd.length < 8) return yyyymmdd;
    return `${yyyymmdd.slice(2, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

// ============================================================
// 2. Domestic Market Block (국내 지수 종합)
// ============================================================
function KospiMainBlock() {
    const indexData = useMarketIndex('0001', 0, 'KR');
    const kosdaqData = useMarketIndex('1001', 0, 'KR');
    const [investor, setInvestor] = useState<InvestorData>({ individual: 0, foreign: 0, institution: 0 });
    const [dailyInvestor, setDailyInvestor] = useState<InvestorDailyRecord[]>([]);
    const [chartData, setChartData] = useState<DailyIndexPoint[]>([]);

    // Fetch KOSPI daily chart data (30 days)
    useEffect(() => {
        const fetchChart = async () => {
            try {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 45);

                const startDate = start.toISOString().slice(0, 10).replace(/-/g, '');
                const endDate = end.toISOString().slice(0, 10).replace(/-/g, '');

                const res = await fetch(`/api/kis/index/domestic/0001?startDate=${startDate}&endDate=${endDate}`);
                if (!res.ok) return;
                const data = await res.json();

                if (Array.isArray(data)) {
                    const points: DailyIndexPoint[] = data
                        .filter((d: any) => d.stck_bsop_date)
                        .map((d: any) => ({
                            date: d.stck_bsop_date,
                            close: parseFloat(d.bstp_nmix_prpr || '0'),
                            open: parseFloat(d.bstp_nmix_oprc || '0'),
                            high: parseFloat(d.bstp_nmix_hgpr || '0'),
                            low: parseFloat(d.bstp_nmix_lwpr || '0'),
                            volume: parseInt(d.acml_vol || '0')
                        }))
                        .reverse(); // Oldest first for chart
                    setChartData(points);
                }
            } catch (e) {
                console.log('[KOSPI Chart] fetch error', e);
            }
        };
        fetchChart();
    }, []);

    // Fetch investor data (realtime)
    useEffect(() => {
        const fetchInvestor = async () => {
            try {
                const res = await fetch('/api/kis/market/investor?symbol=0001');
                if (!res.ok) return;
                const data = await res.json();

                if (data?.realtime?.length > 0) {
                    const latest = data.realtime[0];
                    setInvestor({
                        individual: parseInt(latest.prsn_ntby_tr_pbmn || '0'),
                        foreign: parseInt(latest.frgn_ntby_tr_pbmn || '0'),
                        institution: parseInt(latest.orgn_ntby_tr_pbmn || '0'),
                    });
                }

                // Daily history from realtime array
                if (data?.realtime?.length > 1) {
                    const records: InvestorDailyRecord[] = data.realtime.slice(0, 7).map((r: any) => ({
                        date: r.stck_bsop_date || '',
                        individual: parseInt(r.prsn_ntby_tr_pbmn || '0'),
                        foreign: parseInt(r.frgn_ntby_tr_pbmn || '0'),
                        institution: parseInt(r.orgn_ntby_tr_pbmn || '0'),
                    }));
                    setDailyInvestor(records);
                }
            } catch (e) { }
        };
        fetchInvestor();
        const interval = setInterval(fetchInvestor, 60000);
        return () => clearInterval(interval);
    }, []);

    const isUp = indexData.change >= 0;
    const kosdaqIsUp = kosdaqData.change >= 0;
    const chartColor = isUp ? '#ef4444' : '#3b82f6';
    const chartGradientId = isUp ? 'kospiUp' : 'kospiDown';
    const investorColor = (n: number) => n > 0 ? 'text-red-500' : n < 0 ? 'text-blue-500' : 'text-gray-400';

    // Chart domain (min/max)
    const { minVal, maxVal } = useMemo(() => {
        if (chartData.length === 0) return { minVal: 0, maxVal: 0 };
        const lows = chartData.map(d => d.low).filter(v => v > 0);
        const highs = chartData.map(d => d.high).filter(v => v > 0);
        return {
            minVal: Math.floor(Math.min(...lows) * 0.995),
            maxVal: Math.ceil(Math.max(...highs) * 1.005)
        };
    }, [chartData]);

    // Format Reference Time string
    let timeStr = '';
    if (indexData.date && indexData.time) {
        timeStr = `${indexData.time.slice(0, 2)}:${indexData.time.slice(2, 4)} 기준`;
    }

    return (
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-lg shadow-black/20 overflow-hidden mb-6">
            {/* Header: KOSPI, Time, KOSDAQ */}
            <div className="px-4 py-4 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-6 sm:h-8 rounded-full ${isUp ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <h3 className="text-xl font-bold text-white">국내 지수 종합</h3>
                    </div>
                    {/* Small KOSDAQ info */}
                    <div className="flex items-center pl-4 border-l border-[#333] gap-2">
                        <span className="text-sm font-bold text-gray-400">KOSDAQ</span>
                        {kosdaqData.value > 0 ? (
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-white">{Math.round(kosdaqData.value).toLocaleString()}</span>
                                <span className={`text-xs font-bold ${kosdaqIsUp ? 'text-red-400' : 'text-blue-400'}`}>
                                    {kosdaqIsUp ? '▲' : '▼'} {Math.round(Math.abs(kosdaqData.change)).toLocaleString()} ({Math.abs(kosdaqData.changePercent).toFixed(2)}%)
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">로딩중...</span>
                        )}
                    </div>
                </div>

                <div className="flex items-baseline justify-end gap-3 text-right">
                    {timeStr && <span className="text-xs text-gray-500 mr-2 hidden sm:inline-block">{timeStr}</span>}
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {indexData.value > 0 ? Math.round(indexData.value).toLocaleString() : '...'}
                        </span>
                        {indexData.value > 0 && (
                            <div className={`flex items-center text-sm sm:text-lg font-bold ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                                {isUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                <span className="ml-1">{Math.round(Math.abs(indexData.change)).toLocaleString()}</span>
                                <span className="ml-2 text-xs sm:text-base opacity-90">{isUp ? '+' : '-'}{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content: Chart (Left) + Investor (Right) */}
            <div className="flex flex-col lg:flex-row">
                {/* Chart Area */}
                <div className="flex-1 p-3 sm:p-4 lg:p-6 min-h-[250px] sm:min-h-[300px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="kospiUp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="kospiDown" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => `${v.slice(4, 6)}/${v.slice(6, 8)}`}
                                    tick={{ fill: '#666', fontSize: 10 }}
                                    axisLine={{ stroke: '#333' }}
                                    tickLine={false}
                                    interval={Math.floor(chartData.length / 6)}
                                />
                                <YAxis
                                    domain={[minVal, maxVal]}
                                    tick={{ fill: '#666', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v.toLocaleString()}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', fontSize: '12px' }}
                                    labelFormatter={(v) => `${String(v).slice(0, 4)}-${String(v).slice(4, 6)}-${String(v).slice(6, 8)}`}
                                    formatter={(value: any) => [Math.round(Number(value)).toLocaleString(), 'KOSPI']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke={chartColor}
                                    strokeWidth={3}
                                    fill={`url(#${chartGradientId})`}
                                    dot={false}
                                    activeDot={{ r: 5, fill: chartColor, stroke: '#1E1E1E', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-600">
                            <div className="animate-pulse">차트 로딩 중...</div>
                        </div>
                    )}
                </div>

                {/* Investor Trend (Right) */}
                <div className="lg:w-[340px] border-t lg:border-t-0 lg:border-l border-[#333] p-4 sm:p-5">
                    <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                        <Activity size={14} className="text-[#F7D047]" />
                        투자자 동향
                    </h4>

                    {/* Today's Summary Bar */}
                    <div className="space-y-2 mb-4">
                        {[
                            { label: '개인', val: investor.individual },
                            { label: '외국인', val: investor.foreign },
                            { label: '기관', val: investor.institution },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-12">{label}</span>
                                <span className={`text-sm font-bold ${investorColor(val)} min-w-[60px]`}>
                                    {val > 0 ? '+' : ''}{fmtInvestor(val)}억
                                </span>
                                <div className="flex-1 h-2 bg-[#252525] rounded-full overflow-hidden">
                                    {val !== 0 && (
                                        <div
                                            className={`h-full rounded-full ${val > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{
                                                width: `${Math.min(Math.abs(val) / Math.max(Math.abs(investor.individual), Math.abs(investor.foreign), Math.abs(investor.institution), 1) * 100, 100)}%`,
                                                marginLeft: val < 0 ? 'auto' : 0,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Daily Table */}
                    {dailyInvestor.length > 0 && (
                        <div className="border-t border-[#333] pt-3">
                            <div className="grid grid-cols-4 text-[10px] text-gray-500 mb-1 px-1">
                                <span>일자</span>
                                <span className="text-right">개인</span>
                                <span className="text-right">외국인</span>
                                <span className="text-right">기관</span>
                            </div>
                            {dailyInvestor.map((r, i) => (
                                <div key={i} className="grid grid-cols-4 text-xs py-1.5 border-b border-[#2a2a2a] last:border-0 px-1 hover:bg-[#252525] transition-colors">
                                    <span className="text-gray-400">{fmtDate(r.date) || (i === 0 ? '오늘' : '')}</span>
                                    <span className={`text-right font-medium ${investorColor(r.individual)}`}>{r.individual > 0 ? '+' : ''}{fmtInvestor(r.individual)}</span>
                                    <span className={`text-right font-medium ${investorColor(r.foreign)}`}>{r.foreign > 0 ? '+' : ''}{fmtInvestor(r.foreign)}</span>
                                    <span className={`text-right font-medium ${investorColor(r.institution)}`}>{r.institution > 0 ? '+' : ''}{fmtInvestor(r.institution)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 2. Index Row (for KOSDAQ, DOW, NASDAQ, S&P500)
// ============================================================
function IndexCompactCard({ name, symbol, category, flag }: { name: string; symbol: string; category: 'KR' | 'US'; flag?: string }) {
    const indexData = useMarketIndex(symbol, 0, category);
    const hasData = indexData.value > 0;
    const isUp = indexData.change >= 0;

    let timeStr = '';
    if (category === 'US' && indexData.date && indexData.time) {
        const mm = indexData.date.slice(4, 6);
        const dd = indexData.date.slice(6, 8);
        const HH = indexData.time.slice(0, 2);
        const Min = indexData.time.slice(2, 4);
        timeStr = `${mm}/${dd} ${HH}:${Min}`;
    }

    return (
        <div className="bg-[#1E1E1E] rounded-xl p-3 sm:p-4 border border-[#333] hover:border-[#555] transition-all group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    {flag && <span className="text-xs sm:text-sm">{flag}</span>}
                    <span className="font-bold text-white text-xs sm:text-sm">{name}</span>
                </div>
                {timeStr && <span className="text-[10px] text-gray-600 hidden sm:block">{timeStr}</span>}
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-extrabold text-white">
                    {hasData ? Math.round(indexData.value).toLocaleString() : '-'}
                </span>
                {hasData && (
                    <div className={`flex items-center gap-1 font-bold ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                        {isUp ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        <span className="text-base sm:text-xl">{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                    </div>
                )}
            </div>
            {hasData && (
                <div className={`text-[10px] sm:text-xs mt-1 ${isUp ? 'text-red-500/70' : 'text-blue-500/70'}`}>
                    {isUp ? '+' : ''}{Math.round(indexData.change).toLocaleString()}
                </div>
            )}
        </div>
    );
}

// ============================================================




// ============================================================
// 4. Market Trend Table (Investor by Market)
// ============================================================
function MarketTrendRow({ name, marketCode }: { name: string; marketCode: string }) {
    const [investor, setInvestor] = useState<InvestorData>({ individual: 0, foreign: 0, institution: 0 });

    useEffect(() => {
        const fetchInvestor = async () => {
            try {
                const res = await fetch(`/api/kis/market/investor?symbol=${marketCode}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.realtime?.length > 0) {
                    const latest = data.realtime[0];
                    setInvestor({
                        individual: parseInt(latest.prsn_ntby_tr_pbmn || '0'),
                        foreign: parseInt(latest.frgn_ntby_tr_pbmn || '0'),
                        institution: parseInt(latest.orgn_ntby_tr_pbmn || '0'),
                    });
                }
            } catch (e) { }
        };
        fetchInvestor();
    }, [marketCode]);

    const fmt = (n: number) => (n / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const col = (n: number) => n > 0 ? 'text-red-500' : n < 0 ? 'text-blue-500' : 'text-gray-400';

    return (
        <div className="grid grid-cols-4 py-3 border-b border-[#2a2a2a] last:border-0 items-center hover:bg-[#252525] px-2 transition-colors">
            <div className="font-bold text-sm text-white">{name}</div>
            <div className={`text-right text-sm font-medium ${col(investor.individual)}`}>{fmt(investor.individual)}</div>
            <div className={`text-right text-sm font-medium ${col(investor.foreign)}`}>{fmt(investor.foreign)}</div>
            <div className={`text-right text-sm font-medium ${col(investor.institution)}`}>{fmt(investor.institution)}</div>
        </div>
    );
}

export default function MarketFlowChart() {
    const [extra, setExtra] = useState<MarketExtraData | null>(null);

    useEffect(() => {
        const fetchExtra = async () => {
            try {
                const res = await fetch('/api/market-extra');
                if (!res.ok) return;
                const data = await res.json();
                setExtra(data);
            } catch (e) { }
        };
        fetchExtra();
    }, []);

    return (
        <div className="space-y-2">
            {/* 1. 해외 관련 지수 종합 */}
            <OverseasMarketBlock extra={extra} />

            {/* 2. 국내 지수 종합 */}
            <KospiMainBlock />

            {/* 3. KOSPI 업종별 등락률 */}
            <div className="mt-8">
                <SectorBarChart />
            </div>
        </div>
    );
}
