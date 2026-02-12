"use client";

import { Stock } from '@/lib/mockData';
import { useState } from 'react';
import StockDetailModal from './modals/StockDetailModal';
import SectorRowItem from './SectorRowItem';
import { Plus } from 'lucide-react';

interface SectorWatchListProps {
    title: string;
    stocks: Stock[];
    onAddClick?: () => void; // Optional Add Handler
    onRemoveItem?: (stockId: string) => void;
}

import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';

export default function SectorWatchList({ title, stocks, onAddClick, onRemoveItem }: SectorWatchListProps) {
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Helper to determine market
    const getMarket = (stock: Stock): 'KR' | 'US' => {
        if (stock.market) return stock.market;
        // Fallback to title-based detection for static lists
        return (title.includes('Korea') || title.includes('KR') || title.includes('한국')) ? 'KR' : 'US';
    };

    const krSymbols = stocks.filter(s => getMarket(s) === 'KR').map(s => s.symbol);
    const usSymbols = stocks.filter(s => getMarket(s) === 'US').map(s => s.symbol);

    const { getStockData: getKrData } = useBatchStockPrice(krSymbols, 'KR');
    const { getStockData: getUsData } = useBatchStockPrice(usSymbols, 'US');

    const getStockData = (symbol: string) => getKrData(symbol) || getUsData(symbol);

    return (
        <div className="bg-[#1E1E1E] rounded-xl shadow-lg shadow-black/20 border border-[#333] p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
                <div className="flex items-center gap-2 w-full justify-between">
                    <h3 className="text-lg font-bold text-white truncate pr-2" title={title}>{title}</h3>
                    {onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="text-xs bg-[#F7D047]/10 text-[#F7D047] px-2 py-1 rounded hover:bg-[#F7D047]/20 transition-colors flex items-center gap-1 shrink-0"
                        >
                            <Plus size={12} /> 종목 추가
                        </button>
                    )}
                </div>
            </div>
            {lastUpdated && (
                <div className="text-[10px] text-gray-600 font-medium mb-2 text-right">
                    Update: {lastUpdated}
                </div>
            )}
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {stocks.map((stock) => (
                    <SectorRowItem
                        key={stock.symbol}
                        stock={stock}
                        category={getMarket(stock)}
                        onClick={() => { }} // No-op
                        // Pass Batch Data
                        overrideData={getStockData(stock.symbol)}
                        disableSelfFetch={true}
                        // We don't really need onTimeUpdate for batch usually, 
                        // but we can keep it if SectorRowItem emits it.
                        onTimeUpdate={setLastUpdated}
                        onRemove={onRemoveItem && stock.id ? () => onRemoveItem(stock.id!) : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
