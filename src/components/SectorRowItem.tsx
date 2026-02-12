"use client";

import { Stock } from '@/lib/mockData';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useStockPrice } from '@/hooks/useStockPrice';

import { useEffect } from 'react';

interface SectorRowItemProps {
    stock: Stock;
    // We infer category from parent or stock data if needed, but for simplicity taking stock
    // In a real app we might pass category explicitly if stock doesn't have it
    category?: string;
    onClick: (stock: Stock) => void;
    onTimeUpdate?: (time: string) => void;
    overrideData?: any; // Accepting injected data from Batch
    disableSelfFetch?: boolean;
    onRemove?: () => void;
}

export default function SectorRowItem({ stock, onClick, category, onTimeUpdate, overrideData, disableSelfFetch = false, onRemove }: SectorRowItemProps) {
    // Use custom hook to get real-time price ONLY if overrideData is NOT provided AND self-fetch is enabled
    const shouldSkip = !!overrideData || disableSelfFetch;
    const hookData = useStockPrice(stock.symbol, stock.price, category, { skip: shouldSkip });

    const stockData = overrideData || hookData;

    const price = stockData ? stockData.price : 0;
    const change = stockData ? stockData.change : 0;
    const changePercent = stockData ? stockData.changePercent : 0;

    // Merge real-time data into a stock object for the onClick handler
    const currentStock: Stock = {
        ...stock,
        price,
        change,
        changePercent
    };

    // Korean Market Color Logic: Red uses for rising, Blue for falling
    const priceColor = change > 0 ? 'text-red-500' : change < 0 ? 'text-blue-500' : 'text-slate-500';

    // Pass time up to parent if changed
    useEffect(() => {
        if (stockData?.time && onTimeUpdate) {
            onTimeUpdate(stockData.time);
        }
    }, [stockData?.time, onTimeUpdate]);

    // Volatility Highlight logic: +/- 5%
    const isVolatile = Math.abs(currentStock.changePercent) >= 5;

    // Simplified market type derivation
    const marketType = category === 'US' ? 'US' : 'KR';
    const sectorDisplay = (stockData as any)?.sector || (stockData as any)?.bstp_kor_isnm || stock.sector;

    return (
        <div
            onClick={() => onClick(currentStock)}
            className={`grid grid-cols-12 items-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border gap-2 relative group ${isVolatile ? 'bg-amber-900/20 border-amber-700/50' : 'bg-[#252525] border-transparent hover:border-[#444]'
                }`}
        >
            {/* 1. Name & Sector (Col 1-6) */}
            <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                <div className="min-w-0">
                    <div className="font-bold text-white flex items-center gap-2 truncate">
                        <span className="truncate">{stock.name}</span>
                        {marketType === 'US' && <span className="text-[10px] px-1.5 py-0.5 bg-[#333] text-gray-400 rounded shrink-0">US</span>}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 truncate mt-0.5">
                        <span className="truncate">{stock.symbol}</span>
                        <span className="text-gray-600">|</span>
                        <span className="truncate">{marketType}</span>
                        {sectorDisplay && (
                            <>
                                <span className="text-gray-600">|</span>
                                <span className="truncate">{sectorDisplay}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Price (Col 7-9, Right Aligned) */}
            <div className="col-span-3 text-right">
                <div className="font-bold text-white text-lg tracking-tight">
                    {(price && price > 0) ? price.toLocaleString() : <span className="text-gray-600">---</span>}
                </div>
            </div>

            {/* 3. Change (Col 10-12, Right Aligned) */}
            <div className={`col-span-3 flex flex-col items-end justify-center ${priceColor}`}>
                <div className="flex items-center space-x-1 font-bold">
                    {change > 0 ? <ArrowUp size={16} /> : change < 0 ? <ArrowDown size={16} /> : null}
                    <span className="text-base">{Math.abs(changePercent).toFixed(2)}%</span>
                </div>
                <div className="text-xs opacity-80 font-medium">
                    {change > 0 ? '+' : ''}{change.toLocaleString()}
                </div>
            </div>

            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${stock.name}' 종목을 삭제하시겠습니까?`)) {
                            onRemove();
                        }
                    }}
                    className="absolute -top-2 -right-2 bg-[#333] rounded-full shadow-lg border border-[#444] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 transition-all z-10"
                    title="종목 삭제"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}
