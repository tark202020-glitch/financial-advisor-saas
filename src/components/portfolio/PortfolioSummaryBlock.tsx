"use client";

import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';
import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

type ViewMode = 'all' | 'kr' | 'us';

function fmtRate(n: number): string {
    if (isNaN(n) || !isFinite(n)) return '0.00';
    return n.toFixed(2);
}

export default function PortfolioSummaryBlock() {
    const { assets } = usePortfolio();
    const [view, setView] = useState<ViewMode>('all');

    // Batch stock data
    const { krSymbols, usSymbols } = useMemo(() => {
        const kr = new Set<string>();
        const us = new Set<string>();
        assets.forEach(a => {
            if (a.category === 'KR') kr.add(a.symbol.replace('.KS', ''));
            else if (a.category === 'US') us.add(a.symbol);
        });
        return { krSymbols: Array.from(kr), usSymbols: Array.from(us) };
    }, [assets]);

    const { getStockData: getKrData } = useBatchStockPrice(krSymbols, 'KR');
    const { getStockData: getUsData } = useBatchStockPrice(usSymbols, 'US');

    const getPrice = (asset: Asset) => {
        const clean = asset.symbol.replace('.KS', '');
        const data = asset.category === 'KR' ? getKrData(clean) : getUsData(asset.symbol);
        return data?.price || asset.pricePerShare;
    };

    // ===== Summary Calculations =====
    const summary = useMemo(() => {
        const result = {
            all: { purchase: 0, valuation: 0, profit: 0, rate: 0 },
            kr: { purchase: 0, valuation: 0, profit: 0, rate: 0 },
            us: { purchase: 0, valuation: 0, profit: 0, rate: 0 },
        };

        // Active positions only (quantity > 0)
        assets.filter(a => a.quantity > 0).forEach(a => {
            const price = getPrice(a);
            const purchase = a.pricePerShare * a.quantity;
            const valuation = price * a.quantity;
            const cat = a.category === 'KR' ? 'kr' : 'us';

            result[cat].purchase += purchase;
            result[cat].valuation += valuation;
            result.all.purchase += purchase;
            result.all.valuation += valuation;
        });

        // Calculate profits and rates
        (['all', 'kr', 'us'] as ViewMode[]).forEach(k => {
            result[k].profit = result[k].valuation - result[k].purchase;
            result[k].rate = result[k].purchase === 0 ? 0 : (result[k].profit / result[k].purchase) * 100;
        });

        return result;
    }, [assets, getKrData, getUsData]);

    // ===== Realized Gains (Closed Positions) =====
    const realizedGains = useMemo(() => {
        const closedAssets = assets.filter(a => a.quantity === 0 && a.trades && a.trades.length > 0);

        let totalBuy = 0;
        let totalSell = 0;
        const items: { name: string; symbol: string; category: string; buyAmount: number; sellAmount: number; profit: number; rate: number }[] = [];

        closedAssets.forEach(a => {
            let buyAmt = 0;
            let sellAmt = 0;

            (a.trades || []).forEach(t => {
                const amount = t.price * t.quantity;
                if (t.type === 'BUY') buyAmt += amount;
                else if (t.type === 'SELL') sellAmt += amount;
            });

            const profit = sellAmt - buyAmt;
            const rate = buyAmt === 0 ? 0 : (profit / buyAmt) * 100;

            items.push({
                name: a.name,
                symbol: a.symbol,
                category: a.category,
                buyAmount: buyAmt,
                sellAmount: sellAmt,
                profit,
                rate
            });

            totalBuy += buyAmt;
            totalSell += sellAmt;
        });

        // Sort by absolute profit descending
        items.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

        return {
            totalBuy,
            totalSell,
            totalProfit: totalSell - totalBuy,
            totalRate: totalBuy === 0 ? 0 : ((totalSell - totalBuy) / totalBuy) * 100,
            items,
            count: closedAssets.length
        };
    }, [assets]);

    const [isRealizedExpanded, setIsRealizedExpanded] = useState(false);

    const fmtValue = (n: number, type: ViewMode | 'kr' | 'us') => {
        const currency = type === 'us' ? 'USD' : 'KRW';
        const formatted = formatCurrency(n, currency);
        // Only append '원' if currency is KRW, as formatCurrency returns comma formatted number for KRW
        // and "$ ..." for USD. The existing code appended '원' manually.
        // User said: "한화 원, 표기는 소수점은 없어야 합니다." (doesn't explicitly say "원" char, but existing UI had it).
        // Let's keep existing style: append '원' for KRW if formatCurrency doesn't include it (it doesn't).
        if (currency === 'KRW') return `${formatted}원`;
        return formatted;
    };

    const current = summary[view];
    const isPositive = current.profit >= 0;
    const isRealizedPositive = realizedGains.totalProfit >= 0;

    return (
        <div className="space-y-4">
            {/* === Main Summary Block === */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-6 shadow-lg shadow-black/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Wallet size={20} className="text-[#F7D047]" />
                        <h2 className="text-lg font-bold text-white">내 주식 종합</h2>
                    </div>
                    {/* View Toggle */}
                    <div className="flex bg-[#121212] rounded-lg p-0.5 border border-[#333]">
                        {(['all', 'kr', 'us'] as ViewMode[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === v
                                    ? 'bg-[#F7D047] text-black'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {v === 'all' ? '전체' : v === 'kr' ? '국내' : '해외'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Purchase */}
                    <div className="bg-[#252525] rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">총 매입금액</div>
                        <div className="text-xl font-bold text-white">{fmtValue(current.purchase, view)}</div>
                    </div>

                    {/* Total Valuation */}
                    <div className="bg-[#252525] rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">총 평가금액</div>
                        <div className="text-xl font-bold text-white">{fmtValue(current.valuation, view)}</div>
                    </div>

                    {/* Profit / Return */}
                    <div className={`rounded-xl p-4 ${isPositive ? 'bg-red-900/20 border border-red-800/30' : 'bg-blue-900/20 border border-blue-800/30'}`}>
                        <div className="text-xs text-gray-400 mb-1">평가손익 / 수익률</div>
                        <div className="flex items-center gap-2">
                            {isPositive ? <TrendingUp size={18} className="text-red-400" /> : <TrendingDown size={18} className="text-blue-400" />}
                            <div>
                                <span className={`text-xl font-bold ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
                                    {isPositive ? '+' : ''}{fmtValue(current.profit, view)}
                                </span>
                                <span className={`text-sm ml-2 ${isPositive ? 'text-red-300' : 'text-blue-300'}`}>
                                    ({isPositive ? '+' : ''}{fmtRate(current.rate)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub Metrics (국내/해외 세부) only when 'all' */}
                {view === 'all' && (summary.kr.purchase > 0 || summary.us.purchase > 0) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {/* KR sub */}
                        {summary.kr.purchase > 0 && (
                            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-[#2a2a4e]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-indigo-300 font-semibold">🇰🇷 국내</span>
                                    <span className={`text-xs font-bold ${summary.kr.profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {summary.kr.profit >= 0 ? '+' : ''}{fmtRate(summary.kr.rate)}%
                                    </span>
                                </div>
                                <div className="text-sm text-gray-300 mt-1">
                                    매입 {fmtValue(summary.kr.purchase, 'kr')} → 평가 {fmtValue(summary.kr.valuation, 'kr')}
                                </div>
                            </div>
                        )}
                        {/* US sub */}
                        {summary.us.purchase > 0 && (
                            <div className="bg-[#1a2e1a] rounded-lg p-3 border border-[#2a4e2a]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-green-300 font-semibold">🇺🇸 해외</span>
                                    <span className={`text-xs font-bold ${summary.us.profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {summary.us.profit >= 0 ? '+' : ''}{fmtRate(summary.us.rate)}%
                                    </span>
                                </div>
                                <div className="text-sm text-gray-300 mt-1">
                                    매입 {fmtValue(summary.us.purchase, 'us')} → 평가 {fmtValue(summary.us.valuation, 'us')}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* === Realized Gains Block === */}
            {realizedGains.count > 0 && (
                <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-6 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-400" />
                            <h3 className="text-sm font-bold text-white">거래 완료 수익 ({realizedGains.count}종목)</h3>
                        </div>
                        {isRealizedExpanded && (
                            <button
                                onClick={() => setIsRealizedExpanded(false)}
                                className="text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                접기
                            </button>
                        )}
                    </div>

                    {/* Total Realized (Always Visible) */}
                    <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${isRealizedPositive ? 'bg-red-900/10 hover:bg-red-900/20' : 'bg-blue-900/10 hover:bg-blue-900/20'}`}
                        onClick={() => setIsRealizedExpanded(!isRealizedExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className={isRealizedPositive ? 'text-red-400' : 'text-blue-400'} />
                            <span className="text-sm text-gray-300">총 실현 손익</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className={`text-base font-bold ${isRealizedPositive ? 'text-red-400' : 'text-blue-400'}`}>
                                    {isRealizedPositive ? '+' : ''}{fmtValue(realizedGains.totalProfit, 'kr')}
                                    {/* Realized gains mixed currency issue: Assuming KRW for total or need logic. Currently using 'kr' format (source had '원') */}
                                </span>
                                <span className={`text-xs ml-2 ${isRealizedPositive ? 'text-red-300' : 'text-blue-300'}`}>
                                    ({isRealizedPositive ? '+' : ''}{fmtRate(realizedGains.totalRate)}%)
                                </span>
                            </div>
                            {/* Chevron Icon could be added here */}
                        </div>
                    </div>

                    {/* Items Table (Collapsible) */}
                    {isRealizedExpanded && (
                        <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-1">
                            {realizedGains.items.map((item, idx) => {
                                const isProfit = item.profit >= 0;
                                const isUs = item.category === 'US';
                                return (
                                    <div key={idx} className="flex items-center justify-between bg-[#252525] rounded-lg px-4 py-3 border border-[#333] hover:border-[#555] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                                            <div>
                                                <div className="text-sm font-medium text-white">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.symbol} | {item.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span>매수 {fmtValue(item.buyAmount, isUs ? 'us' : 'kr')}</span>
                                                <span>→</span>
                                                <span>매도 {fmtValue(item.sellAmount, isUs ? 'us' : 'kr')}</span>
                                            </div>
                                            <div className={`text-sm font-bold mt-0.5 ${isProfit ? 'text-red-400' : 'text-blue-400'}`}>
                                                {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}{fmtValue(item.profit, isUs ? 'us' : 'kr')}
                                                <span className="text-xs ml-1">({isProfit ? '+' : ''}{fmtRate(item.rate)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
