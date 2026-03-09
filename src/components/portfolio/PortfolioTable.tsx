"use client";

import { usePortfolio, Asset } from '@/context/PortfolioContext';
import PortfolioCard from './PortfolioCard';
import { useState, useMemo } from 'react';
import { ArrowUpDown, Check, RefreshCw } from 'lucide-react';
import StockLoadError from '@/components/ui/StockLoadError';

type SortOption = 'newest' | 'value' | 'name';

export default function PortfolioTable() {
    const {
        assets, isLoading, error,
        getKrData, krHasError, krLoading, refetchKr,
        getUsData, usHasError, usLoading, refetchUs,
        goldData, goldLoading, fetchGoldPrice
    } = usePortfolio();

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-center">
                <p className="font-medium">데이터를 불러오지 못했습니다.</p>
                <p className="text-sm mt-1 text-red-300">{error}</p>
            </div>
        );
    }

    const hasAnyError = krHasError || usHasError;
    const isRefreshing = krLoading || usLoading || goldLoading;

    const handleRefreshAll = () => {
        refetchKr();
        refetchUs();
        fetchGoldPrice();
    };

    // State
    const [filter, setFilter] = useState({
        kr: true,
        us: true,
        closed: false
    });
    const [sort, setSort] = useState<SortOption>('value');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Counts
    const counts = useMemo(() => {
        return assets.reduce((acc, asset) => {
            const isClosed = asset.quantity === 0;
            if (isClosed) {
                acc.closed++;
            } else {
                if (asset.category === 'KR') acc.kr++;
                if (asset.category === 'US') acc.us++;
            }
            return acc;
        }, { kr: 0, us: 0, closed: 0 });
    }, [assets]);

    // Categories List
    const categories = useMemo(() => {
        const cats = new Set<string>();
        assets.forEach(a => {
            // Only consider categories for active assets, mapping empty/null to '미분류'
            if (a.quantity > 0) {
                cats.add(a.secondary_category || '미분류');
            }
        });
        return Array.from(cats).sort();
    }, [assets]);

    // Filter & Sort Logic
    const filteredAndSortedAssets = useMemo(() => {
        let result = assets.filter(asset => {
            const isClosed = asset.quantity === 0;
            if (isClosed) return filter.closed;
            if (asset.category === 'KR' && !filter.kr) return false;
            if (asset.category === 'US' && !filter.us) return false;

            // Filter by secondary category if not 'all'
            if (selectedCategory !== 'all') {
                const assetCategory = asset.secondary_category || '미분류';
                if (assetCategory !== selectedCategory) return false;
            }

            return true;
        });

        return result.sort((a, b) => {
            // Helper to get price
            const getPrice = (asset: Asset) => {
                if (asset.category === 'GOLD') return goldData?.price || asset.pricePerShare;
                const cleanSymbol = asset.symbol.replace('.KS', '');
                const data = asset.category === 'KR'
                    ? getKrData(cleanSymbol)
                    : getUsData(asset.symbol);
                return data?.price || asset.pricePerShare;
            };

            switch (sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'value':
                    // Calculate current value for sorting
                    const valA = getPrice(a) * a.quantity;
                    const valB = getPrice(b) * b.quantity;
                    return valB - valA; // Descending
                case 'newest':
                default:
                    return b.id - a.id;
            }
        });
    }, [assets, filter, sort, selectedCategory, getKrData, getUsData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Skeleton Filter Bar */}
                <div className="flex gap-4 mb-4 animate-pulse">
                    <div className="h-8 w-24 bg-[#252525] rounded-lg"></div>
                    <div className="h-8 w-24 bg-[#252525] rounded-lg"></div>
                    <div className="h-8 w-24 bg-[#252525] rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-[#1E1E1E] rounded-3xl border border-[#333] p-6 shadow-sm h-64 animate-pulse">
                            <div className="h-6 bg-[#252525] rounded mb-4 w-1/3"></div>
                            <div className="h-8 bg-[#252525] rounded mb-6 w-1/2"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-[#252525] rounded"></div>
                                <div className="h-4 bg-[#252525] rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="text-center py-12 bg-[#1E1E1E] rounded-xl border border-[#333]">
                <p className="text-gray-500">보유한 자산이 없습니다. 자산을 추가해 보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Error Refresh Banner */}
            {hasAnyError && !isRefreshing && (
                <StockLoadError
                    message="일부 종목 가격을 불러오지 못했습니다"
                    onRetry={handleRefreshAll}
                    variant="block"
                    retrying={isRefreshing}
                />
            )}

            {/* Control Bar */}
            <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-2xl border border-[#333] shadow-lg shadow-black/20 space-y-3">
                {/* Row 1: Filters + Refresh */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 select-none whitespace-nowrap
                            ${filter.kr ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                            <input type="checkbox" className="hidden" checked={filter.kr} onChange={() => setFilter(p => ({ ...p, kr: !p.kr }))} />
                            {filter.kr && <Check size={12} strokeWidth={3} />}
                            국내주식 ({counts.kr})
                        </label>
                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 select-none whitespace-nowrap
                            ${filter.us ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                            <input type="checkbox" className="hidden" checked={filter.us} onChange={() => setFilter(p => ({ ...p, us: !p.us }))} />
                            {filter.us && <Check size={12} strokeWidth={3} />}
                            해외주식 ({counts.us})
                        </label>
                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 select-none whitespace-nowrap
                            ${filter.closed ? 'bg-[#333] border-gray-600 text-gray-200' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                            <input type="checkbox" className="hidden" checked={filter.closed} onChange={() => setFilter(p => ({ ...p, closed: !p.closed }))} />
                            {filter.closed && <Check size={12} strokeWidth={3} />}
                            거래완료 ({counts.closed})
                        </label>
                    </div>
                    {/* Refresh */}
                    <button
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all select-none shrink-0 ${hasAnyError
                            ? 'bg-amber-900/30 border-amber-700/40 text-amber-400 hover:bg-amber-900/50'
                            : 'bg-[#121212] border-[#333] text-gray-400 hover:bg-[#252525] hover:text-white'
                            } disabled:opacity-50`}
                        title="전체 종목 시세 새로고침"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Row 2: Category + Sort */}
                <div className="flex items-center gap-3 border-t border-[#333]/50 pt-2.5">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[10px] text-gray-500 font-bold shrink-0">분류</span>
                        <div className="relative flex-1 min-w-0">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none w-full bg-[#121212] border border-[#333] text-indigo-400 text-xs rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-bold hover:border-indigo-500/50 transition truncate"
                            >
                                <option value="all" className="text-gray-300">전체</option>
                                <option disabled className="text-gray-600 bg-[#1a1a1a]">──────────</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="text-gray-300">{cat}</option>
                                ))}
                            </select>
                            <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500/50 pointer-events-none" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-[1px] h-5 bg-[#333]" />

                    {/* Sort */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-500 font-bold">정렬</span>
                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                                className="appearance-none bg-[#121212] border border-[#333] text-gray-300 text-xs rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-bold hover:border-gray-600 transition"
                            >
                                <option value="newest">최신등록순</option>
                                <option value="value">평가금액순</option>
                                <option value="name">가나다순</option>
                            </select>
                            <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>



            {/* List */}
            {filteredAndSortedAssets.length === 0 ? (
                <div className="text-center py-12 bg-[#1E1E1E] rounded-xl border border-dashed border-[#333]">
                    <p className="text-gray-500">조건에 맞는 자산이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {filteredAndSortedAssets.map((asset) => {
                        // Prepare Stock Data prop
                        const cleanSymbol = asset.symbol.replace('.KS', '');
                        let stockData;
                        if (asset.category === 'GOLD') {
                            stockData = goldData;
                        } else if (asset.category === 'KR') {
                            stockData = getKrData(cleanSymbol);
                        } else {
                            stockData = getUsData(asset.symbol);
                        }

                        return (
                            <PortfolioCard
                                key={asset.id}
                                asset={asset}
                                stockData={stockData}
                                onRefresh={asset.category === 'GOLD' ? fetchGoldPrice : asset.category === 'KR' ? refetchKr : refetchUs}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
