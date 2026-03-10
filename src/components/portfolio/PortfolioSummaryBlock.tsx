"use client";

import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, CheckCircle2, Coins, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/format';

type ViewMode = 'all' | 'kr' | 'us';

function fmtRate(n: number): string {
    if (isNaN(n) || !isFinite(n)) return '0.00';
    return n.toFixed(2);
}

// 2차 카테고리에 따른 테마 색상 반환 함수 (PortfolioCard와 동일)
const getCategoryStyle = (category: string | undefined) => {
    const rawLabel = category || '미분류';
    const label = rawLabel.replace(/\(별.*?\)/g, '').trim();

    if (!category || label === '미분류') return {
        level: '0',
        label,
        wrapper: "bg-[#1E1E1E] border border-[#333] relative overflow-hidden",
        header: "text-gray-400",
        badgeBg: "bg-gray-700",
        border: "border-gray-700",
        chartColor: "#4B5563"
    };

    if (category.includes('배당주')) {
        return {
            level: 'I',
            label,
            wrapper: "bg-gradient-to-b from-[#121a16] to-[#0a0f0c] border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden",
            header: "text-emerald-400",
            badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-700",
            border: "border-emerald-500/30",
            chartColor: "#10B981"
        };
    }
    if (category.includes('ETF')) {
        return {
            level: 'II',
            label,
            wrapper: "bg-gradient-to-b from-[#12151a] to-[#0a0c0f] border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden",
            header: "text-blue-400",
            badgeBg: "bg-gradient-to-br from-blue-400 to-indigo-700",
            border: "border-blue-500/30",
            chartColor: "#3B82F6"
        };
    }
    if (category.includes('대형주')) {
        return {
            level: 'III',
            label,
            wrapper: "bg-gradient-to-b from-[#17121a] to-[#0d0a0f] border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden",
            header: "text-purple-400",
            badgeBg: "bg-gradient-to-br from-fuchsia-500 to-purple-800",
            border: "border-purple-500/30",
            chartColor: "#A855F7"
        };
    }
    if (category.includes('기대주')) {
        return {
            level: 'IV',
            label,
            wrapper: "bg-gradient-to-b from-[#1a1212] to-[#0f0a0a] border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden",
            header: "text-red-400",
            badgeBg: "bg-gradient-to-br from-orange-500 to-red-800",
            border: "border-red-500/40",
            chartColor: "#EF4444"
        };
    }

    return {
        level: '0',
        label,
        wrapper: "bg-[#1E1E1E] border border-[#333] relative overflow-hidden",
        header: "text-gray-400",
        badgeBg: "bg-gradient-to-br from-gray-700 to-gray-900",
        border: "border-gray-700",
        chartColor: "#4B5563"
    };
};

