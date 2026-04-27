"use client";

import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, Legend, ReferenceLine, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Bot, ArrowLeft, Flame, Snowflake, BarChart3, Briefcase, AlertTriangle, Wallet, PiggyBank } from 'lucide-react';
import type { PushContent } from '@/lib/push/types';

interface WeeklyReportViewProps {
  content: PushContent;
}

export default function WeeklyReportView({ content }: WeeklyReportViewProps) {
  const { payload } = content || {};
  const { 
    chartData: rawChartData = [], 
    tradeLogs = [], 
    summary = null, 
    tradeSummary = null, 
    startDate = '', 
    endDate = '', 
    holdings = [], 
    weeklyHighlights = null,
    overallSummary = null 
  } = payload || {};

  // 차트 데이터 가공
  const chartData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) return [];

    const first = rawChartData[0];
    let cumulativeProfit = 0;
    let prevValuation = first.valuation;

    return rawChartData.map((d: any, i: number) => {
      const profit = d.valuation - d.investment;
      const dailyProfitChange = i === 0 ? 0 : (d.valuation - d.investment) - (rawChartData[i - 1].valuation - rawChartData[i - 1].investment);

      // 누적 수익금: 첫날 대비 순수익 변동
      const periodInvChange = d.investment - first.investment;
      cumulativeProfit = (d.valuation - first.valuation) - periodInvChange;

      return {
        date: d.date,
        investment: d.investment,
        valuation: d.valuation,
        profit,
        dailyProfitChange,
        cumulativeProfit,
      };
    });
  }, [rawChartData]);

  const formatKrw = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    if (Math.abs(num) >= 100000000) return `${(num / 100000000).toFixed(2)}억 원`;
    if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(0)}만 원`;
    return `${num.toLocaleString()} 원`;
  };

  if (!rawChartData || rawChartData.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="text-center">
          <Bot size={48} className="text-[#F7D047] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">데이터가 부족합니다</h2>
          <p className="text-gray-400 text-sm">해당 기간의 포트폴리오 기록이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E1E1E] to-[#252525] border-b border-[#333]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7D047] to-[#F59E0B] flex items-center justify-center">
              <Bot size={22} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">월간 투자리포트</h1>
              <p className="text-sm text-gray-400">
                {startDate} ~ {endDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* ──── 기간 안내 배너 ──── */}
        <div className="flex items-start gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">기간 한정 리포트</p>
            <p className="text-xs text-gray-400 mt-1">
              이 리포트는 <span className="text-white font-bold">{startDate} ~ {endDate}</span> 기간 동안의 성과입니다. 전체 투자 성적과는 다를 수 있습니다.
            </p>
          </div>
        </div>

        {/* ──── 전체 포트폴리오 현황 ──── */}
        {overallSummary && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1E1E1E] border border-[#333] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={18} className="text-[#F7D047]" />
              <h3 className="text-lg font-bold text-white">💰 전체 포트폴리오 현황</h3>
              <span className="text-[10px] text-gray-500 ml-auto">
                {overallSummary.firstDate} ~ {overallSummary.latestDate}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">전체 평가손익</p>
                <p className={`text-lg font-black ${(overallSummary.totalProfit || 0) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {(overallSummary.totalProfit || 0) >= 0 ? '+' : ''}{formatKrw(overallSummary.totalProfit || 0)}
                </p>
              </div>
              <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">전체 수익률</p>
                <p className={`text-lg font-black ${(overallSummary.totalReturnRate || 0) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {(overallSummary.totalReturnRate || 0) >= 0 ? '+' : ''}{Number(overallSummary.totalReturnRate || 0).toFixed(2)}%
                </p>
              </div>
              <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">총 투자금</p>
                <p className="text-lg font-black text-emerald-400">
                  {formatKrw(overallSummary.totalInvestment || 0)}
                </p>
              </div>
              <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">총 평가금</p>
                <p className="text-lg font-black text-[#F7D047]">
                  {formatKrw(overallSummary.totalValuation || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ──── 월간 요약 (최상단) ──── */}
        {weeklyHighlights && (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1E1E1E] border border-[#333] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-[#F7D047]" />
              <h3 className="text-lg font-bold text-white">📋 월간 리포트 요약</h3>
            </div>

            {/* 보유 종목 변동 현황 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">상승 종목</p>
                <p className="text-2xl font-black text-red-400">{weeklyHighlights.gainers}<span className="text-sm font-normal text-gray-500">개</span></p>
              </div>
              <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">하락 종목</p>
                <p className="text-2xl font-black text-blue-400">{weeklyHighlights.losers}<span className="text-sm font-normal text-gray-500">개</span></p>
              </div>
              <div className="bg-[#252525] rounded-xl p-4 text-center border border-[#333]">
                <p className="text-xs text-gray-400 mb-1">보합</p>
                <p className="text-2xl font-black text-gray-400">{weeklyHighlights.unchanged}<span className="text-sm font-normal text-gray-500">개</span></p>
              </div>
            </div>

            {/* 가장 핫한 / 가장 부진한 종목 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weeklyHighlights.topGainer && (
                <div className="flex items-center gap-3 p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                  <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <Flame size={20} className="text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">🔥 월간 최대 상승</p>
                    <p className="text-sm font-bold text-white truncate">{weeklyHighlights.topGainer.name}</p>
                    <p className="text-xs text-red-400 font-bold">+{Number(weeklyHighlights.topGainer.changeRate || 0).toFixed(2)}%</p>
                  </div>
                </div>
              )}
              {weeklyHighlights.topLoser && weeklyHighlights.topLoser.changeRate < 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Snowflake size={20} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">❄️ 월간 최대 하락</p>
                    <p className="text-sm font-bold text-white truncate">{weeklyHighlights.topLoser.name}</p>
                    <p className="text-xs text-blue-400 font-bold">{Number(weeklyHighlights.topLoser.changeRate || 0).toFixed(2)}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {summary && (() => {
          const cards = [
            {
              label: '순수 평가손익',
              formatted: `${(summary.pureProfit || 0) >= 0 ? '+' : ''}${formatKrw(summary.pureProfit || 0)}`,
              iconBg: (summary.pureProfit || 0) >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
              textColor: (summary.pureProfit || 0) >= 0 ? '#f87171' : '#60a5fa',
              icon: (summary.pureProfit || 0) >= 0 ? <TrendingUp size={16} color="#f87171" /> : <TrendingDown size={16} color="#60a5fa" />,
              desc: '추가 입금 제외한 시장 수익',
            },
            {
              label: '기간 수익률',
              formatted: `${(summary.returnRate || 0) >= 0 ? '+' : ''}${Number(summary.returnRate || 0).toFixed(2)}%`,
              iconBg: (summary.returnRate || 0) >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
              textColor: (summary.returnRate || 0) >= 0 ? '#f87171' : '#60a5fa',
              icon: <Percent size={16} color={(summary.returnRate || 0) >= 0 ? '#f87171' : '#60a5fa'} />,
              desc: '기초 투자금 대비 수익률',
            },
            {
              label: '추가 투입금',
              formatted: `${(summary.periodInvestmentChange || 0) >= 0 ? '+' : ''}${formatKrw(summary.periodInvestmentChange || 0)}`,
              iconBg: 'rgba(52,211,153,0.2)',
              textColor: '#34d399',
              icon: <DollarSign size={16} color="#34d399" />,
              desc: '기간 중 순 입금/출금액',
            },
            {
              label: '기간 총 변동',
              formatted: `${(summary.periodTotalChange || 0) >= 0 ? '+' : ''}${formatKrw(summary.periodTotalChange || 0)}`,
              iconBg: (summary.periodTotalChange || 0) >= 0 ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.2)',
              textColor: (summary.periodTotalChange || 0) >= 0 ? '#fbbf24' : '#60a5fa',
              icon: <TrendingUp size={16} color={(summary.periodTotalChange || 0) >= 0 ? '#fbbf24' : '#60a5fa'} />,
              desc: '평가금 시작 대비 총 변동액',
            },
          ];

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cards.map((card, idx) => (
                <div key={idx} className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5">
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
                </div>
              ))}
            </div>
          );
        })()}

        {/* Profit Chart */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">누적 수익금 추이</h3>
            <p className="text-xs text-gray-400 mt-1">기준 시작일로부터의 누적 순수익금과 일자별 수익금액입니다.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => val.slice(5)} minTickGap={30} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} yAxisId="left" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#252525', borderColor: '#444', borderRadius: '8px' }}
                  formatter={(value: any, name: any) => [formatKrw(Number(value) || 0), name]}
                  labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <ReferenceLine y={0} yAxisId="left" stroke="#555" strokeDasharray="3 3" />
                <Bar yAxisId="left" dataKey="dailyProfitChange" opacity={0.7} name="일별 손익" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.dailyProfitChange >= 0 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
                <Line yAxisId="left" type="monotone" dataKey="cumulativeProfit" stroke="#ff7300" strokeWidth={3} dot={false} name="누적 수익금" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Valuation Chart */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">투자금 및 평가금 추이</h3>
            <p className="text-xs text-gray-400 mt-1">지정된 기간 동안의 총 평가액과 총 투자액의 변동입니다.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => val.slice(5)} minTickGap={30} />
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

        {/* Trade Logs */}
        {tradeLogs && tradeLogs.length > 0 && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#333] flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">기간 내 매매 내역</h3>
                <p className="text-xs text-gray-400 mt-1">주간 매수, 매도, 배당 기록입니다.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {tradeSummary && (
                  <>
                    <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                      <span className="text-gray-400 mr-2">매수</span>
                      <span className="text-red-400">{formatKrw(tradeSummary.totalBuy || 0)}</span>
                    </div>
                    <div className="text-sm font-medium bg-[#252525] px-3 py-1.5 rounded-lg border border-[#333]">
                      <span className="text-gray-400 mr-2">매도</span>
                      <span className="text-blue-400">{formatKrw(tradeSummary.totalSell || 0)}</span>
                    </div>
                    <div className="text-sm font-bold text-[#F7D047] bg-[#F7D047]/10 px-3 py-1.5 rounded-lg border border-[#F7D047]/20">
                      총 {tradeSummary.tradeCount || tradeLogs.length}건
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#252525] text-xs uppercase text-gray-500 border-b border-[#333]">
                  <tr>
                    <th className="px-6 py-4 font-bold">일자</th>
                    <th className="px-6 py-4 font-bold">구분</th>
                    <th className="px-6 py-4 font-bold">종목</th>
                    <th className="px-6 py-4 font-bold text-right">단가</th>
                    <th className="px-6 py-4 font-bold text-right">수량</th>
                    <th className="px-6 py-4 font-bold text-right">총 금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {tradeLogs.map((log: any) => {
                    const typeLabel = log.type === 'BUY' ? '매수' : log.type === 'SELL' ? '매도' : '배당';
                    const typeStyle = log.type === 'BUY'
                      ? 'bg-red-500/10 text-red-400'
                      : log.type === 'SELL'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-400';

                    return (
                      <tr key={log.id} className="hover:bg-[#2A2A2A] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{log.trade_date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${typeStyle}`}>{typeLabel}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {log.name || '알 수 없음'} <span className="text-gray-500 font-normal ml-1">({log.ticker || log.symbol || ''})</span>
                        </td>
                        <td className="px-6 py-4 text-right">{Math.round(Number(log.price) || 0).toLocaleString()} 원</td>
                        <td className="px-6 py-4 text-right">{(Number(log.quantity) || 0).toLocaleString()} 주</td>
                        <td className="px-6 py-4 text-right font-bold text-white">{Math.round((Number(log.price) || 0) * (Number(log.quantity) || 0)).toLocaleString()} 원</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──── 내 보유 종목 현황 (최하단) ──── */}
        {holdings && holdings.length > 0 && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-[#F7D047]" />
                <h3 className="text-lg font-bold text-white">내 보유 종목 현황</h3>
                <span className="ml-2 text-xs text-gray-500 bg-[#333] px-2 py-0.5 rounded-full">{holdings.length}종목</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">최근 스냅샷 기준 현재가 및 수익률입니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#252525] text-xs uppercase text-gray-500 border-b border-[#333]">
                  <tr>
                    <th className="px-6 py-4 font-bold">종목명</th>
                    <th className="px-6 py-4 font-bold text-right">수익률</th>
                    <th className="px-6 py-4 font-bold text-right">수량</th>
                    <th className="px-6 py-4 font-bold text-right">매수가</th>
                    <th className="px-6 py-4 font-bold text-right">현재가</th>
                    <th className="px-6 py-4 font-bold text-right">평가금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {holdings.map((h: any, idx: number) => {
                    const buyPrice = Number(h.avgPrice || h.buyPrice || h.pricePerShare || 0);
                    const curPrice = Number(h.currentPrice || 0);
                    const qty = Number(h.quantity || 0);
                    const rate = Number(h.exchangeRate || 1);
                    const profitRate = buyPrice > 0 ? ((curPrice - buyPrice) / buyPrice) * 100 : 0;
                    const totalVal = curPrice * qty * rate;
                    const displaySymbol = h.ticker || h.symbol || '';

                    return (
                      <tr key={displaySymbol || idx} className="hover:bg-[#2A2A2A] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">{h.name || '알 수 없음'}</span>
                          {displaySymbol && <span className="text-gray-500 text-xs ml-1.5">({displaySymbol})</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${profitRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">{qty.toLocaleString()}주</td>
                        <td className="px-6 py-4 text-right">{Math.round(buyPrice).toLocaleString()}원</td>
                        <td className="px-6 py-4 text-right">
                          <span className={curPrice >= buyPrice ? 'text-red-400' : 'text-blue-400'}>
                            {Math.round(curPrice).toLocaleString()}원
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">{formatKrw(totalVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#252525] border-t border-[#444]">
                  <tr>
                    <td className="px-6 py-4 font-bold text-white" colSpan={5}>합계</td>
                    <td className="px-6 py-4 text-right font-black text-[#F7D047] text-base">
                      {formatKrw(holdings.reduce((s: number, h: any) => s + (Number(h.currentPrice || 0) * Number(h.quantity || 0) * Number(h.exchangeRate || 1)), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-500">
            이 리포트는 JUBOT AI 투자 전문가가 자동 생성한 주간 투자리포트입니다.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            © {new Date().getFullYear()} JUBOT. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
