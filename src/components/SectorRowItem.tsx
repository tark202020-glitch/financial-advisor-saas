"use client";

import { Stock } from '@/lib/mockData';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useStockPrice } from '@/hooks/useStockPrice';

import { useEffect } from 'react';

interface SectorRowItemProps {
    stock: Stock;
    // We infer category from parent or stock data if needed, but for simplicity taking stock
    // In a real app we might pass category explicitly if stock doesn't have it
    category?: string;
    onClick: (stock: Stock) => void;
    onTimeUpdate?: (time: string) => void;
}

export default function SectorRowItem({ stock, onClick, category, onTimeUpdate }: SectorRowItemProps) {
    // Use custom hook to get real-time price
    // We pass 'category' to help decide if it is KR or US stock logic
    // If 'category' is not passed, we might guess from symbol or parent title logic, 
    // but for now let's assume parent title logic is handled in useStockPrice or passed down.
    // Actually useStockPrice takes (symbol, initialPrice, category). 
    // We need to pass category.

    const stockData = useStockPrice(stock.symbol, stock.price, category);

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

    // Assuming marketType is derived from category or stock data, for now, let's use a placeholder
    // In a real app, you'd pass this down or derive it more robustly.
    const marketType = category === 'US' ? 'US' : 'KR'; // Placeholder for marketType

    return (
        <div
            onClick={() => onClick(currentStock)}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border ${isVolatile ? 'bg-amber-50 border-amber-200' : 'bg-white border-transparent hover:border-slate-100'
                }`}
        >
            <div className="flex items-center gap-3">
                {isVolatile && <div className="text-amber-500 font-bold">⭐</div>}

                {/* Removed Circle with Text per User Request to prevent overlay/clutter */}

                <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                        {stock.name}
                        {marketType === 'US' && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">US</span>}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        {stock.symbol}
                        <span className="text-slate-300">|</span>
                        <span>{stock.sector}</span>
                    </div>
                </div>
            </div>

            {/* 2. Price (Aligned Right) - Re-added from original structure as it was missing in the provided snippet */}
            <div className="text-right pr-4">
                <div className="font-bold text-slate-900 text-lg tracking-tight">
                    {(price && price > 0) ? price.toLocaleString() : <span className="text-slate-300">---</span>}
                </div>
            </div>

            {/* 3. Change (Aligned Right) */}
            <div className={`flex flex-col items-end justify-center ${priceColor}`}>
                <div className="flex items-center space-x-1 font-bold">
                    {change > 0 ? <ArrowUp size={16} /> : change < 0 ? <ArrowDown size={16} /> : null}
                    <span className="text-base">{Math.abs(changePercent).toFixed(2)}%</span>
                </div>
                <div className="text-xs opacity-80 font-medium">
                    {change > 0 ? '+' : ''}{change.toLocaleString()}
                </div>
            </div>
        </div>
    );
}
