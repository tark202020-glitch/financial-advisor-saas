"use client";

// import { useStockPrice } from '@/hooks/useStockPrice';
import { Asset, usePortfolio } from '@/context/PortfolioContext';
import { useState, useEffect } from 'react';
import { RefreshCw, HelpCircle } from 'lucide-react';
import StockDetailChartModal from '../modals/StockDetailChartModal';
import { formatCurrency } from '@/utils/format';

interface PortfolioCardProps {
    asset: Asset;
    stockData: {
        price: number;
        change: number;
        changePercent: number;
        time?: string;
        sector?: string;
        marketName?: string;
    } | null;
    onRefresh?: () => void;
}

export default function PortfolioCard({ asset, stockData, onRefresh }: PortfolioCardProps) {
    const { updateAsset } = usePortfolio();
    // const stockData = useStockPrice(asset.symbol, asset.pricePerShare, asset.category);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Auto-update sector if missing in DB but available in live data
    useEffect(() => {
        if (asset.category === 'KR' && !asset.sector && stockData?.sector) {
            // Debounce or just call? 
            // useEffect runs once when data arrives.
            // Check if we already have it to avoid loops (dependency array handles it)
            updateAsset(asset.id, { sector: stockData.sector });
        }
    }, [stockData?.sector, asset.sector, asset.id, asset.category, updateAsset]);

    // Current Price Logic
    const currentPrice = stockData?.price || asset.pricePerShare; // Fallback to buy price if no data
    const changePercent = stockData?.changePercent || 0;
    const changeAmount = stockData?.change || 0;

    // Valuation Logic
    const totalPurchase = asset.pricePerShare * asset.quantity;
    const currentValuation = currentPrice * asset.quantity;
    const profitLoss = stockData ? (currentValuation - totalPurchase) : 0;

    // Calculate Return Rate (Handle Division by Zero)
    const rawReturnRate = totalPurchase === 0 ? 0 : (profitLoss / totalPurchase) * 100;
    const returnRate = isNaN(rawReturnRate) ? 0 : rawReturnRate;

    // Local state for inputs to prevent jitters, sync on blur
    const [memo, setMemo] = useState(asset.memo || '');
    const [secondaryCategory, setSecondaryCategory] = useState(asset.secondary_category || ''); // 추가된 로컬 상태
    const [targetLower, setTargetLower] = useState(asset.targetPriceLower?.toString() || '');
    const [targetUpper, setTargetUpper] = useState(asset.targetPriceUpper?.toString() || '');

    // Color Logic
    const isPositive = profitLoss >= 0;
    const colorClass = isPositive ? 'text-red-400' : 'text-blue-400';
    const profitSign = isPositive ? '▲' : '▼';

    // Game-like Theme Logic based on secondary_category
    let themeConfig = {
        level: '0',
        label: asset.secondary_category || '미분류',
        border: 'border-gray-700',
        badgeBg: 'bg-gradient-to-br from-gray-700 to-gray-900',
        badgeText: 'text-gray-300',
        glow: 'hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] border-zinc-800',
        accentBg: 'bg-gray-500/10',
        accentText: 'text-gray-400',
        cardBg: 'from-[#1a1a1a] to-[#121212]'
    };

    if (asset.secondary_category?.includes('배당주')) {
        themeConfig = {
            level: 'I',
            label: asset.secondary_category.replace(/\(별.*?\)/g, '').trim(),
            border: 'border-emerald-400/50',
            badgeBg: 'bg-gradient-to-br from-emerald-400 to-teal-700',
            badgeText: 'text-white',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] border-emerald-500/30',
            accentBg: 'bg-emerald-500/10',
            accentText: 'text-emerald-400',
            cardBg: 'from-[#121a16] to-[#0a0f0c]'
        };
    } else if (asset.secondary_category?.includes('ETF')) {
        themeConfig = {
            level: 'II',
            label: asset.secondary_category.replace(/\(별.*?\)/g, '').trim(),
            border: 'border-blue-400/50',
            badgeBg: 'bg-gradient-to-br from-blue-400 to-indigo-700',
            badgeText: 'text-white',
            glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] border-blue-500/30',
            accentBg: 'bg-blue-500/10',
            accentText: 'text-blue-400',
            cardBg: 'from-[#12151a] to-[#0a0c0f]'
        };
    } else if (asset.secondary_category?.includes('대형주')) {
        themeConfig = {
            level: 'III',
            label: asset.secondary_category.replace(/\(별.*?\)/g, '').trim(),
            border: 'border-purple-400/50',
            badgeBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-800',
            badgeText: 'text-white',
            glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] border-purple-500/30',
            accentBg: 'bg-purple-500/10',
            accentText: 'text-purple-400',
            cardBg: 'from-[#17121a] to-[#0d0a0f]'
        };
    } else if (asset.secondary_category?.includes('기대주')) {
        themeConfig = {
            level: 'IV',
            label: asset.secondary_category.replace(/\(별.*?\)/g, '').trim(),
            border: 'border-red-500/50',
            badgeBg: 'bg-gradient-to-br from-orange-500 to-red-800',
            badgeText: 'text-white',
            glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-500/40',
            accentBg: 'bg-red-500/10',
            accentText: 'text-red-400',
            cardBg: 'from-[#1a1212] to-[#0f0a0a]'
        };
    }

    // Formatting Logic
    const isUS = asset.category === 'US';
    const isGold = asset.category === 'GOLD';
    const currencyCode = isUS ? 'USD' : 'KRW';
    // Market label: prioritize stockData.marketName from KIS API, fallback to category
    const marketLabel = isGold ? '🪙 KRX 금현물' : isUS ? 'US' : (stockData?.marketName || 'KOSPI');
    const sectorDisplay = isGold ? 'KRX 금현물' : (stockData?.sector || asset.sector); // Priority to live data, fallback to DB

    // Specific format for Purchase Price (Average Price)
    // US: $ 123.45 (use standard formatCurrency)
    // KR: 1,234 (use standard formatCurrency)
    const formatPrice = (price: number) => {
        const formatted = formatCurrency(price, currencyCode);
        return currencyCode === 'KRW' ? `${formatted}원` : formatted;
    };

    const handleSave = () => {
        updateAsset(asset.id, {
            memo,
            secondary_category: secondaryCategory === '' ? null : secondaryCategory, // 저장 로직 수정 (미분류 시 명시적 null)
            targetPriceLower: targetLower ? parseFloat(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseFloat(targetUpper.replace(/,/g, '')) : undefined,
        });
    };

    // Calculate Goal Rate (AVG 대비 비율 - 상한목표용)
    const getGoalRate = (target: string) => {
        if (!target || !asset.pricePerShare) return null;
        const t = parseFloat(target.replace(/,/g, ''));
        if (isNaN(t)) return null;
        const r = ((t - asset.pricePerShare) / asset.pricePerShare) * 100;
        return r;
    };

    // 하한목표: 현재가가 하한목표에 얼마나 가까운지 비율 계산
    const getLowerTargetInfo = () => {
        if (!asset.targetPriceLower || !currentPrice || currentPrice <= 0) return null;
        // 현재가가 하한목표 대비 얼마나 위에 있는지 (양수 = 아직 여유 있음)
        const distanceRate = ((currentPrice - asset.targetPriceLower) / currentPrice) * 100;
        // 경고: 3% 이내 접근
        const isWarning = distanceRate <= 3;
        // 위험: 하한목표 이하로 하락
        const isDanger = currentPrice <= asset.targetPriceLower;
        return { distanceRate, isWarning, isDanger };
    };

    const totalDividend = (asset.trades || [])
        .filter(t => t.type === 'DIVIDEND')
        .reduce((sum, t) => sum + (t.price * t.quantity), 0);

    return (
        <>
            <div
                className={`relative rounded-2xl p-[1px] bg-gradient-to-b ${themeConfig.cardBg} border ${themeConfig.glow} transition-all duration-300 w-full cursor-pointer group overflow-hidden flex flex-col`}
                onClick={() => setIsModalOpen(true)}
            >
                {/* Holographic Top Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${themeConfig.badgeBg} opacity-80 z-20`}></div>

                {/* Level Badge (Trading Card Style) */}
                <div className="absolute top-1 right-1 z-20 shadow-lg pointer-events-none">
                    <div className={`px-4 py-1.5 rounded-bl-xl rounded-tr-xl ${themeConfig.badgeBg} border-l border-b ${themeConfig.border} flex items-center gap-2`}>
                        <span className="font-black italic text-sm text-white drop-shadow-md tracking-wider">
                            Lv.{themeConfig.level}
                        </span>
                        <span className="w-px h-3 bg-white/30 hidden sm:block"></span>
                        <span className="text-xs font-bold text-white/90 hidden sm:block">
                            {themeConfig.label}
                        </span>
                    </div>
                </div>

                {/* Card Background Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none"></div>

                <div className="relative z-10 p-5 flex-1 flex flex-col">
                    {/* Header: Name and Ticker */}
                    <div className="mb-4 pr-20">
                        <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                            <span className={themeConfig.accentText}>{asset.symbol}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{marketLabel}</span>
                            {sectorDisplay && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                    <span className="truncate">{sectorDisplay}</span>
                                </>
                            )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover:text-amber-100 transition-colors drop-shadow-md">
                            {asset.name || asset.symbol}
                        </h3>
                    </div>

                    {/* Stats Layout (2 Rows) */}
                    <div className="flex flex-col gap-3 mb-5">

                        {/* Top Row: Current Value & Total Profit (Larger, more emphasis) */}
                        <div className="flex gap-2 sm:gap-3">
                            {/* Current Value */}
                            <div className="w-[40%] rounded-xl p-3 sm:p-4 border border-white/5 bg-black/40 shadow-inner flex flex-col justify-center relative min-w-0">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Current Value</span>
                                    {!stockData && onRefresh && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                            className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 hover:text-amber-300 text-[10px] font-bold transition-all border border-amber-700/30 hover:border-amber-600/50 shadow-sm"
                                            title="현재가 새로고침"
                                        >
                                            <RefreshCw size={14} />
                                            <span className="hidden sm:inline">새로고침</span>
                                        </button>
                                    )}
                                </div>
                                <div className={`text-base sm:text-lg md:text-xl lg:text-xl font-black tracking-tight ${changeAmount > 0 ? 'text-red-400' : changeAmount < 0 ? 'text-blue-400' : 'text-white'} drop-shadow-lg mb-1 truncate`}>
                                    {formatPrice(currentPrice)}
                                </div>
                                <div className="flex items-center gap-1 mt-auto">
                                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${changeAmount > 0 ? 'bg-red-500/20 text-red-400' : changeAmount < 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                                        <span>{changeAmount > 0 ? '▲' : changeAmount < 0 ? '▼' : '-'}</span>
                                        <span>{Math.abs(changePercent).toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Profit */}
                            <div className="w-[60%] rounded-xl p-3 sm:p-4 border border-white/5 bg-gradient-to-br from-white/[0.02] to-black/30 shadow-inner flex flex-col justify-center items-end relative min-w-0">
                                <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1 block">Total Profit</span>
                                <div className={`text-lg sm:text-xl md:text-2xl lg:text-2xl font-black tracking-tighter ${colorClass} drop-shadow-md mb-0.5 truncate w-full text-right`} title={`${profitSign}${formatPrice(Math.abs(profitLoss))}`}>
                                    {profitSign}{formatPrice(Math.abs(profitLoss))}
                                </div>
                                <div className={`text-sm sm:text-base font-bold ${colorClass} truncate mb-1 w-full text-right`}>
                                    {profitSign}{Math.abs(returnRate).toFixed(2)}%
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 truncate mt-auto w-full text-right" title={`평가액: ${formatPrice(currentPrice * asset.quantity)}`}>
                                    평가액: {formatPrice(currentPrice * asset.quantity)}
                                </div>
                                {totalDividend > 0 && (
                                    <div className="text-[10px] sm:text-[11px] font-bold text-yellow-500 truncate mt-1 w-full text-right" title={`배당금: ${formatPrice(totalDividend)}`}>
                                        배당금: {formatPrice(totalDividend)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Row: Invested & Avg/Qty (Smaller, supportive) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Invested</div>
                                <div className="font-semibold text-gray-300 text-xs truncate">
                                    {formatPrice(totalPurchase)}
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Avg / Qty</div>
                                <div className="font-semibold text-gray-300 text-xs truncate">
                                    {formatPrice(asset.pricePerShare)}<span className="text-gray-600 font-normal mx-0.5">/</span>{asset.quantity.toLocaleString()}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Card Description/Effect Text (Memo & Targets) */}
                    <div className={`mt-auto rounded-lg p-3 ${themeConfig.accentBg} border border-white/5`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${themeConfig.badgeBg}`}></div>
                            <span className={`text-sm font-black tracking-widest uppercase ${themeConfig.accentText}`}>목표</span>
                        </div>

                        <div className="text-sm text-gray-200 leading-relaxed mb-3 min-h-[2.5rem] italic">
                            "{asset.memo || <span className="text-gray-500 font-normal">설정된 목표 메모가 없습니다.</span>}"
                        </div>

                        {(asset.targetPriceLower || asset.targetPriceUpper) ? (
                            <div className="flex gap-4 border-t border-white/10 pt-3 mt-auto">
                                {asset.targetPriceLower ? (() => {
                                    const lowerInfo = getLowerTargetInfo();
                                    const isWarning = lowerInfo?.isWarning || false;
                                    const isDanger = lowerInfo?.isDanger || false;
                                    return (
                                        <div className={`flex-1 rounded border p-2 min-w-0 relative overflow-hidden ${isDanger
                                            ? 'bg-red-600/30 border-red-400/60 animate-pulse'
                                            : isWarning
                                                ? 'bg-amber-900/30 border-amber-400/50'
                                                : 'bg-blue-900/20 border-blue-500/20'
                                            }`}>
                                            {(isWarning || isDanger) && (
                                                <div className={`absolute inset-0 ${isDanger ? 'bg-red-500/10' : 'bg-amber-500/5'}`} />
                                            )}
                                            <div className="flex items-center gap-1 mb-0.5 relative z-10">
                                                <span className={`text-[9px] uppercase truncate ${isDanger ? 'text-red-300 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-blue-400/80'
                                                    }`}>
                                                    {isDanger ? '⚠️ 하한 돌파!' : isWarning ? '⚡ 하한 근접' : '하한 목표 (Support)'}
                                                </span>
                                                <span className="group/help relative inline-flex">
                                                    <HelpCircle size={10} className="text-blue-400/50 cursor-help" />
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] bg-[#333] text-gray-200 whitespace-nowrap opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-50">최고가 대비 비율</span>
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-1 truncate relative z-10">
                                                <span className={`text-sm font-black tracking-tight ${isDanger ? 'text-red-300' : isWarning ? 'text-amber-300' : 'text-blue-300'
                                                    }`}>{asset.targetPriceLower.toLocaleString()}</span>
                                                {lowerInfo && (
                                                    <span className={`text-[10px] font-bold ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-400/70'
                                                        }`}>({lowerInfo.distanceRate > 0 ? '-' : '+'}{Math.abs(lowerInfo.distanceRate).toFixed(1)}%)</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })() : null}
                                {asset.targetPriceUpper ? (() => {
                                    const rate = getGoalRate(asset.targetPriceUpper.toString());
                                    return (
                                        <div className="flex-1 bg-red-900/20 rounded border border-red-500/20 p-2 text-right min-w-0">
                                            <div className="flex items-center justify-end gap-1 mb-0.5">
                                                <span className="group/help relative inline-flex">
                                                    <HelpCircle size={10} className="text-red-400/50 cursor-help" />
                                                    <span className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded text-[10px] bg-[#333] text-gray-200 whitespace-nowrap opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-50">AVG대비 비율</span>
                                                </span>
                                                <span className="text-[9px] text-red-400/80 uppercase truncate">상한 목표 (Resist)</span>
                                            </div>
                                            <div className="flex items-baseline justify-end gap-1 truncate">
                                                {rate !== null && (
                                                    <span className="text-[10px] text-red-400/70">({rate > 0 ? '+' : ''}{rate.toFixed(2)}%)</span>
                                                )}
                                                <span className="text-sm font-black text-red-300 tracking-tight">{asset.targetPriceUpper.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })() : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Modal - Outside of the clickable card div */}
            <StockDetailChartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                asset={asset}
            />
        </>
    );
}
