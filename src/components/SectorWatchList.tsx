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

export default function SectorWatchList({ title, stocks, onAddClick }: SectorWatchListProps) {
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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
                    {lastUpdated && (
                        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                            {lastUpdated} 기준
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    {stocks.map((stock) => (
                        <SectorRowItem
                            key={stock.symbol}
                            stock={stock}
                            // Detect category from title: "Korea Major", "US Finance", etc.
                            category={title.includes('Korea') || title.includes('KR') ? 'KR' : 'US'}
                            onClick={setSelectedStock}
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
