"use client";

import { useStockPrice } from '@/hooks/useStockPrice';
import { Asset, usePortfolio } from '@/context/PortfolioContext';
import { useState } from 'react';
import StockDetailChartModal from '../modals/StockDetailChartModal';

interface PortfolioCardProps {
    asset: Asset;
}

export default function PortfolioCard({ asset }: PortfolioCardProps) {
    const { updateAsset } = usePortfolio();
    const stockData = useStockPrice(asset.symbol, asset.pricePerShare, asset.category);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Current Price Logic
    const currentPrice = stockData?.price || asset.pricePerShare; // Fallback to buy price if no data
    const changePercent = stockData?.changePercent || 0;
    const changeAmount = stockData?.change || 0;

    // Valuation Logic
    // Valuation Logic
    const totalPurchase = asset.pricePerShare * asset.quantity;
    const currentValuation = currentPrice * asset.quantity;
    const profitLoss = currentValuation - totalPurchase;

    // Calculate Return Rate (Handle Division by Zero)
    const rawReturnRate = totalPurchase === 0 ? 0 : (profitLoss / totalPurchase) * 100;
    const returnRate = isNaN(rawReturnRate) ? 0 : rawReturnRate;

    // Local state for inputs to prevent jitters, sync on blur
    const [memo, setMemo] = useState(asset.memo || '');
    const [targetLower, setTargetLower] = useState(asset.targetPriceLower?.toString() || '');
    const [targetUpper, setTargetUpper] = useState(asset.targetPriceUpper?.toString() || '');

    // Color Logic
    const isPositive = profitLoss >= 0;
    const colorClass = isPositive ? 'text-red-500' : 'text-blue-600';
    const profitSign = isPositive ? '▲' : '▼';

    const handleSave = () => {
        updateAsset(asset.id, {
            memo,
            targetPriceLower: targetLower ? parseInt(targetLower.replace(/,/g, '')) : undefined,
            targetPriceUpper: targetUpper ? parseInt(targetUpper.replace(/,/g, '')) : undefined,
        });
    };

    return (
        <>
            <div
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition w-full relative cursor-pointer group"
                onClick={() => setIsModalOpen(true)}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs text-slate-500 mb-1 flex gap-1">
                            <span>{asset.symbol}</span>
                            <span className="text-slate-300">|</span>
                            <span>{asset.category === 'KR' ? 'KOSPI' : asset.category}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight transition group-hover:text-indigo-600">
                            {asset.name || asset.symbol}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${changeAmount > 0 ? 'text-red-500' : changeAmount < 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                            {currentPrice.toLocaleString()}
                        </div>
                        <div className={`text-xs font-medium flex items-center justify-end gap-1 ${changeAmount > 0 ? 'text-red-500' : changeAmount < 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                            <span>{changeAmount > 0 ? '▲' : changeAmount < 0 ? '▼' : '-'}</span>
                            <span>{Math.abs(changePercent).toFixed(2)}%</span>
                            <span>{Math.abs(changeAmount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-y-6 text-sm mb-6">
                    <div>
                        <div className="text-slate-500 text-xs mb-1">매입금액</div>
                        <div className="font-medium text-slate-900 text-lg">
                            {totalPurchase.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-500 text-xs mb-1">매입단가 | 수량</div>
                        <div className="font-medium text-slate-900">
                            {asset.pricePerShare.toLocaleString()} <span className="text-slate-300 mx-1">|</span> {asset.quantity.toLocaleString()}
                        </div>
                    </div>

                    <div>
                        <div className="text-slate-500 text-xs mb-1">평가손익</div>
                        <div className={`font-bold text-xl ${colorClass}`}>
                            {profitLoss.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-500 text-xs mb-1">수익률</div>
                        <div className={`font-bold text-xl flex items-center justify-end gap-1 ${colorClass}`}>
                            <span className="text-sm">{profitSign}</span>
                            {Math.abs(returnRate).toFixed(2)}%
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* Inputs Section */}
                <div className="space-y-4">
                    {/* Memo */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <label className="block text-xs text-slate-500 mb-1">목표 메모</label>
                        <input
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            onBlur={handleSave}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            placeholder="메모를 입력하세요"
                        />
                    </div>

                    {/* Targets */}
                    <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-1">
                            <label className="block text-xs text-slate-500 mb-1">매도 하한 목표</label>
                            <input
                                type="text"
                                value={targetLower}
                                onChange={(e) => setTargetLower(e.target.value)}
                                onBlur={handleSave}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-slate-500 mb-1">매도 상한 목표</label>
                            <input
                                type="text"
                                value={targetUpper}
                                onChange={(e) => setTargetUpper(e.target.value)}
                                onBlur={handleSave}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                placeholder="0"
                            />
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
