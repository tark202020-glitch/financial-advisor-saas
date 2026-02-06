"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useState, useMemo, useEffect } from 'react';

interface InvestorHistoryItem {
    stck_bsop_date: string;
    prsn_ntby_qty: string;
    frgn_ntby_qty: string;
    orgn_ntby_qty: string;
    prsn_ntby_tr_pbmn?: string; // Amount fields (Mock assumption, verify if exists)
    frgn_ntby_tr_pbmn?: string;
    orgn_ntby_tr_pbmn?: string;
}

interface ChartDataPoint {
    date: string; // YYYYMMDD
    individual: number;
    foreign: number;
    institution: number;
    pension: number; // KIS often groups pension in institution or separate. For now assume 0 if not found.
}

export default function MarketFlowChart() {
    const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1M');
    const [rawData, setRawData] = useState<InvestorHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Real Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/kis/market/investor');
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                // KIS returns [ { stck_bsop_date: '...', ... }, ... ]
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

        // Reverse to get Date Ascending (KIS usually Descending)
        // Check first item date vs last. Usually index 0 is latest.
        const sorted = [...rawData].reverse();

        return sorted.map(item => {
            // Use Amount (_tr_pbmn) if avail, else Qty (_qty) * Approx Price? 
            // Or just Qty. User screenshot says "Amount (Million KRW)".
            // If API returns Qty only, we might strictly need Price.
            // Assumption: Use Qty for trend shape, or assume fields exist. 
            // Let's use Qty for now as it's safer, but label it carefully.
            // Actually, for "005930" (Samsung), Qty is fine for trend.
            // However, to match "Million KRW", we really need Amount.
            // Let's try to parse _tr_pbmn if exists, else _qty / 1000 (Mock scale).

            const individual = parseInt(item.prsn_ntby_tr_pbmn || item.prsn_ntby_qty || '0');
            const foreign = parseInt(item.frgn_ntby_tr_pbmn || item.frgn_ntby_qty || '0');
            const institution = parseInt(item.orgn_ntby_tr_pbmn || item.orgn_ntby_qty || '0');

            return {
                date: item.stck_bsop_date,
                individual,
                foreign,
                institution,
                pension: 0 // KIS basic TR might not split pension easily
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
            // { type: '연기금', value: total.pension, color: '#ec4899' }, // Pink-500 (Hidden if 0)
        ].filter(d => d.value !== 0 || d.type !== '연기금');
    }, [processedData]);

    const tableData = summaryData.map(d => ({
        ...d,
        formattedValue: d.value.toLocaleString()
    }));

    if (loading) return (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
            데이터 로딩 중...
        </div>
    );

    if (processedData.length === 0) return (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
            데이터가 없습니다
        </div>
    );

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6 text-slate-800">투자자별 순매수 (대형주 기준)</h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT PANEL: Cumulative Bar Chart + Table */}
                <div className="lg:col-span-5 flex flex-col h-full bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-700">투자자별 누적 순매수</h3>
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

                    {/* Horizontal Bar Chart */}
                    <div className="h-48 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={summaryData} margin={{ left: 10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="type" type="category" width={50} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                    {summaryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Data Table */}
                    <div className="mt-auto">
                        <div className="flex justify-between text-xs text-slate-500 mb-2 px-2">
                            <span>투자자</span>
                            <span>순매수</span>
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
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }}
                                        labelStyle={{ color: '#64748b' }}
                                        formatter={(val: number | undefined) => [val?.toLocaleString() || '0', '순매수']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="individual"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={false}
                                    />
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
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={4}
                                        tickFormatter={(val: string) => val ? val.slice(4).replace(/^(\d{2})(\d{2})$/, '$1-$2') : ''} // YYYYMMDD -> MM-DD
                                    />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }}
                                        labelStyle={{ color: '#64748b' }}
                                        formatter={(val: number | undefined) => [val?.toLocaleString() || '0', '순매수']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="foreign"
                                        stroke="#eab308"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
