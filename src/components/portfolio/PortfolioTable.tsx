"use client";

import { usePortfolio, Asset } from '@/context/PortfolioContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import PortfolioCard from './PortfolioCard';
import { useState, useMemo } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

type SortOption = 'newest' | 'value' | 'name';

export default function PortfolioTable() {
    const { assets, isLoading } = usePortfolio();
    const { lastData } = useWebSocketContext();

    // State
    const [filter, setFilter] = useState({
        kr: true,
        us: true,
        closed: false
    });
    const [sort, setSort] = useState<SortOption>('newest');

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

    // Filter & Sort Logic
    const filteredAndSortedAssets = useMemo(() => {
        let result = assets.filter(asset => {
            const isClosed = asset.quantity === 0;
            if (isClosed) return filter.closed;
            if (asset.category === 'KR') return filter.kr;
            if (asset.category === 'US') return filter.us;
            return false;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'value':
                    // Calculate current value for sorting
                    const priceA = lastData.get(a.symbol)?.price || a.pricePerShare;
                    const valA = priceA * a.quantity;

                    const priceB = lastData.get(b.symbol)?.price || b.pricePerShare;
                    const valB = priceB * b.quantity;

                    return valB - valA; // Descending
                case 'newest':
                default:
                    // Assuming higher ID = newer, or create_at if available
                    // Fallback to simple generic ID comparison or reverse array index (if stable)
                    // If assets are ordered by created_at from DB (ASC), then reversing or sorting by ID DESC works.
                    // Context fetches with `order('created_at', { ascending: true })`
                    // So last item is newest. But standard 'sort' expects comparison.
                    return b.id - a.id;
            }
        });
    }, [assets, filter, sort, lastData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Skeleton Filter Bar */}
                <div className="flex gap-4 mb-4 animate-pulse">
                    <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                    <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                    <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-64 animate-pulse">
                            <div className="h-6 bg-slate-100 rounded mb-4 w-1/3"></div>
                            <div className="h-8 bg-slate-100 rounded mb-6 w-1/2"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-100 rounded"></div>
                                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">보유한 자산이 없습니다. 자산을 추가해 보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.kr ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="hidden" checked={filter.kr} onChange={() => setFilter(p => ({ ...p, kr: !p.kr }))} />
                        {filter.kr && <Check size={14} strokeWidth={3} />}
                        국내주식 ({counts.kr})
                    </label>
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.us ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="hidden" checked={filter.us} onChange={() => setFilter(p => ({ ...p, us: !p.us }))} />
                        {filter.us && <Check size={14} strokeWidth={3} />}
                        해외주식 ({counts.us})
                    </label>
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.closed ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                        <input type="checkbox" className="hidden" checked={filter.closed} onChange={() => setFilter(p => ({ ...p, closed: !p.closed }))} />
                        {filter.closed && <Check size={14} strokeWidth={3} />}
                        거래완료 ({counts.closed})
                    </label>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">정렬</span>
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                        >
                            <option value="newest">최신등록순</option>
                            <option value="value">평가금액순</option>
                            <option value="name">가나다순</option>
                        </select>
                        <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List */}
            {filteredAndSortedAssets.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">조건에 맞는 자산이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedAssets.map((asset) => (
                        <PortfolioCard key={asset.id} asset={asset} />
                    ))}
                </div>
            )}
        </div>
    );
}
