"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useReportData } from '@/hooks/useReportData';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Line, Legend, ReferenceLine
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';

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

    // 100일 초과 방지 로직
    useEffect(() => {
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
            setStartDate(`${year}-${month}-${day}`);
        }
    }, [startDate, endDate]);

    const { isLoading, chartData, tradeLogs, failedSymbols } = useReportData(startDate, endDate);

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

        // 1. 기간내 수익금: 마지막날 평가액 - 첫날 평가액
        const periodProfit = lastData.valuation - firstData.valuation;
        
        // 2. 투자금 변경: 마지막날 투자액 - 첫날 투자액
        const periodInvestmentChange = lastData.investment - firstData.investment;

        return {
            periodProfit,
            periodInvestmentChange,
        };
    }, [chartData]);

    const tradeSummary = useMemo(() => {
        let totalBuy = 0;
        let totalSell = 0;
        tradeLogs.forEach(log => {
            const amt = log.price * log.quantity;
            if (log.type === 'BUY') totalBuy += amt;
            else if (log.type === 'SELL') totalSell += amt;
        });
        return { totalBuy, totalSell };
    }, [tradeLogs]);

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
                    <p className="text-gray-400 font-medium">데이터를 분석 중입니다...</p>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
                    <AlertCircle className="text-gray-500 mb-4" size={40} />
                    <p className="text-gray-400 font-medium">선택하신 기간의 데이터 기록이 부족합니다.</p>
                </div>
            ) : (
                <div className="space-y-6">
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
                                        <Bar yAxisId="left" dataKey="dailyProfitChange" fill="#F7D047" opacity={0.6} name="일별 손익" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="left" type="monotone" dataKey="cumulativeProfit" stroke="#ff7300" strokeWidth={3} dot={false} name="누적 수익금" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            {summary && (
                                <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                                    <div className="text-sm font-medium text-gray-400">기간 내 수익금 (평가액 변동)</div>
                                    <div className={`text-lg font-bold ${summary.periodProfit > 0 ? 'text-red-400' : summary.periodProfit < 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                                        {summary.periodProfit > 0 ? '+' : ''}{formatKrw(summary.periodProfit)}
                                    </div>
                                </div>
                            )}
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
                                            tickFormatter={(val) => `${(val / 100000000).toFixed(1)}억`}
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
                            {summary && (
                                <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                                    <div className="text-sm font-medium text-gray-400">기간 내 투자금 변동</div>
                                    <div className={`text-lg font-bold ${summary.periodInvestmentChange > 0 ? 'text-red-400' : summary.periodInvestmentChange < 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                                        {summary.periodInvestmentChange > 0 ? '+' : ''}{formatKrw(summary.periodInvestmentChange)}
                                    </div>
                                </div>
                            )}
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
                                <p className="text-xs text-gray-400 mt-1">선택하신 기간 동안 이루어진 주식 매수 및 매도 기록입니다.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                                    <span className="text-gray-400 mr-2">매수 총액</span>
                                    <span className="text-red-400">{formatKrw(tradeSummary.totalBuy)}</span>
                                </div>
                                <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                                    <span className="text-gray-400 mr-2">매도 총액</span>
                                    <span className="text-blue-400">{formatKrw(tradeSummary.totalSell)}</span>
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
                                            <th className="px-6 py-4 font-bold">일자</th>
                                            <th className="px-6 py-4 font-bold">구분</th>
                                            <th className="px-6 py-4 font-bold">종목 (심볼)</th>
                                            <th className="px-6 py-4 font-bold text-right">단가</th>
                                            <th className="px-6 py-4 font-bold text-right">수량</th>
                                            <th className="px-6 py-4 font-bold text-right">총 금액</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#333]">
                                        {tradeLogs.map((log) => {
                                            const totalAmt = log.price * log.quantity;
                                            return (
                                                <tr key={log.id} className="hover:bg-[#2A2A2A] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-white">{log.trade_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            log.type === 'BUY' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                            {log.type === 'BUY' ? '매수' : '매도'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-white">
                                                        {log.name} <span className="text-gray-500 font-normal ml-1">({log.symbol})</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">{log.price.toLocaleString()} 원</td>
                                                    <td className="px-6 py-4 text-right">{log.quantity.toLocaleString()} 주</td>
                                                    <td className="px-6 py-4 text-right font-bold text-white">{totalAmt.toLocaleString()} 원</td>
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
