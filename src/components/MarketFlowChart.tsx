"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import { useMarketIndex } from '@/hooks/useMarketIndex';
import { useStockPrice } from '@/hooks/useStockPrice';
import { ArrowUp, ArrowDown } from 'lucide-react';

// --- Types for Data ---
interface InvestorHistoryItem {
    stck_bsop_date: string;
    prsn_ntby_qty: string;
    frgn_ntby_qty: string;
    orgn_ntby_qty: string;
    prsn_ntby_tr_pbmn?: string;
    frgn_ntby_tr_pbmn?: string;
    orgn_ntby_tr_pbmn?: string;
}

interface ChartDataPoint {
    date: string; // YYYYMMDD
    individual: number;
    foreign: number;
    institution: number;
    pension: number;
}

// --- Reused Index Display Component ---
interface MarketIndex {
    name: string;
    value: number;
    change: number;
    changePercent: number;
}

const INDICES_LIST: MarketIndex[] = [
    { name: 'KOSPI', value: 0, change: 0, changePercent: 0 },
    { name: 'KOSDAQ', value: 0, change: 0, changePercent: 0 },
    { name: 'NASDAQ', value: 0, change: 0, changePercent: 0 },
    { name: 'S&P 500', value: 0, change: 0, changePercent: 0 },
];

