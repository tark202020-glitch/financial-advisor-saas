"use client";

import React, { useState, useMemo } from 'react';
import { useReportData } from '@/hooks/useReportData';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Line, Legend, ReferenceLine, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Loader2, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';

function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDefaultDates() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startYear = currentYear;
    let startMonth = currentMonth - 1;
    if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
    }
    
    const startDate = new Date(startYear, startMonth, 28);
    const endDate = new Date(currentYear, currentMonth, 28);
    
    return {
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
    };
}

export default function ReportDashboard() {
    const defaultDates = useMemo(() => getDefaultDates(), []);
    const [startDate, setStartDate] = useState(defaultDates.startDate);
    const [endDate, setEndDate] = useState(defaultDates.endDate);
    
    // 실제 조회에 사용되는 날짜 (버튼 클릭 시에만 업데이트)
    const [queryStartDate, setQueryStartDate] = useState(defaultDates.startDate);
    const [queryEndDate, setQueryEndDate] = useState(defaultDates.endDate);

    const handleFetchData = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 100) {
            alert('조회 기간은 100일을 초과할 수 없습니다. 시작일을 자동으로 조정합니다.');
            const newStart = new Date(end);
            newStart.setDate(newStart.getDate() - 100);
            
            const year = newStart.getFullYear();
            const month = String(newStart.getMonth() + 1).padStart(2, '0');
            const day = String(newStart.getDate()).padStart(2, '0');
            const adjusted = `${year}-${month}-${day}`;
            setStartDate(adjusted);
            setQueryStartDate(adjusted);
            setQueryEndDate(endDate);
        } else {
            setQueryStartDate(startDate);
            setQueryEndDate(endDate);
        }
    };

    const { isLoading, chartData, tradeLogs, failedSymbols } = useReportData(queryStartDate, queryEndDate);

    // Number formatter
    const formatKrw = (val: number) => {
        if (Math.abs(val) >= 100000000) {
            return `${(val / 100000000).toFixed(2)}억 원`;
        } else if (Math.abs(val) >= 10000) {
            return `${(val / 10000).toFixed(0)}만 원`;
        }
        return `${val.toLocaleString()} 원`;
    };

    const profitColor = (val: number) => {
        if (val > 0) return 'text-red-400';
        if (val < 0) return 'text-blue-400';
        return 'text-gray-400';
    };

    // Calculate Summary inside the period
    const summary = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        const firstData = chartData[0];
        const lastData = chartData[chartData.length - 1];

        // 기간 총 변동: 마지막날 평가액 - 첫날 평가액
        const periodTotalChange = lastData.valuation - firstData.valuation;
        
        // 추가 투입금: 마지막날 투자액 - 첫날 투자액 (기간 중 순입금액)
        const periodInvestmentChange = lastData.investment - firstData.investment;

        // 순수 평가손익: 총 변동 - 추가 투입금 (시장 수익만 분리)
        const pureProfit = periodTotalChange - periodInvestmentChange;

        // 기간 수익률(%): 순수 평가손익 ÷ 기초 투자금 × 100
        const returnRate = firstData.investment > 0 ? (pureProfit / firstData.investment) * 100 : 0;

        return {
            periodTotalChange,
            periodInvestmentChange,
            pureProfit,
            returnRate,
        };
    }, [chartData]);

    // KPI 카드 계산식 확장 상태
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const toggleCard = (key: string) => setExpandedCard(prev => prev === key ? null : key);

    const tradeSummary = useMemo(() => {
        let totalBuy = 0;
        let totalSell = 0;
        let totalDividend = 0;
        tradeLogs.forEach(log => {
            const rate = log.exchangeRateUsed || 1;
            const amt = log.price * log.quantity * rate;
            if (log.type === 'BUY') totalBuy += amt;
            else if (log.type === 'SELL') totalSell += amt;
            else if (log.type === 'DIVIDEND') totalDividend += amt;
        });
        return { totalBuy, totalSell, totalDividend };
    }, [tradeLogs]);

    // 테이블 정렬 상태
    type SortKey = 'trade_date' | 'type' | 'name' | 'price' | 'quantity' | 'totalAmt' | 'sellProfit' | 'sellProfitRate';
    const [sortKey, setSortKey] = useState<SortKey>('trade_date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sortedTradeLogs = useMemo(() => {
        const sorted = [...tradeLogs];
        sorted.sort((a, b) => {
            let valA: any, valB: any;
            switch (sortKey) {
                case 'trade_date': valA = a.trade_date; valB = b.trade_date; break;
                case 'type': valA = a.type; valB = b.type; break;
                case 'name': valA = a.name; valB = b.name; break;
                case 'price': valA = a.price; valB = b.price; break;
                case 'quantity': valA = a.quantity; valB = b.quantity; break;
                case 'totalAmt': valA = a.price * a.quantity; valB = b.price * b.quantity; break;
                case 'sellProfit': valA = a.sellProfit ?? -Infinity; valB = b.sellProfit ?? -Infinity; break;
                case 'sellProfitRate': valA = a.sellProfitRate ?? -Infinity; valB = b.sellProfitRate ?? -Infinity; break;
                default: valA = a.trade_date; valB = b.trade_date;
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [tradeLogs, sortKey, sortDir]);

    // 날짜별 매수/매도 금액 집계 (막대 차트용 - 매도는 음수)
    const dailyTradeChartData = useMemo(() => {
        if (tradeLogs.length === 0) return [];
        const dayMap: Record<string, { date: string; buyAmount: number; sellAmount: number }> = {};
        
        const dates = tradeLogs.map(l => l.trade_date);
        const minDateStr = dates.reduce((a, b) => a < b ? a : b);
        const maxDateStr = dates.reduce((a, b) => a > b ? a : b);
        
        let currentStr = minDateStr;
        while (currentStr <= maxDateStr) {
            dayMap[currentStr] = { date: currentStr, buyAmount: 0, sellAmount: 0 };
            
            const d = new Date(currentStr);
            d.setDate(d.getDate() + 1);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            currentStr = `${year}-${month}-${day}`;
        }

        tradeLogs.forEach(log => {
            const dt = log.trade_date;
            if (dayMap[dt]) {
                const amt = log.price * log.quantity;
                if (log.type === 'BUY') dayMap[dt].buyAmount += amt;
                else if (log.type === 'SELL') dayMap[dt].sellAmount -= amt; // 음수로 저장
            }
        });
        return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    }, [tradeLogs]);

    return (
        <div className="space-y-6">
            {/* Headers & Controls */}
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">조사 기간 설정</h2>
                        <p className="text-sm text-gray-400">지정한 기간 동안의 데이터와 매매 이력을 불러옵니다.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-[#2A2A2A] p-2.5 rounded-xl border border-[#444]">
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-white outline-none text-sm font-medium"
                            />
                            <span className="text-gray-500 font-bold">~</span>
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-white outline-none text-sm font-medium"
                            />
                        </div>
                        <button
                            onClick={handleFetchData}
                            disabled={isLoading}
                            className="px-5 py-2.5 bg-[#F7D047] hover:bg-[#f5c726] text-black font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isLoading ? '조회 중...' : '데이터 불러오기'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 실패 종목 경고창 */}
            {failedSymbols && failedSymbols.length > 0 && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-red-400 font-bold text-sm mb-1">데이터 조회 실패 알림</h4>
                        <p className="text-red-200 text-xs leading-relaxed">
                            다음 종목의 과거 주가 데이터를 불러오지 못했습니다: <span className="font-bold text-red-100">{failedSymbols.join(', ')}</span><br/>
                            3회 이상 재시도하였으나 해당 일자의 주가를 확보하지 못하여, 위 종목의 평가 금액이 차트에서 부정확하게 표시될 수 있습니다.
                        </p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
                    <Loader2 className="animate-spin text-[#F7D047] mb-4" size={40} />
                    <p className="text-white font-bold text-lg mb-2">데이터를 분석 중입니다</p>
                    <p className="text-gray-400 text-sm text-center max-w-md">
                        보유 종목의 과거 주가를 순차적으로 조회하고 있습니다.<br/>
                        종목 수에 따라 1~2분 소요될 수 있습니다.
                    </p>
                    <div className="mt-4 w-48 h-1 bg-[#333] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F7D047] rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
                    <AlertCircle className="text-gray-500 mb-4" size={40} />
                    <p className="text-gray-400 font-medium">선택하신 기간의 데이터 기록이 부족합니다.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Summary Cards */}
                    {summary && (() => {
                        const first = chartData[0];
                        const last = chartData[chartData.length - 1];
                        const cards = [
                            {
                                key: 'pureProfit',
                                label: '순수 평가손익',
                                formatted: `${summary.pureProfit >= 0 ? '+' : ''}${formatKrw(summary.pureProfit)}`,
                                iconBg: summary.pureProfit >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                                textColor: summary.pureProfit >= 0 ? '#f87171' : '#60a5fa',
                                icon: summary.pureProfit >= 0 ? <TrendingUp size={16} color="#f87171" /> : <TrendingDown size={16} color="#60a5fa" />,
                                desc: '추가 입금 제외한 시장 수익',
                                formula: `기간 총 변동 - 추가 투입금`,
                                detail: `= ${formatKrw(summary.periodTotalChange)} - ${formatKrw(summary.periodInvestmentChange)}\n= (종료 평가금 ${formatKrw(last.valuation)} - 시작 평가금 ${formatKrw(first.valuation)}) - (종료 투자금 ${formatKrw(last.investment)} - 시작 투자금 ${formatKrw(first.investment)})`,
                            },
                            {
                                key: 'returnRate',
                                label: '기간 수익률',
                                formatted: `${summary.returnRate >= 0 ? '+' : ''}${summary.returnRate.toFixed(2)}%`,
                                iconBg: summary.returnRate >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                                textColor: summary.returnRate >= 0 ? '#f87171' : '#60a5fa',
                                icon: <Percent size={16} color={summary.returnRate >= 0 ? '#f87171' : '#60a5fa'} />,
                                desc: '기초 투자금 대비 수익률',
                                formula: `순수 평가손익 ÷ 시작일 투자금 × 100`,
                                detail: `= ${formatKrw(summary.pureProfit)} ÷ ${formatKrw(first.investment)} × 100`,
                            },
                            {
                                key: 'addedInvestment',
                                label: '추가 투입금',
                                formatted: `${summary.periodInvestmentChange >= 0 ? '+' : ''}${formatKrw(summary.periodInvestmentChange)}`,
                                iconBg: 'rgba(52,211,153,0.2)',
                                textColor: '#34d399',
                                icon: <DollarSign size={16} color="#34d399" />,
                                desc: '기간 중 순 입금/출금액',
                                formula: `종료일 투자금 - 시작일 투자금`,
                                detail: `= ${formatKrw(last.investment)} - ${formatKrw(first.investment)}`,
                            },
                            {
                                key: 'totalChange',
                                label: '기간 총 변동',
                                formatted: `${summary.periodTotalChange >= 0 ? '+' : ''}${formatKrw(summary.periodTotalChange)}`,
                                iconBg: summary.periodTotalChange >= 0 ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.2)',
                                textColor: summary.periodTotalChange >= 0 ? '#fbbf24' : '#60a5fa',
                                icon: <TrendingUp size={16} color={summary.periodTotalChange >= 0 ? '#fbbf24' : '#60a5fa'} />,
                                desc: '평가금 시작 대비 총 변동액',
                                formula: `종료일 평가금 - 시작일 평가금`,
                                detail: `= ${formatKrw(last.valuation)} - ${formatKrw(first.valuation)}`,
                            },
                        ];
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {cards.map(card => (
                                    <div
                                        key={card.key}
                                        className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5 cursor-pointer hover:border-[#555] transition-colors"
                                        onClick={() => toggleCard(card.key)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.iconBg }}>
                                                {card.icon}
                                            </div>
                                            <span className="text-xs text-gray-400">{card.label}</span>
                                        </div>
                                        <p className="text-xl font-bold" style={{ color: card.textColor }}>
                                            {card.formatted}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">{card.desc}</p>
                                        {expandedCard === card.key && (
                                            <div className="mt-3 pt-3 border-t border-[#444]">
                                                <p className="text-[11px] text-yellow-400 font-semibold mb-1">📐 계산식</p>
                                                <p className="text-[11px] text-gray-300 font-mono">{card.formula}</p>
                                                <p className="text-[10px] text-gray-500 mt-1 whitespace-pre-line font-mono">{card.detail}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* 1. Profit Chart */}
                        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white">누적 수익금 추이</h3>
                                <p className="text-xs text-gray-400 mt-1">기준 시작일로부터의 누적 순수익금(평가액-원금)과 일자별 수익금액입니다.</p>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#666" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => val.slice(5)} // MM-DD
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            stroke="#666" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} 
                                            yAxisId="left"
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#252525', borderColor: '#444', borderRadius: '8px' }}
                                            formatter={(value: any, name: any) => [formatKrw(Number(value) || 0), name]}
                                            labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <ReferenceLine y={0} yAxisId="left" stroke="#555" strokeDasharray="3 3" />
                                        <Bar yAxisId="left" dataKey="dailyProfitChange" opacity={0.7} name="일별 손익" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.dailyProfitChange >= 0 ? '#ef4444' : '#3b82f6'} />
                                            ))}
                                        </Bar>
                                        <Line yAxisId="left" type="monotone" dataKey="cumulativeProfit" stroke="#ff7300" strokeWidth={3} dot={false} name="누적 수익금" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Valuation/Investment Chart */}
                        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white">투자금 및 평가금 추이</h3>
                                <p className="text-xs text-gray-400 mt-1">지정된 기간 동안의 총 평가액과 총 투자액의 변동입니다.</p>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#666" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => val.slice(5)}
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            stroke="#666" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => {
                                                const abs = Math.abs(val);
                                                if (abs >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
                                                if (abs >= 10000) return `${(val / 10000).toFixed(0)}만`;
                                                return `${val}`;
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#252525', borderColor: '#444', borderRadius: '8px' }}
                                            formatter={(value: any, name: any) => [formatKrw(Number(value) || 0), name]}
                                            labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Area type="monotone" dataKey="valuation" fill="#3b82f6" stroke="#2563eb" fillOpacity={0.2} name="평가액" />
                                        <Line type="monotone" dataKey="investment" stroke="#10b981" strokeWidth={2} dot={false} name="투자액" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Daily Buy/Sell Bar Chart */}
                    {dailyTradeChartData.length > 0 && (
                        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white">일별 매매 금액 추이</h3>
                                <p className="text-xs text-gray-400 mt-1">날짜별 매수(빨강) 및 매도(파랑) 거래 금액입니다.</p>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={dailyTradeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} stackOffset="sign">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#666"
                                            tick={{ fill: '#888', fontSize: 12 }}
                                            tickFormatter={(val) => val.slice(5)}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="#666"
                                            tick={{ fill: '#888', fontSize: 12 }}
                                            tickFormatter={(val) => `${(Math.abs(val) / 10000).toFixed(0)}만`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#252525', borderColor: '#444', borderRadius: '8px' }}
                                            formatter={(value: any, name: any) => [formatKrw(Math.abs(Number(value)) || 0), name]}
                                            labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <ReferenceLine y={0} stroke="#555" strokeDasharray="3 3" />
                                        <Bar dataKey="buyAmount" fill="#ef4444" opacity={0.8} name="매수" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="sellAmount" fill="#3b82f6" opacity={0.8} name="매도" radius={[0, 0, 4, 4]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Trade Logs Table */}
                    <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-[#333] flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">지정 기간 매매 내역</h3>
                                <p className="text-xs text-gray-400 mt-1">선택하신 기간 동안 이루어진 주식 매수, 매도, 배당 기록입니다. 컬럼 헤더를 클릭하면 정렬할 수 있습니다.</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                                    <span className="text-gray-400 mr-2">매수</span>
                                    <span className="text-red-400">{formatKrw(tradeSummary.totalBuy)}</span>
                                </div>
                                <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                                    <span className="text-gray-400 mr-2">매도</span>
                                    <span className="text-blue-400">{formatKrw(tradeSummary.totalSell)}</span>
                                </div>
                                <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                                    <span className="text-gray-400 mr-2">배당</span>
                                    <span className="text-emerald-400">{formatKrw(tradeSummary.totalDividend)}</span>
                                </div>
                                <div className="text-sm font-bold text-[#F7D047] bg-[#F7D047]/10 px-3 py-1.5 rounded-lg border border-[#F7D047]/20">
                                    총 {tradeLogs.length}건
                                </div>
                            </div>
                        </div>
                        {tradeLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#252525] text-xs uppercase text-gray-500 border-b border-[#333]">
                                        <tr>
                                            {[
                                                { key: 'trade_date' as SortKey, label: '일자', align: '' },
                                                { key: 'type' as SortKey, label: '구분', align: '' },
                                                { key: 'name' as SortKey, label: '종목', align: '' },
                                                { key: 'price' as SortKey, label: '단가', align: 'text-right' },
                                                { key: 'quantity' as SortKey, label: '수량', align: 'text-right' },
                                                { key: 'totalAmt' as SortKey, label: '총 금액', align: 'text-right' },
                                                { key: 'sellProfit' as SortKey, label: '매도 수익금', align: 'text-right' },
                                                { key: 'sellProfitRate' as SortKey, label: '수익률', align: 'text-right' },
                                            ].map(col => (
                                                <th
                                                    key={col.key}
                                                    className={`px-6 py-4 font-bold cursor-pointer hover:text-gray-300 select-none transition-colors ${col.align}`}
                                                    onClick={() => handleSort(col.key)}
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        {col.label}
                                                        {sortKey === col.key && (
                                                            <span className="text-[#F7D047] text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                                                        )}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#333]">
                                        {sortedTradeLogs.map((log) => {
                                            const totalAmt = log.price * log.quantity;
                                            const typeLabel = log.type === 'BUY' ? '매수' : log.type === 'SELL' ? '매도' : '배당';
                                            const typeStyle = log.type === 'BUY' 
                                                ? 'bg-red-500/10 text-red-400' 
                                                : log.type === 'SELL' 
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-emerald-500/10 text-emerald-400';
                                            const currency = log.isUS ? '$' : '';
                                            const currencySuffix = log.isUS ? '' : ' 원';
                                            const priceDisplay = log.isUS 
                                                ? `$${log.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : `${log.price.toLocaleString()} 원`;
                                            const totalDisplay = log.isUS 
                                                ? `$${totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : `${totalAmt.toLocaleString()} 원`;
                                            return (
                                                <tr key={log.id} className="hover:bg-[#2A2A2A] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-white">{log.trade_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${typeStyle}`}>
                                                            {typeLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-white">
                                                        {log.name} <span className="text-gray-500 font-normal ml-1">({log.symbol})</span>
                                                        {log.isUS && <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500/15 text-purple-400 text-[10px] font-bold rounded">US</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">{priceDisplay}</td>
                                                    <td className="px-6 py-4 text-right">{log.quantity.toLocaleString()} 주</td>
                                                    <td className="px-6 py-4 text-right font-bold text-white">{totalDisplay}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {log.type === 'SELL' && log.sellProfit !== undefined ? (
                                                            <span className={`font-bold ${log.sellProfit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {log.sellProfit >= 0 ? '+' : ''}{Math.round(log.sellProfit).toLocaleString()} 원
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {log.type === 'SELL' && log.sellProfitRate !== undefined ? (
                                                            <span className={`font-bold ${log.sellProfitRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                {log.sellProfitRate >= 0 ? '+' : ''}{log.sellProfitRate.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500 font-medium">
                                해당 기간 동안의 매매 기록이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
