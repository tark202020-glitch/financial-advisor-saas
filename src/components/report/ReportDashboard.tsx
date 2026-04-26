"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useReportData } from '@/hooks/useReportData';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Line, Legend, ReferenceLine, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Sparkles, Search, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
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
            periodReturnRate: returnRate,
            startInvestment: firstData.investment,
            startValuation: firstData.valuation,
            endInvestment: lastData.investment,
            endValuation: lastData.valuation,
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
                case 'price': valA = a.price * (a.exchangeRateUsed || 1); valB = b.price * (b.exchangeRateUsed || 1); break;
                case 'quantity': valA = a.quantity; valB = b.quantity; break;
                case 'totalAmt': valA = a.price * a.quantity * (a.exchangeRateUsed || 1); valB = b.price * b.quantity * (b.exchangeRateUsed || 1); break;
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

                    {/* === AI Deep Research 코멘트 섹션 === */}
                    {(() => {
                        // AI 코멘트 상태를 컴포넌트 내부 closure로 관리
                        return <DeepResearchSection
                            startDate={queryStartDate}
                            endDate={queryEndDate}
                            summary={summary}
                            tradeSummary={tradeSummary}
                            tradeCount={tradeLogs.length}
                            formatKrw={formatKrw}
                        />;
                    })()}

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
                                            const rate = log.exchangeRateUsed || 1;
                                            const krwPrice = Math.round(log.price * rate);
                                            const krwTotal = Math.round(log.price * log.quantity * rate);

                                            const typeLabel = log.type === 'BUY' ? '매수' : log.type === 'SELL' ? '매도' : '배당';
                                            const typeStyle = log.type === 'BUY' 
                                                ? 'bg-red-500/10 text-red-400' 
                                                : log.type === 'SELL' 
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-emerald-500/10 text-emerald-400';
                                            const priceDisplay = `${krwPrice.toLocaleString()} 원`;
                                            const totalDisplay = `${krwTotal.toLocaleString()} 원`;
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Deep Research AI 코멘트 섹션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LOADING_STAGES = [
    { icon: '🔍', message: '시장 데이터를 수집하고 있습니다...', detail: '코스피 지수, 환율 등 벤치마크 데이터를 조회합니다.' },
    { icon: '📊', message: '포트폴리오 성과를 분석하고 있습니다...', detail: '수익률, 매매 패턴, 투자 타이밍을 평가합니다.' },
    { icon: '🌐', message: 'Deep Research 에이전트가 웹을 탐색하고 있습니다...', detail: '최신 시장 동향과 전문가 의견을 수집 중입니다.' },
    { icon: '📰', message: '관련 뉴스와 리서치 자료를 분석하고 있습니다...', detail: '투자 환경에 영향을 미치는 주요 이슈를 파악합니다.' },
    { icon: '🧠', message: 'AI가 종합적인 투자 인사이트를 생성하고 있습니다...', detail: '벤치마크 비교, 전략 평가, 액션 아이템을 도출합니다.' },
    { icon: '✍️', message: '분석 보고서를 작성하고 있습니다...', detail: '최종 리서치 리포트를 구성 중입니다. 거의 완료되었습니다!' },
];

