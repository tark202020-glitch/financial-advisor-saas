

"use client";

import { MarketIndex } from '@/lib/mockData';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMarketIndex } from '@/hooks/useMarketIndex';
import { useStockPrice } from '@/hooks/useStockPrice';

interface MacroStripProps {
    indices: MarketIndex[];
    exchangeRate: { name: string; value: number; change: number; changePercent: number };
    interestRates: { korea: number; usa: number };
}

function IndexDisplay({ index }: { index: MarketIndex }) {
    // Determine Symbol and Category for Hook
    let symbol = '';
    let category: 'KR' | 'US' = 'KR';
    let isStockProxy = false; // For US indices using ETF proxy

    if (index.name === 'KOSPI') {
        symbol = '0001';
        category = 'KR';
    } else if (index.name === 'KOSDAQ') {
        symbol = '1001';
        category = 'KR';
    } else if (index.name === 'NASDAQ') {
        symbol = 'QQQ'; // Use QQQ as proxy
        isStockProxy = true;
        category = 'US';
    } else if (index.name === 'S&P 500') {
        symbol = 'SPY'; // Use SPY as proxy
        isStockProxy = true;
        category = 'US';
    }

    // Use hooks conditionally (Hooks must technically always run, so we run both but ignore one)
    // Actually, cleaner way is to separate components or unify hooks. 
    // Let's use two separate data sources.

    // For KR Indices
    const indexData = useMarketIndex(symbol, 0, category);

    // For US Proxies (Stock API)
    const stockData = useStockPrice(symbol, 0, 'US');

    // Select Data
    const data = isStockProxy ? stockData : indexData;

    // Check if data is valid
    // data might be null if hook returns null (no connection/no mock)
    // or data might be { price: 0 } if we passed 0 as initial and hook converts it (old behavior)
    // We want to treat null OR 0 as invalid.

    const hasData = !!data && (isStockProxy ? (data as any).price > 0 : (data as any).value > 0);

    if (!hasData || !data) {
        return (
            <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-400">{index.name}</span>
                <span className="text-slate-600">---</span>
            </div>
        );
    }

    const val = isStockProxy ? (data as any).price : (data as any).value;
    const change = (data as any).change;
    const pct = (data as any).changePercent || (data as any).rate || 0;

    return (
        <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">{index.name}</span>
            <span>{val.toLocaleString()}</span>
            <span
                className={`flex items-center ${change >= 0 ? 'text-red-400' : 'text-blue-400'}`}
            >
                {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(pct).toFixed(2)}%
            </span>
        </div>
    );
}

export default function MacroStrip({ indices, exchangeRate, interestRates }: MacroStripProps) {
    return (
        <div className="bg-slate-900 text-white text-sm py-2 px-4 flex items-center justify-between overflow-x-auto whitespace-nowrap border-b border-slate-800">
            <div className="flex items-center space-x-6">
                {indices.map((index) => (
                    <IndexDisplay key={index.name} index={index} />
                ))}

                {/* Exchange Rate (Currently Mock) */}
                <div className="flex items-center space-x-2 pl-4 border-l border-slate-700">
                    <span className="font-bold text-slate-400">USD/KRW</span>
                    <span className="text-slate-600">---</span>
                </div>
            </div>

            <div className="flex items-center space-x-4 pl-6">
                <div className="flex items-center space-x-1">
                    <span className="text-slate-500">KR 금리</span>
                    <span className="text-slate-600">---</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="text-slate-500">US 금리</span>
                    <span className="text-slate-600">---</span>
                </div>
            </div>
        </div>
    );
}