// --- Loading Progress UI Component ---
function LoadingProgressUI({ krLoading, usLoading, goldLoading, hasKr, hasGold, hasUs,
    krLoadedCount, krTotalCount, usLoadedCount, usTotalCount }: {
        krLoading: boolean; usLoading: boolean; goldLoading: boolean;
        hasKr: boolean; hasGold: boolean; hasUs: boolean;
        krLoadedCount: number; krTotalCount: number;
        usLoadedCount: number; usTotalCount: number;
    }) {
    // 전체 진행률: 개별 종목 기반 정확한 % 계산
    const goldTotal = hasGold ? 1 : 0;
    const goldLoaded = (!goldLoading && hasGold) ? 1 : 0;
    const totalItems = krTotalCount + usTotalCount + goldTotal;
    const loadedItems = krLoadedCount + usLoadedCount + goldLoaded;
    const percent = totalItems > 0 ? Math.round((loadedItems / totalItems) * 100) : 0;

    const steps = [
        {
            id: 'kr', label: '국내주식 시세',
            loading: krLoading, done: !krLoading && hasKr,
            loaded: krLoadedCount, total: krTotalCount,
        },
        {
            id: 'gold', label: '금 시세',
            loading: goldLoading, done: !goldLoading && hasGold,
            loaded: goldLoaded, total: goldTotal,
        },
        {
            id: 'us', label: '해외주식 시세',
            loading: usLoading, done: !usLoading && hasUs,
            loaded: usLoadedCount, total: usTotalCount,
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-16 flex-1 min-h-[400px]">
            {/* 로딩 아이콘 + 퍼센트 */}
            <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-[#333] rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#F7D047] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#F7D047]">{percent}%</span>
                </div>
            </div>

            {/* 타이틀 */}
            <p className="text-white font-bold text-lg mb-1">실시간 시세 데이터를 불러오는 중</p>
            <p className="text-gray-500 text-xs mb-1">API 호출 제한으로 순차적으로 조회합니다</p>
            <p className="text-gray-600 text-[11px] mb-6">{loadedItems} / {totalItems} 종목 완료</p>

            {/* 전체 프로그레스 바 */}
            <div className="w-full max-w-sm mb-6">
                <div className="w-full bg-[#252525] rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[#F7D047] to-[#f5c518] h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(percent, percent > 0 ? 3 : 0)}%` }}
                    ></div>
                </div>
            </div>

            {/* 단계별 상태 (개별 종목 수 표시) */}
            <div className="w-full max-w-sm space-y-3">
                {steps.filter(s => s.total > 0).map((step) => {
                    const stepPercent = step.total > 0 ? Math.round((step.loaded / step.total) * 100) : 0;
                    return (
                        <div key={step.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {step.done ? (
                                        <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-400 text-[9px]">✓</span>
                                        </div>
                                    ) : step.loading ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-[#F7D047] border-t-transparent animate-spin flex-shrink-0"></div>
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-[#252525] border border-[#444] flex-shrink-0"></div>
                                    )}
                                    <span className={`text-sm font-medium ${step.done ? 'text-green-400' : step.loading ? 'text-[#F7D047]' : 'text-gray-600'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                <span className={`text-xs font-mono ${step.done ? 'text-green-400' : step.loading ? 'text-[#F7D047]' : 'text-gray-600'
                                    }`}>
                                    {step.loading ? `${step.loaded}/${step.total}` : step.done ? `${step.total}/${step.total}` : '대기'}
                                </span>
                            </div>
                            {/* 개별 프로그레스 바 */}
                            <div className="ml-6 w-[calc(100%-1.5rem)] bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ease-out ${step.done ? 'bg-green-500/60' : step.loading ? 'bg-[#F7D047]/70' : 'bg-[#333]'
                                        }`}
                                    style={{ width: `${step.done ? 100 : stepPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PortfolioSummaryBlock() {
    const {
        assets, exchangeRate, isLoading: isContextLoading,
        getKrData, krHasError, krLoading, krLoadedCount, krTotalCount, refetchKr,
        getUsData, usHasError, usLoading, usLoadedCount, usTotalCount, refetchUs,
        goldData, goldLoading, fetchGoldPrice
    } = usePortfolio();

    const [view, setView] = useState<ViewMode>('all');

    const isLoading = isContextLoading || krLoading || usLoading || goldLoading;
    const hasError = krHasError || usHasError;

    const handleRetry = () => {
        if (krHasError) refetchKr();
        if (usHasError) refetchUs();
        if (!goldData) fetchGoldPrice(); // Optional: retry gold explicitly if missing
    };

    const getPrice = (asset: Asset) => {
        if (asset.category === 'GOLD') return goldData?.price > 0 ? goldData.price : asset.pricePerShare;
        const clean = asset.symbol.replace('.KS', '');
        const data = asset.category === 'KR' ? getKrData(clean) : getUsData(asset.symbol);
        return data?.price || asset.pricePerShare;
    };

    // ===== Summary Calculations =====
    const summary = useMemo(() => {
        const result = {
            all: { purchase: 0, valuation: 0, profit: 0, rate: 0, dividend: 0 },
            kr: { purchase: 0, valuation: 0, profit: 0, rate: 0, dividend: 0 },
            us: { purchase: 0, valuation: 0, profit: 0, rate: 0, dividend: 0 },
            categories: {} as Record<string, { purchase: number, valuation: number, profit: number, rate: number, dividend: number }>
        };

        // Active positions only (quantity > 0)
        assets
            .filter(a => a.quantity > 0)
            .filter(a => {
                if (view === 'all') return true;
                if (view === 'kr' && (a.category === 'KR' || a.category === 'GOLD')) return true;
                if (view === 'us' && a.category === 'US') return true;
                return false;
            })
            .forEach(a => {
                const price = getPrice(a);
                const exRate = exchangeRate || 1350; // Fallback

                const purchaseInCurrency = a.pricePerShare * a.quantity;
                const valuationInCurrency = price * a.quantity;
                const cat = (a.category === 'KR' || a.category === 'GOLD') ? 'kr' : 'us';

                const purchaseKRW = cat === 'us' ? purchaseInCurrency * exRate : purchaseInCurrency;
                const valuationKRW = cat === 'us' ? valuationInCurrency * exRate : valuationInCurrency;

                const tDividend = (a.trades || [])
                    .filter(t => t.type === 'DIVIDEND')
                    .reduce((sum, t) => sum + (t.price * t.quantity), 0);
                const dividendKRW = cat === 'us' ? tDividend * exRate : tDividend;

                // Add to 'kr' or 'us' specific totals (Always in KRW as per user request to unify)
                result[cat].purchase += purchaseKRW;
                result[cat].valuation += valuationKRW;
                result[cat].dividend += dividendKRW;

                // Add to 'all' total (Always in KRW)
                result.all.purchase += purchaseKRW;
                result.all.valuation += valuationKRW;
                result.all.dividend += dividendKRW;

                // Add to category buckets (Always in KRW)
                const secCat = a.secondary_category || '미분류';
                if (!result.categories[secCat]) {
                    result.categories[secCat] = { purchase: 0, valuation: 0, profit: 0, rate: 0, dividend: 0 };
                }
                result.categories[secCat].purchase += purchaseKRW;
                result.categories[secCat].valuation += valuationKRW;
                result.categories[secCat].dividend += dividendKRW;
            });

        // Calculate profits and rates
        (['all', 'kr', 'us'] as ViewMode[]).forEach(k => {
            result[k].profit = result[k].valuation - result[k].purchase;
            result[k].rate = result[k].purchase === 0 ? 0 : (result[k].profit / result[k].purchase) * 100;
        });

        Object.keys(result.categories).forEach(k => {
            const c = result.categories[k];
            c.profit = c.valuation - c.purchase;
            c.rate = c.purchase === 0 ? 0 : (c.profit / c.purchase) * 100;
        });

        return result;
    }, [assets, getKrData, getUsData, view, exchangeRate]);

    // ===== Daily Profit/Loss Analysis =====
    const dailyAnalysis = useMemo(() => {
        let totalDailyProfit = 0;
        let maxPos = { name: '', profit: 0 };
        let maxNeg = { name: '', profit: 0 };
        let hasData = false;
        
        assets.filter(a => a.quantity > 0)
        .filter(a => {
            if (view === 'all') return true;
            if (view === 'kr' && (a.category === 'KR' || a.category === 'GOLD')) return true;
            if (view === 'us' && a.category === 'US') return true;
            return false;
        })
        .forEach(a => {
            let change = 0;
            if (a.category === 'GOLD') {
                if (goldData) { change = goldData.change || 0; hasData = true; }
            } else {
                const clean = a.symbol.replace('.KS', '');
                const data = a.category === 'KR' ? getKrData(clean) : getUsData(a.symbol);
                if (data) { change = data.change || 0; hasData = true; }
            }
            
            const exRate = exchangeRate || 1350;
            const isUs = a.category === 'US';
            const dailyProfitKRW = change * a.quantity * (isUs ? exRate : 1);
            
            totalDailyProfit += dailyProfitKRW;
            
            if (dailyProfitKRW > maxPos.profit) {
                maxPos = { name: a.name, profit: dailyProfitKRW };
            }
            if (dailyProfitKRW < maxNeg.profit) {
                maxNeg = { name: a.name, profit: dailyProfitKRW };
            }
        });

        return { 
            totalDailyProfit, 
            contributor: totalDailyProfit >= 0 ? maxPos : maxNeg,
            hasData 
        };
    }, [assets, getKrData, getUsData, goldData, view, exchangeRate]);

    // ===== Realized Gains (Closed Positions) =====
    const realizedGains = useMemo(() => {
        const closedAssets = assets
            .filter(a => a.quantity === 0 && a.trades && a.trades.length > 0)
            .filter(a => {
                if (view === 'all') return true;
                if (view === 'kr' && a.category === 'KR') return true;
                if (view === 'us' && a.category === 'US') return true;
                return false;
            });

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

            const exRate = exchangeRate || 1350;
            const isUs = a.category === 'US';

            const buyAmtKRW = isUs ? buyAmt * exRate : buyAmt;
            const sellAmtKRW = isUs ? sellAmt * exRate : sellAmt;

            const profit = sellAmt - buyAmt;
            const rate = buyAmt === 0 ? 0 : (profit / buyAmt) * 100;

            items.push({
                name: a.name,
                symbol: a.symbol,
                category: a.category,
                buyAmount: buyAmt, // Original currency for table display
                sellAmount: sellAmt,
                profit,
                rate
            });

            if (view === 'all' || view === 'kr' || view === 'us') {
                // User requested all displays to be in KRW unified.
                totalBuy += buyAmtKRW;
                totalSell += sellAmtKRW;
            }
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
    }, [assets, view, exchangeRate]);

    const [isRealizedExpanded, setIsRealizedExpanded] = useState(false);

    const fmtValue = (n: number, type: ViewMode | 'kr' | 'us') => {
        // User requested: "모두 한화로 표현을 해줘야 합니다." 
        // We force KRW formatting regardless of the type parameter in SummaryBlock
        const currency = 'KRW';
        const formatted = formatCurrency(n, currency);
        return `${formatted}원`;
    };

    const current = summary[view];
    const isPositive = current.profit >= 0;
    const isRealizedPositive = realizedGains.totalProfit >= 0;

    // Prepare chart data from categories
    const chartData = useMemo(() => {
        return Object.entries(summary.categories)
            .map(([name, data]) => ({
                name: getCategoryStyle(name).label,
                rawName: name,
                value: data.valuation,
                color: getCategoryStyle(name).chartColor
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [summary, view]);

    return (
        <div className="space-y-4">
            {/* === Main Dashboard Board === */}
            <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] p-6 shadow-lg shadow-black/20">

                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Wallet size={20} className="text-[#F7D047]" />
                        <h2 className="text-xl font-bold text-white">내 주식 종합</h2>
                    </div>
                    {/* View Toggle & Exchange Rate Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {exchangeRate && (
                            <div className="text-xs font-medium text-gray-400 bg-[#121212] px-3 py-1.5 rounded-lg border border-[#333]">
                                적용 환율: <span className="text-white">${exchangeRate.toLocaleString()}원</span>
                            </div>
                        )}
                        <div className="flex bg-[#121212] rounded-lg p-1 border border-[#333] w-fit">
                            {(['all', 'kr', 'us'] as ViewMode[]).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded flex-1 transition-all ${view === v
                                        ? 'bg-[#F7D047] text-black shadow-sm'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {v === 'all' ? '전체' : v === 'kr' ? '국내' : '해외'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <LoadingProgressUI
                        krLoading={krLoading}
                        usLoading={usLoading}
                        goldLoading={goldLoading}
                        hasKr={assets.some(a => a.category === 'KR')}
                        hasGold={assets.some(a => a.category === 'GOLD')}
                        hasUs={assets.some(a => a.category === 'US')}
                        krLoadedCount={krLoadedCount}
                        krTotalCount={krTotalCount}
                        usLoadedCount={usLoadedCount}
                        usTotalCount={usTotalCount}
                    />
                ) : hasError ? (
                    <div className="flex flex-col items-center justify-center py-20 flex-1 min-h-[400px] space-y-5">
                        <div className="text-red-400 font-bold text-lg text-center">주식 가격 정보를 완전히 불러오지 못했습니다.</div>
                        <p className="text-gray-500 text-sm text-center">부정확한 종합 정보 제공을 방지하기 위해 데이터를 표시하지 않습니다.<br />정확한 자산 종합 정보를 위해, 다시 시도해주세요.</p>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2.5 bg-[#2a2a2a] hover:bg-[#333] active:bg-[#444] text-white rounded-lg font-bold border border-[#444] transition-colors flex items-center gap-2 mt-2"
                        >
                            <RefreshCw size={18} />
                            새로고침 시도
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 1. Overall Account Row (Top Full Width) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {/* Total Purchase */}
                            <div className="bg-[#121212] rounded-xl p-5 border border-[#333] md:col-span-1">
                                <div className="text-xs text-gray-500 mb-1">총 투자 금액</div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-200">{fmtValue(current.purchase, view)}</div>
                            </div>

                            {/* Total Valuation */}
                            <div className="bg-[#121212] rounded-xl p-5 border border-[#333] md:col-span-1">
                                <div className="text-xs text-gray-500 mb-1">총 평가금액</div>
                                <div className="text-xl sm:text-2xl font-bold text-white">{fmtValue(current.valuation, view)}</div>
                            </div>

                            {/* Profit / Return */}
                            <div className={`rounded-xl p-5 border md:col-span-2 ${isPositive ? 'bg-gradient-to-br from-red-950/40 to-[#121212] border-red-900/40' : 'bg-gradient-to-br from-blue-950/40 to-[#121212] border-blue-900/40'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 h-full">
                                    <div>
                                        <div className="text-[10px] text-gray-400 mb-1">총 평가손익 / 수익률</div>
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                            <div className={`text-2xl font-black tracking-tighter drop-shadow-sm ${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
                                                {isPositive ? '+' : ''}{fmtValue(current.profit, view)}
                                            </div>
                                            <div className={`text-base font-bold ${isPositive ? 'text-red-400/80' : 'text-blue-400/80'}`}>
                                                {isPositive ? '▲ ' : '▼ '}{fmtRate(current.rate)}%
                                            </div>
                                        </div>
                                        {current.dividend > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-yellow-500 mt-2">
                                                <Coins size={14} className="opacity-80" />
                                                <span>총 {fmtValue(current.dividend, view)}</span>
                                            </div>
                                        )}
                                        {dailyAnalysis.hasData && dailyAnalysis.totalDailyProfit !== 0 && (
                                            <div className="mt-4 text-xs sm:text-[13px] text-gray-300 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed shadow-inner">
                                                어제 대비 평가손익이 <span className={`font-bold ${dailyAnalysis.totalDailyProfit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                    {formatCurrency(Math.abs(dailyAnalysis.totalDailyProfit), 'KRW')}원 {dailyAnalysis.totalDailyProfit >= 0 ? '늘었어요~' : '줄었어요.'}
                                                </span>
                                                {dailyAnalysis.contributor.name && (
                                                    <span className="block mt-1 text-gray-400 text-xs text-pretty">
                                                        {dailyAnalysis.totalDailyProfit >= 0 ? '이익은' : '손해는'} 대부분 <span className="text-white font-bold bg-white/10 px-1 py-0.5 rounded">{dailyAnalysis.contributor.name}</span>에서 왔네요.
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {isPositive ? (
                                        <TrendingUp className="hidden md:block w-12 h-12 opacity-30 text-red-400" />
                                    ) : (
                                        <TrendingDown className="hidden md:block w-12 h-12 opacity-30 text-blue-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Grid Container (Split Layout) */}
                        <div className="flex flex-col xl:flex-row gap-6">

                            {/* Left Panel: Chart & Overall Stats (Stacked if small, side-by-side if wide) */}
                            {chartData.length > 0 && (
                                <div className="xl:w-1/2 flex flex-col gap-6">
                                    {/* Donut Chart Box */}
                                    <div className="bg-[#121212] rounded-xl border border-[#333] p-4 flex flex-col h-full min-h-[300px]">
                                        <div className="flex flex-col mb-4">
                                            <span className="text-sm font-bold text-gray-300">포트폴리오 자산 비중 & 총 평가금액</span>
                                            <span className="text-2xl font-black text-white mt-1">{fmtValue(current.valuation, view)}</span>
                                        </div>
                                        {/* Using absolute positioning container for recharts ResponsiveContainer bug on flex columns */}
                                        <div className="relative flex-1 w-full min-h-[250px] xl:min-h-[350px]">
                                            <div className="absolute inset-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={0}
                                                            outerRadius="85%"
                                                            stroke="none"
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            labelLine={false}
                                                            label={(props: any) => {
                                                                const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
                                                                if (midAngle === undefined || percent === undefined || innerRadius === undefined || outerRadius === undefined) return null;

                                                                const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                                                const x = Number(cx) + radius * Math.cos(-midAngle * (Math.PI / 180));
                                                                const y = Number(cy) + radius * Math.sin(-midAngle * (Math.PI / 180));
                                                                // Hide label if slice is too small to fit text
                                                                if (percent < 0.05) return null;

                                                                return (
                                                                    <text
                                                                        x={x}
                                                                        y={y}
                                                                        fill="white"
                                                                        textAnchor="middle"
                                                                        dominantBaseline="central"
                                                                        className="text-[10px] sm:text-xs font-bold pointer-events-none drop-shadow-md"
                                                                    >
                                                                        <tspan x={x} dy="-0.5em">{name}</tspan>
                                                                        <tspan x={x} dy="1.2em">{(percent * 100).toFixed(0)}%</tspan>
                                                                    </text>
                                                                );
                                                            }}
                                                        >
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', borderRadius: '8px', zIndex: 50 }}
                                                            itemStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                                                            formatter={(value: number | undefined | string) => {
                                                                if (typeof value === 'number') return fmtValue(value, 'kr');
                                                                return value;
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Chart Legend */}
                                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                                            {chartData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                    {item.name} {((item.value / current.valuation) * 100).toFixed(0)}%
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right Panel: Data Grid */}
                            <div className="flex-1 flex flex-col gap-6">

                                {/* 3. Category Report Cards */}
                                {Object.keys(summary.categories).length > 0 && (
                                    <div>
                                        <div className="text-sm font-bold text-gray-300 mb-3 border-l-2 border-[#F7D047] pl-3 py-0.5">
                                            내 주식 분류별 리포트
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                            {Object.entries(summary.categories)
                                                .filter(([catName]) => catName !== '미분류')
                                                .sort((a, b) => b[1].valuation - a[1].valuation)
                                                .map(([catName, stats]) => {
                                                    const theme = getCategoryStyle(catName);
                                                    return (
                                                        <div key={catName} className={`${theme.wrapper} rounded-xl p-5 transition-all duration-300 flex flex-col justify-between group h-full`}>
                                                            {/* Holographic Top Line */}
                                                            <div className={`absolute top-0 left-0 right-0 h-1 ${theme.badgeBg} opacity-80 z-20`}></div>

                                                            {/* Level Badge (Trading Card Style) */}
                                                            <div className="absolute top-1 right-1 z-20 shadow-lg pointer-events-none">
                                                                <div className={`px-3 py-1 rounded-bl-xl rounded-tr-xl ${theme.badgeBg} border-l border-b ${theme.border} flex items-center gap-1.5`}>
                                                                    <span className="font-black italic text-[10px] text-white drop-shadow-md tracking-wider">
                                                                        Lv.{theme.level}
                                                                    </span>
                                                                    <span className="w-px h-2.5 bg-white/30"></span>
                                                                    <span className="text-[9px] font-bold text-white/90">
                                                                        {theme.label}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Background noise */}
                                                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none"></div>

                                                            <div className="relative z-10 flex flex-col h-full">
                                                                <div className="mb-4">
                                                                    <h3 className={`text-xl sm:text-2xl font-black ${theme.header} tracking-tight leading-tight drop-shadow-md`}>
                                                                        {theme.label}
                                                                    </h3>
                                                                </div>
                                                                <div className="mb-4 flex-1 flex flex-col justify-center min-w-0">
                                                                    <div className="text-[10px] text-gray-500 mb-0.5 mt-1">평가금액</div>
                                                                    <div className={`text-xl xl:text-2xl font-black tracking-tighter truncate ${stats.profit >= 0 ? 'text-red-400' : 'text-blue-400'}`} title={fmtValue(stats.valuation, 'kr')}>
                                                                        {fmtValue(stats.valuation, 'kr')}
                                                                    </div>
                                                                    <div className={`text-sm font-bold mt-1 ${stats.profit >= 0 ? 'text-red-400/80' : 'text-blue-400/80'}`}>
                                                                        {stats.profit >= 0 ? '+ ' : '- '}{fmtValue(Math.abs(stats.profit), 'kr')}
                                                                    </div>
                                                                    {stats.dividend > 0 && (
                                                                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-yellow-500 mt-1 truncate" title={`누적 배당금: ${fmtValue(stats.dividend, 'kr')}`}>
                                                                            <Coins size={12} className="opacity-80" />
                                                                            <span>{fmtValue(stats.dividend, 'kr')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-end justify-between pt-3 border-t border-white/10 mt-auto">
                                                                    <div>
                                                                        <div className="text-[9px] text-gray-500 mb-0.5">투자금액</div>
                                                                        <div className="text-sm font-bold text-gray-300">{fmtValue(stats.purchase, 'kr')}</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[9px] text-gray-500 mb-0.5">수익률</div>
                                                                        <div className={`text-sm font-black ${stats.profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                                            {stats.profit >= 0 ? '+' : ''}{fmtRate(stats.rate)}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        {/* Uncategorized (미분류) Single Line Row */}
                                        {summary.categories['미분류'] && summary.categories['미분류'].valuation > 0 && (
                                            <div className="mt-4 bg-[#1E1E1E] border border-[#333] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 overflow-x-auto hide-scrollbar">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="w-1.5 h-4 bg-gray-600 rounded-full"></div>
                                                    <span className="text-sm font-bold text-gray-400 whitespace-nowrap">미분류</span>
                                                </div>
                                                <div className="flex items-center gap-4 sm:gap-5 justify-between sm:justify-end shrink-0 min-w-max">
                                                    <div className="text-left sm:text-right whitespace-nowrap">
                                                        <div className="text-[10px] text-gray-500">투자금액</div>
                                                        <div className="text-sm font-bold text-gray-300">{fmtValue(summary.categories['미분류'].purchase, 'kr')}</div>
                                                    </div>
                                                    <div className="text-left sm:text-right whitespace-nowrap">
                                                        <div className="text-[10px] text-gray-500">평가금액</div>
                                                        <div className="text-sm font-bold text-white">{fmtValue(summary.categories['미분류'].valuation, 'kr')}</div>
                                                    </div>
                                                    <div className="text-right whitespace-nowrap">
                                                        <div className="text-[10px] text-gray-500">평가손익 / 수익률</div>
                                                        <div className={`text-sm font-bold ${summary.categories['미분류'].profit >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                            {summary.categories['미분류'].profit >= 0 ? '+' : ''}{fmtValue(summary.categories['미분류'].profit, 'kr')}
                                                            <span className="text-xs ml-1 font-normal opacity-80">({summary.categories['미분류'].profit >= 0 ? '+' : ''}{fmtRate(summary.categories['미분류'].rate)}%)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
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
                                const exRate = exchangeRate || 1350; // Add exRate reference for mapping
                                return (
                                    <div key={idx} className="flex items-center justify-between bg-[#252525] rounded-lg px-4 py-3 border border-[#333] hover:border-[#555] transition-colors gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className="text-xs text-gray-500 w-5 shrink-0">{idx + 1}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-white truncate">{item.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{item.symbol} | {item.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs text-gray-400">
                                                <span>매수 {fmtValue(isUs ? item.buyAmount * exRate : item.buyAmount, 'kr')}</span>
                                                <span className="hidden sm:inline">→</span>
                                                <span>매도 {fmtValue(isUs ? item.sellAmount * exRate : item.sellAmount, 'kr')}</span>
                                            </div>
                                            <div className={`text-sm font-bold mt-0.5 ${isProfit ? 'text-red-400' : 'text-blue-400'}`}>
                                                {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}{fmtValue(isUs ? item.profit * exRate : item.profit, 'kr')}
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
