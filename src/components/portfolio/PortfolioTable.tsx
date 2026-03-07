"use client";

import { usePortfolio, Asset } from '@/context/PortfolioContext';
import PortfolioCard from './PortfolioCard';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowUpDown, Check, RefreshCw, Target, Loader2 } from 'lucide-react';
import { useBatchStockPrice } from '@/hooks/useBatchStockPrice';
import StockLoadError from '@/components/ui/StockLoadError';

type SortOption = 'newest' | 'value' | 'name';

export default function PortfolioTable() {
    const { assets, isLoading, error, updateAsset } = usePortfolio();

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-center">
                <p className="font-medium">데이터를 불러오지 못했습니다.</p>
                <p className="text-sm mt-1 text-red-300">{error}</p>
            </div>
        );
    }

    // 1. Extract Symbols for Batch Fetching
    const { krSymbols, usSymbols, hasGold } = useMemo(() => {
        const kr = new Set<string>();
        const us = new Set<string>();
        let gold = false;

        assets.forEach(a => {
            if (a.category === 'GOLD') {
                gold = true;
            } else if (a.category === 'KR') {
                const cleanSymbol = a.symbol.replace('.KS', '');
                kr.add(cleanSymbol);
            } else if (a.category === 'US') {
                us.add(a.symbol);
            }
        });

        return {
            krSymbols: Array.from(kr).reverse(),
            usSymbols: Array.from(us).reverse(),
            hasGold: gold
        };
    }, [assets]);

    // 2. Batch Fetch Data
    const { getStockData: getKrData, hasError: krHasError, refetch: refetchKr, isLoading: krLoading } = useBatchStockPrice(krSymbols, 'KR');
    const { getStockData: getUsData, hasError: usHasError, refetch: refetchUs, isLoading: usLoading } = useBatchStockPrice(usSymbols, 'US');

    // 2.5 Gold Spot Price (separate API)
    const [goldData, setGoldData] = useState<{ price: number; change: number; changePercent: number; time: string; sector: string; marketName: string } | null>(null);
    const [goldLoading, setGoldLoading] = useState(false);

    const fetchGoldPrice = useCallback(async () => {
        if (!hasGold) return;
        setGoldLoading(true);
        try {
            const res = await fetch('/api/kis/price/gold');
            if (res.ok) {
                const data = await res.json();
                const price = parseFloat(data.stck_prpr || '0');
                const diff = parseFloat(data.prdy_vrss || '0');
                const rate = parseFloat(data.prdy_ctrt || '0');
                if (price > 0) {
                    const now = new Date();
                    setGoldData({
                        price,
                        change: rate < 0 ? -Math.abs(diff) : Math.abs(diff),
                        changePercent: rate,
                        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (Gold)`,
                        sector: 'KRX 금현물',
                        marketName: 'KRX 금현물',
                    });
                }
            }
        } catch (e) {
            console.warn('[Gold] Price fetch failed:', e);
        } finally {
            setGoldLoading(false);
        }
    }, [hasGold]);

    useEffect(() => {
        fetchGoldPrice();
    }, [fetchGoldPrice]);

    const hasAnyError = krHasError || usHasError;
    const isRefreshing = krLoading || usLoading || goldLoading;

    const handleRefreshAll = () => {
        refetchKr();
        refetchUs();
    };

    // ---- 하한목표 자동설정 로직 ----
    const [autoTargetRunning, setAutoTargetRunning] = useState(false);
    const [autoTargetProgress, setAutoTargetProgress] = useState({ current: 0, total: 0 });
    const [autoTargetFailed, setAutoTargetFailed] = useState<{ id: number; symbol: string; name: string }[]>([]);
    const [autoTargetDone, setAutoTargetDone] = useState(false);
    const [autoTargetSuccessCount, setAutoTargetSuccessCount] = useState(0);

    const calcTargetForAsset = useCallback(async (asset: Asset): Promise<boolean> => {
        if (asset.category === 'GOLD' || asset.quantity === 0) return true; // skip
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`/api/kis/chart/daily/${asset.symbol.replace('.KS', '')}?market=${asset.category}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) return false;
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) return false;

            // 최근 45일 데이터에서 최고가 추출
            const recent45 = data.slice(0, 45);
            const maxHigh = Math.max(...recent45.map((d: any) => parseFloat(d.stck_hgpr || d.high || '0')));
            if (maxHigh <= 0) return false;

            // 하한목표 = 최고가 × 0.9 (10% 할인)
            const targetLower = Math.round(maxHigh * 0.9);
            await updateAsset(asset.id, { targetPriceLower: targetLower });
            return true;
        } catch (e) {
            console.warn(`[AutoTarget] Failed for ${asset.symbol}:`, e);
            return false;
        }
    }, [updateAsset]);

    const handleAutoTarget = useCallback(async () => {
        const eligible = assets.filter(a => a.category !== 'GOLD' && a.quantity > 0);
        if (eligible.length === 0) return;

        setAutoTargetRunning(true);
        setAutoTargetDone(false);
        setAutoTargetFailed([]);
        setAutoTargetSuccessCount(0);
        setAutoTargetProgress({ current: 0, total: eligible.length });

        const failed: typeof autoTargetFailed = [];
        let success = 0;

        for (let i = 0; i < eligible.length; i++) {
            const asset = eligible[i];
            setAutoTargetProgress({ current: i + 1, total: eligible.length });

            const ok = await calcTargetForAsset(asset);
            if (ok) {
                success++;
            } else {
                failed.push({ id: asset.id, symbol: asset.symbol, name: asset.name });
            }

            // Rate limit: 1초 대기 (마지막 항목 제외)
            if (i < eligible.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setAutoTargetFailed(failed);
        setAutoTargetSuccessCount(success);
        setAutoTargetRunning(false);
        setAutoTargetDone(true);

        // 5초 후 완료 상태 초기화
        setTimeout(() => setAutoTargetDone(false), 8000);
    }, [assets, calcTargetForAsset]);

    const handleRetryTarget = useCallback(async (asset: { id: number; symbol: string; name: string }) => {
        const fullAsset = assets.find(a => a.id === asset.id);
        if (!fullAsset) return;

        const ok = await calcTargetForAsset(fullAsset);
        if (ok) {
            setAutoTargetFailed(prev => prev.filter(f => f.id !== asset.id));
            setAutoTargetSuccessCount(prev => prev + 1);
        }
    }, [assets, calcTargetForAsset]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1E1E1E] p-3 sm:p-4 rounded-2xl border border-[#333] shadow-lg shadow-black/20">

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.kr ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                        <input type="checkbox" className="hidden" checked={filter.kr} onChange={() => setFilter(p => ({ ...p, kr: !p.kr }))} />
                        {filter.kr && <Check size={14} strokeWidth={3} />}
                        국내주식 ({counts.kr})
                    </label>
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.us ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                        <input type="checkbox" className="hidden" checked={filter.us} onChange={() => setFilter(p => ({ ...p, us: !p.us }))} />
                        {filter.us && <Check size={14} strokeWidth={3} />}
                        해외주식 ({counts.us})
                    </label>
                    <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 select-none
                        ${filter.closed ? 'bg-[#333] border-gray-600 text-gray-200' : 'bg-[#121212] border-[#333] text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}>
                        <input type="checkbox" className="hidden" checked={filter.closed} onChange={() => setFilter(p => ({ ...p, closed: !p.closed }))} />
                        {filter.closed && <Check size={14} strokeWidth={3} />}
                        거래완료 ({counts.closed})
                    </label>
                </div>

                {/* Refresh & Sort & Category Filter */}
                <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                    {/* Auto Target Button */}
                    <button
                        onClick={handleAutoTarget}
                        disabled={autoTargetRunning}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all select-none bg-[#121212] border-[#333] text-[#F7D047] hover:bg-yellow-900/20 hover:border-yellow-700/40 disabled:opacity-50"
                        title="모든 종목의 하한목표를 최근 45일 최고가의 -10%로 자동 설정"
                    >
                        {autoTargetRunning ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                        <span className="hidden sm:inline">{autoTargetRunning ? `${autoTargetProgress.current}/${autoTargetProgress.total}` : '하한목표 자동설정'}</span>
                    </button>
                    {/* Global Refresh Button */}
                    <button
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all select-none ${hasAnyError
                            ? 'bg-amber-900/30 border-amber-700/40 text-amber-400 hover:bg-amber-900/50 hover:border-amber-600/50'
                            : 'bg-[#121212] border-[#333] text-gray-400 hover:bg-[#252525] hover:text-white'
                            } disabled:opacity-50`}
                        title="전체 종목 시세 새로고침"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{isRefreshing ? '갱신중...' : '전체 재계산'}</span>
                    </button>
                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium hidden sm:inline">분류</span>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none bg-[#121212] border border-[#333] text-indigo-400 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-bold hover:border-indigo-500/50 transition"
                            >
                                <option value="all" className="text-gray-300">최상위 단계 (전체해제)</option>
                                <option disabled className="text-gray-600 bg-[#1a1a1a]">────────────────</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="text-gray-300">{cat}</option>
                                ))}
                            </select>
                            <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500/50 pointer-events-none" />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium hidden sm:inline">정렬</span>
                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                                className="appearance-none bg-[#121212] border border-[#333] text-gray-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium hover:border-gray-600 transition"
                            >
                                <option value="newest">최신등록순</option>
                                <option value="value">평가금액순</option>
                                <option value="name">가나다순</option>
                            </select>
                            <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto Target Progress / Result */}
            {(autoTargetRunning || autoTargetDone) && (
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#333] shadow-lg shadow-black/20">
                    {autoTargetRunning && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-[#F7D047]">🎯 하한목표 자동설정 진행 중...</span>
                                <span className="text-xs text-gray-400">{autoTargetProgress.current} / {autoTargetProgress.total}</span>
                            </div>
                            <div className="w-full bg-[#333] rounded-full h-2">
                                <div
                                    className="bg-[#F7D047] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${autoTargetProgress.total > 0 ? (autoTargetProgress.current / autoTargetProgress.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                    {autoTargetDone && !autoTargetRunning && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-green-400" />
                                <span className="text-sm font-bold text-green-400">완료: {autoTargetSuccessCount}개 종목 설정됨</span>
                                {autoTargetFailed.length > 0 && (
                                    <span className="text-sm text-red-400">/ {autoTargetFailed.length}개 실패</span>
                                )}
                            </div>
                            {autoTargetFailed.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {autoTargetFailed.map(f => (
                                        <div key={f.id} className="flex items-center justify-between bg-red-900/10 border border-red-900/20 rounded-lg px-3 py-2">
                                            <span className="text-sm text-red-300">{f.name} ({f.symbol})</span>
                                            <button
                                                onClick={() => handleRetryTarget(f)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 text-xs font-bold transition"
                                            >
                                                <RefreshCw size={12} /> 새로고침
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

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