function IndexDisplay({ indexName }: { indexName: string }) {
    let symbol = '';
    let category: 'KR' | 'US' = 'KR';
    let isStockProxy = false;

    if (indexName === 'KOSPI') {
        symbol = '0001';
        category = 'KR';
    } else if (indexName === 'KOSDAQ') {
        symbol = '1001';
        category = 'KR';
    } else if (indexName === 'NASDAQ') {
        symbol = 'QQQ';
        isStockProxy = true;
        category = 'US';
    } else if (indexName === 'S&P 500') {
        symbol = 'SPY';
        isStockProxy = true;
        category = 'US';
    }

    const indexData = useMarketIndex(symbol, 0, category);
    const stockData = useStockPrice(symbol, 0, 'US');
    const data = isStockProxy ? stockData : indexData; // Prioritize one hook result

    // Check validity
    const hasData = !!data && (isStockProxy ? (data as any).price > 0 : (data as any).value > 0);

    if (!hasData || !data) {
        return (
            <div className="flex flex-col items-start bg-slate-50 rounded-lg p-3 min-w-[120px] border border-slate-100">
                <span className="text-xs font-bold text-slate-500 mb-1">{indexName}</span>
                <span className="text-sm font-semibold text-slate-400">Loading...</span>
            </div>
        );
    }

    const val = isStockProxy ? (data as any).price : (data as any).value;
    const change = (data as any).change;
    const pct = (data as any).changePercent || (data as any).rate || 0;
    const isUp = change >= 0;

    return (
        <div className="flex flex-col items-start bg-slate-50 rounded-lg p-3 min-w-[140px] border border-slate-100 shadow-sm">
            <span className="text-xs font-bold text-slate-500 mb-1">{indexName}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-800">{val.toLocaleString()}</span>
            </div>
            <div className={`flex items-center text-xs font-medium ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span className="ml-0.5">{Math.abs(change).toLocaleString()} ({Math.abs(pct).toFixed(2)}%)</span>
            </div>
        </div>
    );
}


export default function MarketFlowChart() {
    const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1M');
    const [rawData, setRawData] = useState<InvestorHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Real Data (Use KOSPI Market Trend)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch KOSPI Market Investor Trend
                const res = await fetch('/api/kis/market/investor?symbol=0001');
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setRawData(data);
                }
            } catch (e) {
                console.error("Investor Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Process Data
    const processedData: ChartDataPoint[] = useMemo(() => {
        if (!rawData.length) return [];
        const sorted = [...rawData].reverse();

        return sorted.map(item => {
            // Ensure we parse Amount fields if available, otherwise fallback
            // KIS 'inquire-daily-index-investor' usually provides amount in Million KRW directly?
            // Let's assume fields are same but check values.
            const individual = parseInt(item.prsn_ntby_tr_pbmn || item.prsn_ntby_qty || '0');
            const foreign = parseInt(item.frgn_ntby_tr_pbmn || item.frgn_ntby_qty || '0');
            const institution = parseInt(item.orgn_ntby_tr_pbmn || item.orgn_ntby_qty || '0');

            return {
                date: item.stck_bsop_date,
                individual,
                foreign,
                institution,
                pension: 0
            };
        });
    }, [rawData]);

    // Summarize for Bar Chart
    const summaryData = useMemo(() => {
        const total = processedData.reduce((acc, curr) => ({
            individual: acc.individual + curr.individual,
            foreign: acc.foreign + curr.foreign,
            institution: acc.institution + curr.institution,
            pension: acc.pension + curr.pension,
        }), { individual: 0, foreign: 0, institution: 0, pension: 0 });

        return [
            { type: '개인', value: total.individual, color: '#8b5cf6' }, // Violet-500
            { type: '외국인', value: total.foreign, color: '#eab308' }, // Yellow-500
            { type: '기관', value: total.institution, color: '#22c55e' }, // Green-500
        ].filter(d => d.value !== 0);
    }, [processedData]);

    const tableData = summaryData.map(d => ({
        ...d,
        formattedValue: d.value.toLocaleString()
    }));

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            {/* Header with Indices */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-800">시장정보 (Market Info)</h2>
                <div className="flex flex-wrap gap-4 pb-4 border-b border-slate-100">
                    {INDICES_LIST.map(idx => (
                        <IndexDisplay key={idx.name} indexName={idx.name} />
                    ))}
                </div>
            </div>

            <h3 className="text-lg font-bold mb-6 text-slate-700">투자자별 순매수 (KOSPI)</h3>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                    데이터 로딩 중...
                </div>
            ) : processedData.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                    데이터가 없습니다
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT PANEL: Cumulative Bar Chart + Table */}
                    <div className="lg:col-span-5 flex flex-col h-full bg-slate-50 rounded-xl p-6 border border-slate-200">
                        {/* ... (Same Chart Logic) ... */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-700">누적 순매수 현황</h3>
                            <div className="flex bg-slate-200 rounded-lg p-1 text-xs">
                                {['1일', '1주', '1개월', '3개월'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p as any)}
                                        className={`px-2 py-1 rounded transition-colors ${period === p ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-48 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={summaryData} margin={{ left: 10, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="type" type="category" width={50} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                        {summaryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-auto">
                            <div className="flex justify-between text-xs text-slate-500 mb-2 px-2">
                                <span>투자자</span>
                                <span>순매수 (백만원)</span>
                            </div>
                            <div className="space-y-3 bg-white p-2 rounded-lg border border-slate-100">
                                {tableData.map((item) => (
                                    <div key={item.type} className="flex justify-between items-center px-2 py-1">
                                        <span className="text-slate-600 font-medium">{item.type}</span>
                                        <span className={`font-bold ${item.value > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                            {item.formattedValue}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right text-[10px] text-slate-400 mt-4">
                                출처: 한국투자증권 (KIS) API
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Trends */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {/* 1. Individual Trend */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-64">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                최근 1개월간 <span className="text-violet-500 text-lg">개인</span> 순매수 추이
                            </h3>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={processedData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(val: any) => [val?.toLocaleString(), '순매수']} />
                                        <Line type="monotone" dataKey="individual" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Foreign Trend */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-64">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                최근 1개월간 <span className="text-yellow-500 text-lg">외국인</span> 순매수 추이
                            </h3>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={processedData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(val: any) => [val?.toLocaleString(), '순매수']} />
                                        <Line type="monotone" dataKey="foreign" stroke="#eab308" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
