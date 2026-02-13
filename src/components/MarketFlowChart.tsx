"use client";

import { useMemo, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Percent, Activity } from 'lucide-react';
import { useMarketIndex } from '@/hooks/useMarketIndex';
import SectorBarChart from './SectorBarChart';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
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

interface MarketExtraData {
    exchangeRates: {
        usd_krw: number;
        jpy_krw: number;
        cny_krw: number;
        updated: string;
    } | null;
    gold: {
        price_usd: number;
        updated: string;
    } | null;
    interestRates: {
        korea: { rate: number; date: string };
        us: { rate: number; date: string };
    } | null;
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
// 1. KOSPI Main Block (Chart + Investor Trend)
// ============================================================
function KospiMainBlock() {
    const indexData = useMarketIndex('0001', 0, 'KR');
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

    return (
        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-lg shadow-black/20 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-3 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-[#F7D047] rounded-full" />
                    <h3 className="text-xl font-bold text-white">KOSPI</h3>
                </div>
                <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                        {indexData.value > 0 ? Math.round(indexData.value).toLocaleString() : '...'}
                    </span>
                    {indexData.value > 0 && (
                        <div className={`flex items-center text-lg font-bold ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                            {isUp ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                            <span className="ml-1">{Math.round(Math.abs(indexData.change)).toLocaleString()}</span>
                            <span className="ml-2 text-base opacity-90">{isUp ? '+' : '-'}{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content: Chart (Left) + Investor (Right) */}
            <div className="flex flex-col lg:flex-row">
                {/* Chart Area */}
                <div className="flex-1 p-4 lg:p-6 min-h-[300px]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="kospiGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F7D047" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#F7D047" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => `${v.slice(4, 6)}/${v.slice(6, 8)}`}
                                    tick={{ fill: '#666', fontSize: 11 }}
                                    axisLine={{ stroke: '#333' }}
                                    tickLine={false}
                                    interval={Math.floor(chartData.length / 6)}
                                />
                                <YAxis
                                    domain={[minVal, maxVal]}
                                    tick={{ fill: '#666', fontSize: 11 }}
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
                                    stroke="#F7D047"
                                    strokeWidth={2}
                                    fill="url(#kospiGradient)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#F7D047' }}
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
                <div className="lg:w-[340px] border-t lg:border-t-0 lg:border-l border-[#333] p-5">
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
        <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#333] hover:border-[#555] transition-all group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    {flag && <span className="text-sm">{flag}</span>}
                    <span className="font-bold text-white text-sm">{name}</span>
                </div>
                {timeStr && <span className="text-[10px] text-gray-600">{timeStr}</span>}
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">
                    {hasData ? Math.round(indexData.value).toLocaleString() : '-'}
                </span>
                {hasData && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                        {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{Math.abs(indexData.changePercent).toFixed(2)}%</span>
                    </div>
                )}
            </div>
            {hasData && (
                <div className={`text-xs mt-1 ${isUp ? 'text-red-500/70' : 'text-blue-500/70'}`}>
                    {isUp ? '+' : ''}{Math.round(indexData.change).toLocaleString()}
                </div>
            )}
        </div>
    );
}

// ============================================================
// 3. Extra Market Data (Exchange Rates, Gold, Interest Rates)
// ============================================================
function ExtraMarketBlock() {
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

    if (!extra) {
        return (
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#333] animate-pulse">
                <div className="h-4 bg-[#252525] rounded w-32 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-[#252525] rounded" />)}
                </div>
            </div>
        );
    }

    const fmtIR = (date: string) => {
        if (!date) return '';
        // YYYY-MM-DD → YY.MM.DD
        const parts = date.split('-');
        if (parts.length >= 3) return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
        return date;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exchange Rates */}
            <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#333]">
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-green-400" />
                    환율
                </h4>
                <div className="space-y-2">
                    {extra.exchangeRates ? (
                        <>
                            <ExtraRow label="달러/원" value={`${extra.exchangeRates.usd_krw.toLocaleString()}원`} flag="🇺🇸" />
                            <ExtraRow label="100엔/원" value={`${extra.exchangeRates.jpy_krw.toLocaleString()}원`} flag="🇯🇵" />
                            <ExtraRow label="위안/원" value={`${extra.exchangeRates.cny_krw.toLocaleString()}원`} flag="🇨🇳" />
                        </>
                    ) : (
                        <span className="text-gray-500 text-sm">데이터 없음</span>
                    )}
                </div>
            </div>

            {/* Gold & Interest Rates */}
            <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#333]">
                <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                    <Percent size={14} className="text-amber-400" />
                    금 · 금리
                </h4>
                <div className="space-y-2">
                    {extra.gold && extra.gold.price_usd > 0 && (
                        <ExtraRow label="금 (1oz)" value={`$${extra.gold.price_usd.toLocaleString()}`} flag="🪙" />
                    )}
                    {extra.interestRates && (
                        <>
                            <ExtraRow
                                label="한국 기준금리"
                                value={`${extra.interestRates.korea.rate}%`}
                                sub={fmtIR(extra.interestRates.korea.date)}
                                flag="🇰🇷"
                            />
                            <ExtraRow
                                label="미국 기준금리"
                                value={`${extra.interestRates.us.rate}%`}
                                sub={fmtIR(extra.interestRates.us.date)}
                                flag="🇺🇸"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ExtraRow({ label, value, sub, flag }: { label: string; value: string; sub?: string; flag?: string }) {
    return (
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#252525] rounded-lg transition-colors">
            <div className="flex items-center gap-2">
                {flag && <span className="text-sm">{flag}</span>}
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-white">{value}</span>
                {sub && <span className="text-[10px] text-gray-500 ml-1.5">({sub})</span>}
            </div>
        </div>
    );
}

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

// ============================================================
// Main Export
// ============================================================
export default function MarketFlowChart() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} 기준`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white">지수종합</h2>
                <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
            </div>

            {/* 1. KOSPI Main Block (Chart + Investor) */}
            <KospiMainBlock />

            {/* 2. Other Indices Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <IndexCompactCard name="KOSDAQ" symbol="1001" category="KR" flag="🇰🇷" />
                <IndexCompactCard name="DOW" symbol=".DJI" category="US" flag="🇺🇸" />
                <IndexCompactCard name="NASDAQ" symbol="COMP" category="US" flag="🇺🇸" />
                <IndexCompactCard name="S&P 500" symbol="SPX" category="US" flag="🇺🇸" />
            </div>

            {/* 3. Exchange Rates, Gold, Interest Rates */}
            <ExtraMarketBlock />

            {/* 4. Market Trend Table */}
            <div className="bg-[#1E1E1E] rounded-xl p-5 border border-[#333]">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#333]">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-indigo-400" />
                        마켓트렌드 (투자자별 순매수)
                    </h3>
                    <span className="text-[10px] text-gray-500">단위/억원</span>
                </div>
                <div className="grid grid-cols-4 text-[10px] text-gray-500 pb-2 border-b border-[#333] px-2">
                    <span>종목명</span>
                    <span className="text-right">개인</span>
                    <span className="text-right">외국인</span>
                    <span className="text-right">기관</span>
                </div>
                <div>
                    <MarketTrendRow name="코스피" marketCode="0001" />
                    <MarketTrendRow name="코스닥" marketCode="1001" />
                    <MarketTrendRow name="ETF" marketCode="ETF" />
                </div>
            </div>

            {/* 5. Sector Bar Chart */}
            <SectorBarChart />
        </div>
    );
}