function DeepResearchSection({ startDate, endDate, summary, tradeSummary, tradeCount, formatKrw }: {
    startDate: string;
    endDate: string;
    summary: any;
    tradeSummary: { totalBuy: number; totalSell: number; totalDividend: number };
    tradeCount: number;
    formatKrw: (v: number) => string;
}) {
    const [researchState, setResearchState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [report, setReport] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [loadingStage, setLoadingStage] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [kospiInfo, setKospiInfo] = useState<{ kospiReturn: string; kospiStartPrice: number; kospiEndPrice: number } | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearAllIntervals = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (stageRef.current) clearInterval(stageRef.current);
        pollRef.current = null;
        timerRef.current = null;
        stageRef.current = null;
    }, []);

    useEffect(() => {
        return () => clearAllIntervals();
    }, [clearAllIntervals]);

    const startResearch = async () => {
        if (!summary) return;

        setResearchState('loading');
        setLoadingStage(0);
        setElapsedSec(0);
        setReport('');
        setErrorMsg('');

        // 경과 시간 타이머
        timerRef.current = setInterval(() => {
            setElapsedSec(prev => prev + 1);
        }, 1000);

        // 로딩 스테이지 순환 (20초마다 다음 단계)
        stageRef.current = setInterval(() => {
            setLoadingStage(prev => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
        }, 20000);

        try {
            const res = await fetch('/api/report/ai-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    summary: {
                        pureProfit: Math.round(summary.pureProfit),
                        returnRate: summary.periodReturnRate,
                        periodInvestmentChange: Math.round(summary.periodInvestmentChange),
                        periodTotalChange: Math.round(summary.periodTotalChange),
                        startInvestment: Math.round(summary.startInvestment || 0),
                        startValuation: Math.round(summary.startValuation || 0),
                        endInvestment: Math.round(summary.endInvestment || 0),
                        endValuation: Math.round(summary.endValuation || 0),
                    },
                    tradeSummary: {
                        totalBuy: Math.round(tradeSummary.totalBuy),
                        totalSell: Math.round(tradeSummary.totalSell),
                        totalDividend: Math.round(tradeSummary.totalDividend),
                        tradeCount,
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'API 오류');
            }

            const data = await res.json();
            const currentInteractionId = data.interactionId;
            setKospiInfo({
                kospiReturn: data.kospiReturn,
                kospiStartPrice: data.kospiStartPrice,
                kospiEndPrice: data.kospiEndPrice,
            });

            // Polling 시작 (10초 간격)
            pollRef.current = setInterval(async () => {
                try {
                    const pollRes = await fetch(`/api/report/ai-comment?interactionId=${currentInteractionId}`);
                    if (!pollRes.ok) return;
                    const pollData = await pollRes.json();

                    if (pollData.status === 'completed') {
                        setReport(pollData.report || '결과를 받아오지 못했습니다.');
                        setResearchState('done');
                        clearAllIntervals();
                    } else if (pollData.status === 'failed') {
                        setErrorMsg('Deep Research 작업이 실패했습니다. 잠시 후 다시 시도해주세요.');
                        setResearchState('error');
                        clearAllIntervals();
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
            }, 10000);

        } catch (e: any) {
            setErrorMsg(e.message || '알 수 없는 오류가 발생했습니다.');
            setResearchState('error');
            clearAllIntervals();
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m > 0 ? `${m}분 ${s}초` : `${s}초`;
    };

    // 마크다운 텍스트를 간단히 HTML로 변환
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let currentList: string[] = [];

        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`} className="space-y-1.5 ml-4 mb-4">
                        {currentList.map((item, i) => (
                            <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                                <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                                <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                            </li>
                        ))}
                    </ul>
                );
                currentList = [];
            }
        };

        const formatInline = (line: string) => {
            return line
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="text-gray-200">$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-[#333] text-amber-300 px-1 py-0.5 rounded text-xs">$1</code>');
        };

        const sectionIcons: Record<string, string> = {
            '코스피': '📊', '벤치마크': '📊', '성과': '📈',
            '매매': '💰', '전략': '🎯', '리스크': '⚠️', '위험': '⚠️',
            '실행': '✅', 'Action': '✅', '향후': '🔮', '결론': '📝', '종합': '📝',
        };

        const getSectionIcon = (title: string) => {
            for (const [kw, icon] of Object.entries(sectionIcons)) {
                if (title.includes(kw)) return icon;
            }
            return '📌';
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) { flushList(); continue; }

            if (line.startsWith('### ')) {
                flushList();
                const title = line.slice(4);
                elements.push(
                    <h4 key={`h3-${i}`} className="text-base font-bold text-white mt-6 mb-3 flex items-center gap-2">
                        <span>{getSectionIcon(title)}</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(title) }} />
                    </h4>
                );
                continue;
            }
            if (line.startsWith('## ')) {
                flushList();
                const title = line.slice(3);
                elements.push(
                    <h3 key={`h2-${i}`} className="text-lg font-bold text-white mt-8 mb-4 pb-2 border-b border-[#444] flex items-center gap-2">
                        <span>{getSectionIcon(title)}</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(title) }} />
                    </h3>
                );
                continue;
            }
            if (line.startsWith('# ')) {
                flushList();
                elements.push(
                    <h2 key={`h1-${i}`} className="text-xl font-bold text-white mt-4 mb-4 pb-3 border-b border-[#555]">
                        <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
                    </h2>
                );
                continue;
            }
            if (line.startsWith('- ') || line.startsWith('* ')) { currentList.push(line.slice(2)); continue; }
            if (/^\d+\.\s/.test(line)) { currentList.push(line.replace(/^\d+\.\s/, '')); continue; }

            flushList();
            elements.push(
                <p key={`p-${i}`} className="text-sm text-gray-300 leading-relaxed mb-3">
                    <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                </p>
            );
        }
        flushList();
        return elements;
    };

    return (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a3a5e] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#2a3a5e]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                AI Deep Research 분석
                                <span className="text-[10px] font-medium bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Beta</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Google Deep Research 에이전트가 코스피 벤치마크 대비 성과를 분석하고 투자 전략을 조언합니다.
                            </p>
                        </div>
                    </div>

                    {researchState === 'idle' && (
                        <button
                            onClick={startResearch}
                            disabled={!summary}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search size={16} />
                            Deep Research 분석 시작
                        </button>
                    )}
                    {researchState === 'done' && (
                        <button
                            onClick={() => { setResearchState('idle'); setReport(''); setKospiInfo(null); }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#333] text-gray-300 rounded-xl text-sm transition-colors border border-[#444]"
                        >
                            <RefreshCw size={14} />
                            다시 분석
                        </button>
                    )}
                    {researchState === 'error' && (
                        <button
                            onClick={() => { setResearchState('idle'); setErrorMsg(''); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm transition-colors border border-red-500/30"
                        >
                            <RefreshCw size={14} />
                            다시 시도
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {researchState === 'loading' && (
                <div className="p-8">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">분석 진행 중</span>
                            <span className="text-xs text-purple-300 font-mono">{formatTime(elapsedSec)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(15 + loadingStage * 15, 95)}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {LOADING_STAGES.map((stage, idx) => {
                            const isActive = idx === loadingStage;
                            const isDone = idx < loadingStage;
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
                                        isActive ? 'bg-purple-500/10 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                                        : isDone ? 'bg-[#1a1a2e]/50 border border-[#2a3a5e]/50 opacity-60'
                                        : 'opacity-30'
                                    }`}
                                >
                                    <div className="text-2xl mt-0.5 shrink-0 w-8 text-center">
                                        {isDone ? <CheckCircle2 size={24} className="text-emerald-400" />
                                        : isActive ? <span className="animate-bounce inline-block">{stage.icon}</span>
                                        : <span className="text-gray-600">{stage.icon}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {stage.message}
                                        </p>
                                        {(isActive || isDone) && (
                                            <p className={`text-xs mt-1 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>{stage.detail}</p>
                                        )}
                                    </div>
                                    {isActive && <Loader2 size={18} className="text-purple-400 animate-spin mt-0.5 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 p-4 bg-[#1a1a2e]/80 rounded-xl border border-[#2a3a5e]/50">
                        <p className="text-xs text-gray-500 text-center">
                            💡 Deep Research 에이전트는 웹에서 최신 정보를 수집하여 분석하므로 약 2~5분 소요됩니다. 이 페이지를 벗어나지 마세요.
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {researchState === 'error' && (
                <div className="p-8">
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <XCircle size={20} className="text-red-400 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-300">분석 중 오류가 발생했습니다</p>
                            <p className="text-xs text-red-400/70 mt-1">{errorMsg}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Result State */}
            {researchState === 'done' && report && (
                <div className="p-6">
                    {kospiInfo && kospiInfo.kospiStartPrice > 0 && (
                        <div className="mb-6 p-4 bg-[#1a1a2e] border border-[#2a3a5e] rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart3 size={16} className="text-blue-400" />
                                <span className="text-sm font-semibold text-white">코스피 벤치마크</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 mb-1">코스피 수익률</p>
                                    <p className="text-sm font-bold text-blue-300">{kospiInfo.kospiReturn}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 mb-1">내 수익률</p>
                                    <p className={`text-sm font-bold ${(summary?.periodReturnRate || 0) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {(summary?.periodReturnRate || 0) >= 0 ? '+' : ''}{(summary?.periodReturnRate || 0).toFixed(2)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 mb-1">분석 소요시간</p>
                                    <p className="text-sm font-bold text-gray-300">{formatTime(elapsedSec)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="prose prose-invert max-w-none">
                        {renderMarkdown(report)}
                    </div>
                </div>
            )}

            {/* Idle hint */}
            {researchState === 'idle' && !report && (
                <div className="p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Search size={28} className="text-purple-400/60" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Google Deep Research 에이전트가 포트폴리오 성과를 심층 분석합니다.</p>
                            <p className="text-xs text-gray-500">코스피 벤치마크 비교 · 매매 전략 리뷰 · 리스크 평가 · 실행 가능한 투자 조언</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
