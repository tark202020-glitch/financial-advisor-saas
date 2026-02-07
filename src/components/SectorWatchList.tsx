"use client";

import { Stock } from '@/lib/mockData';
import { useState } from 'react';
import StockDetailModal from './modals/StockDetailModal';
import SectorRowItem from './SectorRowItem';

interface SectorWatchListProps {
    title: string;
    stocks: Stock[];
    onAddClick?: () => void; // Optional Add Handler
}

import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';

export default function SectorWatchList({ title, stocks, onAddClick }: SectorWatchListProps) {
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Batch Fetching Logic
    const market = title.includes('Korea') || title.includes('KR') || title.includes('한국') ? 'KR' : 'US';
    const symbols = stocks.map(s => s.symbol);
    const { getStockData, isLoading } = useBatchStockPrice(symbols, market);

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        {onAddClick && (
                            <button
                                onClick={onAddClick}
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                + 종목 추가
                            </button>
                        )}
                    </div>
                </div>
                {lastUpdated && (
                    <div className="text-xs text-slate-400 font-medium mb-4 text-right">
                        Last Update: {lastUpdated}
                    </div>
                )}
                <div className="space-y-3">
                    {stocks.map((stock) => (
                        <SectorRowItem
                            key={stock.symbol}
                            stock={stock}
                            category={market}
                            onClick={setSelectedStock}
                            // Pass Batch Data
                            overrideData={getStockData(stock.symbol)}
                            disableSelfFetch={true}
                            // We don't really need onTimeUpdate for batch usually, 
                            // but we can keep it if SectorRowItem emits it.
                            onTimeUpdate={setLastUpdated}
                        />
                    ))}
                </div>
            </div>

            {selectedStock && (
                <StockDetailModal
                    symbol={selectedStock.symbol}
                    name={selectedStock.name}
                    marketType={title.includes('Korea') || title.includes('KR') ? 'KR' : 'US'}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </>
    );
}
