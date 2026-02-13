"use client";

// import { useStockPrice } from '@/hooks/useStockPrice';
import { Asset, usePortfolio } from '@/context/PortfolioContext';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import StockDetailChartModal from '../modals/StockDetailChartModal';

interface PortfolioCardProps {
    asset: Asset;
    stockData: {
        price: number;
        change: number;
        changePercent: number;
        time?: string;
        sector?: string;
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
    const [targetLower, setTargetLower] = useState(asset.targetPriceLower?.toString() || '');
    const [targetUpper, setTargetUpper] = useState(asset.targetPriceUpper?.toString() || '');

    // Color Logic
    const isPositive = profitLoss >= 0;
    const colorClass = isPositive ? 'text-red-400' : 'text-blue-400';
    const profitSign = isPositive ? '▲' : '▼';

    // Formatting Logic
    const isUS = asset.category !== 'KR';
    const currencyPrefix = isUS ? '$' : '';
    const marketLabel = asset.category === 'KR' ? 'KR' : 'US'; // Keep simple or match Watchlist
    const sectorDisplay = stockData?.sector || asset.sector; // Priority to live data, fallback to DB

    // Helper for currency formatting
    const formatCurrency = (value: number, isInteger: boolean = false) => {
        const formatted = isInteger || (isUS && value % 1 === 0) ? Math.round(value).toLocaleString() : value.toLocaleString();
        return `${currencyPrefix}${formatted}`;
    };

    // Specific format for Purchase Price (Average Price) - Integer for US
    const formatPurchasePrice = (price: number) => {
        if (isUS) {
            return `${currencyPrefix}${Math.round(price).toLocaleString()}`;
        }
        return price.toLocaleString();
    };

    const handleSave = () => {
        updateAsset(asset.id, {
            memo,
            targetPriceLower: targetLower ? parseFloat(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseFloat(targetUpper.replace(/,/g, '')) : undefined,
        });
    };

    // Calculate Goal Rate
    const getGoalRate = (target: string) => {
        if (!target || !asset.pricePerShare) return null;
        const t = parseFloat(target.replace(/,/g, ''));
        if (isNaN(t)) return null;
        const r = ((t - asset.pricePerShare) / asset.pricePerShare) * 100;
        return r;
    };

    return (
        <>
            <div
                className="bg-[#1E1E1E] rounded-3xl border border-[#333] shadow-lg shadow-black/20 hover:shadow-xl hover:border-gray-600 transition w-full relative cursor-pointer group overflow-hidden"
                onClick={() => setIsModalOpen(true)}
            >
                {/* Header Section */}
                <div className="bg-[#252525] p-6 border-b border-[#333] flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="text-xs text-gray-500 mb-1 flex gap-1 truncate">
                            <span className="text-gray-400">{asset.symbol}</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-gray-400">{marketLabel}</span>
                            {sectorDisplay && (
                                <>
                                    <span className="text-gray-600">|</span>
                                    <span className="truncate text-gray-400">{sectorDisplay}</span>
                                </>
                            )}
                        </div>
                        <div className="h-14 flex items-center">
                            <h3 className="text-2xl font-bold text-white tracking-tight transition group-hover:text-indigo-400 line-clamp-2">
                                {asset.name || asset.symbol}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        {!stockData && onRefresh ? (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-sm text-gray-500">가격 미조회</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-600/30 transition"
                                >
                                    <RefreshCw size={12} />
                                    새로고침
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={`text-2xl font-bold ${changeAmount > 0 ? 'text-red-400' : changeAmount < 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                                    {formatCurrency(currentPrice)}
                                </div>
                                <div className={`text-xs font-medium flex items-center justify-end gap-1 ${changeAmount > 0 ? 'text-red-400' : changeAmount < 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                    <span>{changeAmount > 0 ? '▲' : changeAmount < 0 ? '▼' : '-'}</span>
                                    <span>{Math.abs(changePercent).toFixed(2)}%</span>
                                    <span>{isUS ? '$' : ''}{Math.abs(changeAmount).toLocaleString()}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-6 pt-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-6 text-sm mb-6">
                        <div>
                            <div className="text-gray-500 text-xs mb-1">매입금액</div>
                            <div className="font-medium text-gray-200 text-lg">
                                {formatCurrency(totalPurchase)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-500 text-xs mb-1">매입단가 | 수량</div>
                            <div className="font-medium text-gray-200">
                                {formatPurchasePrice(asset.pricePerShare)} <span className="text-gray-600 mx-1">|</span> {asset.quantity.toLocaleString()}
                            </div>
                        </div>

                        <div>
                            <div className="text-gray-500 text-xs mb-1">평가손익</div>
                            <div className={`font-bold text-xl ${colorClass}`}>
                                {formatCurrency(profitLoss)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-500 text-xs mb-1">수익률</div>
                            <div className={`font-bold text-xl flex items-center justify-end gap-1 ${colorClass}`}>
                                <span className="text-sm">{profitSign}</span>
                                {Math.abs(returnRate).toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#333] my-4"></div>

                    {/* Inputs Section */}
                    <div className="space-y-4">
                        {/* Memo */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <label className="block text-xs text-gray-500 mb-1">목표 메모</label>
                            <input
                                type="text"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                onBlur={handleSave}
                                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-700"
                                placeholder="메모를 입력하세요"
                            />
                        </div>

                        {/* Targets */}
                        <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1 flex items-center justify-between">
                                    하한 목표
                                    {getGoalRate(targetLower) !== null && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getGoalRate(targetLower)! >= 0 ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {getGoalRate(targetLower)! > 0 ? '+' : ''}{getGoalRate(targetLower)!.toFixed(1)}%
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={targetLower}
                                    onChange={(e) => setTargetLower(e.target.value)}
                                    onBlur={handleSave}
                                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-700"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1 flex items-center justify-between">
                                    상한 목표
                                    {getGoalRate(targetUpper) !== null && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getGoalRate(targetUpper)! >= 0 ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {getGoalRate(targetUpper)! > 0 ? '+' : ''}{getGoalRate(targetUpper)!.toFixed(1)}%
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={targetUpper}
                                    onChange={(e) => setTargetUpper(e.target.value)}
                                    onBlur={handleSave}
                                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-700"
                                    placeholder="0"
                                />
                            </div>
                        </div>
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
