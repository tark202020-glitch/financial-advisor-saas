"use client";

import { Stock } from '@/lib/mockData';
import { useState } from 'react';
import StockDetailModal from './modals/StockDetailChartModal';
import SectorRowItem from './SectorRowItem';
import { Plus, RefreshCw } from 'lucide-react';
import { Asset } from '@/context/PortfolioContext';

interface SectorWatchListProps {
    title: string;
    stocks: Stock[];
    onAddClick?: () => void; // Optional Add Handler
    onRemoveItem?: (stockId: string) => void;
}

import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';
import StockLoadError from '@/components/ui/StockLoadError';

export default function SectorWatchList({ title, stocks, onAddClick, onRemoveItem }: SectorWatchListProps) {
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    // Helper to determine market
    const getMarket = (stock: Stock): 'KR' | 'US' => {
        if (stock.market) return stock.market;
        // Fallback to title-based detection for static lists
        return (title.includes('Korea') || title.includes('KR') || title.includes('한국')) ? 'KR' : 'US';
    };

    const krSymbols = stocks.filter(s => getMarket(s) === 'KR').map(s => s.symbol);
    const usSymbols = stocks.filter(s => getMarket(s) === 'US').map(s => s.symbol);

    const { getStockData: getKrData, hasError: krError, refetch: refetchKr, isLoading: krLoading } = useBatchStockPrice(krSymbols, 'KR');
    const { getStockData: getUsData, hasError: usError, refetch: refetchUs, isLoading: usLoading } = useBatchStockPrice(usSymbols, 'US');

    const getStockData = (symbol: string) => getKrData(symbol) || getUsData(symbol);
    const hasAnyError = krError || usError;
    const isRefreshing = krLoading || usLoading;

    const handleRefresh = () => {
        if (krError || krSymbols.length > 0) refetchKr();
        if (usError || usSymbols.length > 0) refetchUs();
    };

    // Build a dummy Asset for view-only modal
    const buildDummyAsset = (stock: Stock): Asset => ({
        id: 0,
        symbol: stock.symbol,
        name: stock.name,
        category: getMarket(stock),
        pricePerShare: 0,
        quantity: 0,
        sector: stock.sector || '',
        trades: [],
    });

    // Check if any stock has missing data (price = 0 or null)
    const hasMissingData = stocks.some(s => {
        const data = getStockData(s.symbol);
        return !data || data.price <= 0;
    });

    return (
        <div className="bg-[#1E1E1E] rounded-xl shadow-lg shadow-black/20 border border-[#333] p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
                <div className="flex items-center gap-2 w-full justify-between">
                    <h3 className="text-lg font-bold text-white truncate pr-2" title={title}>{title}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Refresh Button - visible when there's error or missing data */}
                        {(hasAnyError || hasMissingData) && !isRefreshing && (
                            <button
                                onClick={handleRefresh}
                                className="text-xs bg-amber-900/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-900/40 transition-colors flex items-center gap-1"
                                title="데이터 새로고침"
                            >
                                <RefreshCw size={12} /> 새로고침
                            </button>
                        )}
                        {isRefreshing && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <RefreshCw size={12} className="animate-spin" /> 로딩중...
                            </span>
                        )}
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
            </div>

            {/* Error Banner */}
            {hasAnyError && !isRefreshing && (
                <StockLoadError
                    message="일부 종목 데이터를 불러오지 못했습니다"
                    onRetry={handleRefresh}
                    variant="block"
                    retrying={isRefreshing}
                />
            )}

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
                        onClick={() => setSelectedStock(stock)}
                        // Pass Batch Data
                        overrideData={getStockData(stock.symbol)}
                        disableSelfFetch={true}
                        onTimeUpdate={setLastUpdated}
                        onRemove={onRemoveItem && stock.id ? () => onRemoveItem(stock.id!) : undefined}
                    />
                ))}
            </div>

            {/* View-Only StockDetailChartModal */}
            {selectedStock && (
                <StockDetailModal
                    isOpen={true}
                    onClose={() => setSelectedStock(null)}
                    asset={buildDummyAsset(selectedStock)}
                    viewOnly={true}
                />
            )}
        </div>
    );
}
