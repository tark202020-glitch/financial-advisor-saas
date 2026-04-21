"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    BarChart3, RefreshCw, ChevronRight, TrendingUp, TrendingDown,
    Plus, Minus, ArrowUpDown, Search, X, Trash2, Edit3, Check,
    Star, AlertCircle
} from 'lucide-react';
import { useStockPrice } from '@/hooks/useStockPrice';
import { formatCurrency } from '@/utils/format';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
} from 'recharts';

interface TrackedETF {
    symbol: string;
    name: string;
    category: string;
    market: string;
    memo: string;
    is_active: boolean;
    dividend_yield?: number;
    dividend_history?: Array<{
        record_date: string;
        pay_date: string;
        amount: number;
    }>;
}

interface Holding {
    holding_symbol: string;
    holding_name: string;
    weight_pct: number;
    snapshot_date: string;
}

interface Change {
    id: number;
    etf_symbol: string;
    etf_name: string;
    change_date: string;
    change_type: string;
    holding_symbol: string;
    holding_name: string;
    prev_weight: number | null;
    curr_weight: number | null;
    weight_diff: number | null;
}

interface SearchResult {
    symbol: string;
    name: string;
    market: 'KR' | 'US' | 'GOLD';
    flag: string;
    exchange?: string;
}

interface CandleData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    ma5?: number;
    ma20?: number;
    ma60?: number;
    ma120?: number;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    ai: { label: 'AI', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
    dividend: { label: '배당', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },
    energy: { label: '에너지', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800' },
    index: { label: '지수', color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-800' },
    custom: { label: '기타', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800' },
};

export default function ETFDashboard({ isAdmin }: { isAdmin: boolean }) {
    const [trackedETFs, setTrackedETFs] = useState<TrackedETF[]>([]);
    const [selectedETF, setSelectedETF] = useState<TrackedETF | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [changes, setChanges] = useState<Change[]>([]);
    const [allChanges, setAllChanges] = useState<Change[]>([]);
    const [loading, setLoading] = useState(true);
    const [holdingLoading, setHoldingLoading] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [snapshotDate, setSnapshotDate] = useState<string>('');

    // 검색 관련 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // 메모 편집 상태
    const [editingMemo, setEditingMemo] = useState(false);
    const [memoText, setMemoText] = useState('');

    // 삭제 확인 상태
    const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

    // 차트 상태
    const [chartData, setChartData] = useState<CandleData[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    // 실시간 가격
    const stockLive = useStockPrice(selectedETF?.symbol || '', 0, selectedETF?.market || 'KR');

    // 추적 ETF 목록 로드
    useEffect(() => {
        fetchTrackedList();
        fetchAllChanges();
    }, []);

    // 검색 영역 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTrackedList = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/etf/select-active');
            if (res.ok) {
                const data = await res.json();
                setTrackedETFs(data.tracked || []);
            }
        } catch (e) {
            console.error('Failed to load tracked ETFs:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllChanges = async () => {
        try {
            const res = await fetch('/api/etf/holdings?changes=true&limit=50');
            if (res.ok) {
                const data = await res.json();
                setAllChanges(data.changes || []);
            }
        } catch (e) {
            console.error('Failed to load changes:', e);
        }
    };

    // ────────────── 종목 검색 ──────────────
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.trim().length < 1) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search/stock?q=${encodeURIComponent(value.trim())}&limit=10`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data || []);
                    setShowSearchDropdown(true);
                }
            } catch (e) {
                console.error('Search failed:', e);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    // ────────────── 종목 추가 ──────────────
    const handleAddStock = async (stock: SearchResult) => {
        setAddingSymbol(stock.symbol);
        try {
            const res = await fetch('/api/etf/select-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    market: stock.market,
                    category: 'custom',
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchTrackedList();
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchDropdown(false);
            } else {
                alert(data.error || '추가 실패');
            }
        } catch (e) {
            alert('종목 추가 중 오류 발생');
        } finally {
            setAddingSymbol(null);
        }
    };

    // ────────────── 종목 삭제 ──────────────
    const handleDeleteStock = async (symbol: string) => {
        try {
            const res = await fetch('/api/etf/select-active', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol }),
            });
            const data = await res.json();
            if (data.success) {
                if (selectedETF?.symbol === symbol) {
                    setSelectedETF(null);
                    setHoldings([]);
                    setChanges([]);
                }
                await fetchTrackedList();
            } else {
                alert(data.error || '삭제 실패');
            }
        } catch (e) {
            alert('종목 삭제 중 오류 발생');
        } finally {
            setDeletingSymbol(null);
        }
    };

    // ────────────── 메모 저장 ──────────────
    const handleSaveMemo = async () => {
        if (!selectedETF) return;
        try {
            const res = await fetch('/api/etf/select-active', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: selectedETF.symbol, memo: memoText }),
            });
            const data = await res.json();
            if (data.success) {
                setEditingMemo(false);
                setSelectedETF(prev => prev ? { ...prev, memo: memoText } : null);
                // 목록도 갱신
                setTrackedETFs(prev =>
                    prev.map(etf => etf.symbol === selectedETF.symbol ? { ...etf, memo: memoText } : etf)
                );
            }
        } catch (e) {
            alert('메모 저장 실패');
        }
    };

    // ────────────── 카테고리 수정 ──────────────
    const handleCategoryChange = async (newCategory: string) => {
        if (!selectedETF) return;
        try {
            const res = await fetch('/api/etf/select-active', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: selectedETF.symbol, category: newCategory }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedETF(prev => prev ? { ...prev, category: newCategory } : null);
                setTrackedETFs(prev =>
                    prev.map(etf => etf.symbol === selectedETF.symbol ? { ...etf, category: newCategory } : etf)
                );
            } else {
                alert('카테고리 수정 실패: ' + data.error);
            }
        } catch (e) {
            alert('카테고리 수정 중 오류 발생');
        }
    };

    // ────────────── ETF 상세 조회 ──────────────
    const handleSelectETF = async (etf: TrackedETF) => {
        setSelectedETF(etf);
        setHoldingLoading(true);
        setChartLoading(true);
        setEditingMemo(false);
        setMemoText(etf.memo || '');
        try {
            const holdRes = await fetch(`/api/etf/holdings?symbol=${etf.symbol}`);
            if (holdRes.ok) {
                const holdData = await holdRes.json();
                setHoldings(holdData.holdings || []);
                setSnapshotDate(holdData.snapshot_date || '');
            }

            const changeRes = await fetch(`/api/etf/holdings?changes=true&symbol=${etf.symbol}&limit=30`);
            if (changeRes.ok) {
                const changeData = await changeRes.json();
                setChanges(changeData.changes || []);
            }

            // 차트 데이터 수집
            const chartRes = await fetch(`/api/kis/chart/daily/${etf.symbol}?market=${etf.market || 'KR'}`);
            if (chartRes.ok) {
                const data = await chartRes.json();
                if (Array.isArray(data) && data.length > 0) {
                    const sorted = [...data].reverse().map(d => ({
                        date: d.stck_bsop_date,
                        open: parseFloat(d.stck_oprc),
                        high: parseFloat(d.stck_hgpr),
                        low: parseFloat(d.stck_lwpr),
                        close: parseFloat(d.stck_clpr),
                        volume: parseInt(d.acml_vol),
                    }));
                    const withMA = sorted.map((d, i) => {
                        const getSlice = (w: number) => i >= w - 1 ? sorted.slice(i - w + 1, i + 1) : [];
                        const avg = (arr: any[]) => arr.length ? arr.reduce((a, b) => a + b.close, 0) / arr.length : undefined;
                        return {
                            ...d,
                            ma5: avg(getSlice(5)),
                            ma20: avg(getSlice(20)),
                            ma60: avg(getSlice(60)),
                            ma120: avg(getSlice(120)),
                        };
                    });
                    setChartData(withMA);
                } else {
                    setChartData([]);
                }
            } else {
                setChartData([]);
            }
        } catch (e) {
            console.error('Failed to load ETF details:', e);
        } finally {
            setHoldingLoading(false);
            setChartLoading(false);
        }
    };

    // 보유종목 수동 수집 (admin 전용)
    const handleCollectHoldings = async () => {
        if (!confirm('추적 대상 전체 ETF의 보유종목을 수집합니다. 시간이 걸릴 수 있습니다.')) return;
        setIsCollecting(true);
        try {
            const res = await fetch('/api/cron/update-etf-holdings');
            const data = await res.json();
            if (data.success) {
                alert(`수집 완료: ${data.processed}개 처리, ${data.total_holdings}개 보유종목, ${data.total_changes}개 변경 감지`);
                fetchAllChanges();
                if (selectedETF) handleSelectETF(selectedETF);
            } else {
                alert(`수집 실패: ${data.error}`);
            }
        } catch (e) {
            alert('보유종목 수집 중 오류 발생');
        } finally {
            setIsCollecting(false);
        }
    };

    // 카테고리 필터링
    const filteredETFs = activeCategory === 'all'
        ? trackedETFs
        : trackedETFs.filter(e => e.category === activeCategory);

    const categoryCount = (cat: string) => trackedETFs.filter(e => e.category === cat).length;

    // 이미 추가된 종목인지 확인
    const isAlreadyTracked = (symbol: string) =>
        trackedETFs.some(etf => etf.symbol === symbol);

    return (
        <div className="flex h-full bg-[#121212]">
            {/* 좌측: 종목 목록 패널 */}
            <div className="w-80 border-r border-[#333] bg-[#1E1E1E] flex flex-col h-full overflow-hidden">
                {/* 헤더 */}
                <div className="p-4 border-b border-[#333]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-[#F7D047]" />
                            <h2 className="font-bold text-sm text-gray-200">추적 종목 목록</h2>
                            <span className="text-xs text-gray-500">({trackedETFs.length})</span>
                        </div>
                    </div>

                    {/* 🔍 종목 검색 */}
                    <div ref={searchRef} className="relative mb-3">
                        <div className="flex items-center bg-[#2A2A2A] border border-[#444] rounded-lg px-3 py-2 focus-within:border-[#F7D047] transition-colors">
                            <Search size={14} className="text-gray-500 shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="종목명 또는 코드 검색..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => {
                                    if (searchResults.length > 0) setShowSearchDropdown(true);
                                }}
                                className="flex-1 bg-transparent text-sm text-gray-200 outline-none ml-2 placeholder-gray-600"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowSearchDropdown(false);
                                    }}
                                    className="text-gray-500 hover:text-gray-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {isSearching && (
                                <RefreshCw size={14} className="text-gray-500 animate-spin ml-1" />
                            )}
                        </div>

                        {/* 검색 결과 드롭다운 */}
                        {showSearchDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A2A2A] border border-[#444] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {searchResults.map((stock) => {
                                    const tracked = isAlreadyTracked(stock.symbol);
                                    return (
                                        <div
                                            key={stock.symbol}
                                            className={`flex items-center justify-between px-3 py-2.5 text-xs border-b border-[#333] last:border-b-0 ${
                                                tracked ? 'opacity-50' : 'hover:bg-[#333]'
                                            } transition-colors`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-sm">{stock.flag}</span>
                                                <div className="min-w-0">
                                                    <div className="text-gray-200 font-medium truncate">{stock.name}</div>
                                                    <div className="text-gray-500 text-[10px] font-mono">{stock.symbol}</div>
                                                </div>
                                            </div>
                                            {tracked ? (
                                                <span className="text-[10px] text-gray-500 bg-[#333] px-2 py-0.5 rounded shrink-0">
                                                    등록됨
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddStock(stock)}
                                                    disabled={addingSymbol === stock.symbol}
                                                    className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#F7D047] hover:text-yellow-300 bg-[#F7D047]/10 hover:bg-[#F7D047]/20 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {addingSymbol === stock.symbol ? (
                                                        <RefreshCw size={10} className="animate-spin" />
                                                    ) : (
                                                        <Plus size={10} />
                                                    )}
                                                    추가
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 검색 결과 없음 */}
                        {showSearchDropdown && searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearching && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A2A2A] border border-[#444] rounded-lg shadow-xl z-50 p-4 text-center text-xs text-gray-500">
                                검색 결과가 없습니다
                            </div>
                        )}
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="flex gap-1 flex-wrap mb-3">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeCategory === 'all' ? 'bg-[#F7D047] text-black font-bold' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                        >
                            전체 {trackedETFs.length}
                        </button>
                        {Object.entries(CATEGORY_LABELS).map(([key, cfg]) => {
                            const count = categoryCount(key);
                            if (count === 0) return null;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeCategory === key ? `${cfg.bg} ${cfg.color} font-bold border` : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                                >
                                    {cfg.label} {count}
                                </button>
                            );
                        })}
                    </div>

                    {/* 관리 버튼: 보유종목 수집 (admin 전용) */}
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCollectHoldings}
                                disabled={isCollecting}
                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                            >
                                <RefreshCw size={12} className={isCollecting ? 'animate-spin' : ''} />
                                {isCollecting ? '수집중...' : '보유종목 수집'}
                            </button>
                        </div>
                    )}
                </div>

                {/* 종목 리스트 */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <p className="text-gray-500 text-xs text-center p-4">불러오는 중...</p>
                    ) : filteredETFs.length === 0 ? (
                        <div className="text-center p-6 text-gray-500 text-xs">
                            {trackedETFs.length === 0
                                ? <div className="flex flex-col items-center gap-3">
                                    <Search size={32} className="text-[#333]" />
                                    <p>추적 종목이 없습니다.</p>
                                    <p className="text-gray-600">상단 검색으로 종목을 추가하세요.</p>
                                  </div>
                                : '해당 카테고리에 종목이 없습니다.'}
                        </div>
                    ) : (
                        <ul className="space-y-0.5">
                            {filteredETFs.map((etf) => {
                                const cat = CATEGORY_LABELS[etf.category] || CATEGORY_LABELS.custom;
                                return (
                                    <li key={etf.symbol} className="group relative">
                                        <button
                                            onClick={() => handleSelectETF(etf)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2
                                                ${selectedETF?.symbol === etf.symbol
                                                    ? 'bg-[#333] text-white border-l-2 border-[#F7D047]'
                                                    : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}`}
                                        >
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.color} border font-bold shrink-0`}>
                                                {cat.label}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium text-gray-200 text-[11px]">{etf.name}</div>
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    {etf.symbol}
                                                    {etf.memo && (
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F7D047]" title="메모 있음" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* 삭제 버튼 (hover 시 표시) */}
                                            {deletingSymbol === etf.symbol ? (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteStock(etf.symbol);
                                                        }}
                                                        className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        확인
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingSymbol(null);
                                                        }}
                                                        className="text-[10px] bg-[#444] hover:bg-[#555] text-gray-300 px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingSymbol(etf.symbol);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* 우측: 상세 패널 */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedETF ? (
                    <>
                        {/* 헤더 */}
                        <div className="border-b border-[#333] px-6 py-3 bg-[#1A1A1A] shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-sm text-gray-200">{selectedETF.name}</h3>
                                    <span className="text-xs text-gray-500 font-mono">{selectedETF.symbol}</span>
                                    <span className="text-[10px] text-gray-600">{selectedETF.market === 'US' ? '🇺🇸' : '🇰🇷'}</span>
                                    {snapshotDate && (
                                        <span className="text-xs text-gray-600">스냅샷: {snapshotDate}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedETF.category || 'custom'}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="bg-[#2A2A2A] border border-[#444] rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-[#F7D047] transition-colors cursor-pointer"
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 메모 영역 */}
                            <div className="mt-2 flex items-start gap-2">
                                {editingMemo ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={memoText}
                                            onChange={(e) => setMemoText(e.target.value)}
                                            className="flex-1 bg-[#2A2A2A] border border-[#444] rounded px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-[#F7D047] transition-colors"
                                            placeholder="메모를 입력하세요..."
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveMemo();
                                                if (e.key === 'Escape') {
                                                    setEditingMemo(false);
                                                    setMemoText(selectedETF.memo || '');
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveMemo}
                                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingMemo(false);
                                                setMemoText(selectedETF.memo || '');
                                            }}
                                            className="text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingMemo(true);
                                            setMemoText(selectedETF.memo || '');
                                        }}
                                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors group"
                                    >
                                        <Edit3 size={12} className="text-gray-600 group-hover:text-[#F7D047]" />
                                        {selectedETF.memo ? (
                                            <span className="text-gray-400">{selectedETF.memo}</span>
                                        ) : (
                                            <span className="text-gray-600 italic">메모 추가...</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {holdingLoading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                보유종목 불러오는 중...
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                
                                {/* 💰 배당 정보 영역 */}
                                {selectedETF.dividend_history && selectedETF.dividend_history.length > 0 && (
                                    <div className="bg-emerald-900/10 border border-emerald-800/50 rounded-xl p-5 shadow-inner">
                                        <h3 className="text-emerald-400 font-bold mb-3 text-lg">
                                            배분율 : 연 {selectedETF.dividend_yield}%
                                        </h3>
                                        <div className="text-xs text-gray-400 mb-2">분배내역 : 조사연도에 집행된 전체 목록 ( 분배락일 | 지급예정일 | 1주당 분배금 )</div>
                                        <div className="overflow-hidden border border-[#333] rounded-lg">
                                            <table className="w-full text-xs text-left text-gray-300">
                                                <thead className="bg-[#222] text-gray-500">
                                                    <tr>
                                                        <th className="px-3 py-2 font-medium">분배락일</th>
                                                        <th className="px-3 py-2 font-medium">지급예정일</th>
                                                        <th className="px-3 py-2 font-medium text-right">1주당 분배금</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#333]">
                                                    {selectedETF.dividend_history.map((div, i) => (
                                                        <tr key={i} className="hover:bg-[#2A2A2A] transition-colors">
                                                            <td className="px-3 py-2">{div.record_date}</td>
                                                            <td className="px-3 py-2">{div.pay_date || '-'}</td>
                                                            <td className="px-3 py-2 text-right text-emerald-400 font-semibold">{div.amount.toLocaleString()}원</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 📈 차트 및 가격 영역 */}
                                <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-5 shadow-inner">
                                    {chartLoading ? (
                                        <div className="h-[300px] flex items-center justify-center text-gray-500">
                                            <RefreshCw className="animate-spin mr-2" size={20} />
                                            차트 및 데이터 불러오는 중...
                                        </div>
                                    ) : chartData.length > 0 ? (
                                        <>
                                            {/* 가격 표시 헤더 */}
                                            <div className="mb-6">
                                                {(() => {
                                                    const currentPrice = stockLive?.price || chartData[chartData.length - 1].close;
                                                    let changePercent = stockLive?.changePercent || 0;
                                                    let changeAmount = stockLive?.change || 0;
                                                    // 실시간 데이터가 없는 경우 차트의 전일 종가와 비교
                                                    if (!stockLive?.price && chartData.length > 1) {
                                                        const prevClose = chartData[chartData.length - 2].close;
                                                        changeAmount = currentPrice - prevClose;
                                                        changePercent = (changeAmount / prevClose) * 100;
                                                    }
                                                    const isKR = selectedETF.market === 'KR' || !selectedETF.market;
                                                    const isPositive = changeAmount > 0;
                                                    const isZero = changeAmount === 0;
                                                    const colorClass = isZero ? 'text-gray-400' : (isPositive ? 'text-red-500' : 'text-blue-500');
                                                    const bgClass = isZero ? 'bg-gray-500/10' : (isPositive ? 'bg-red-500/10' : 'bg-blue-500/10');
                                                    const sign = isZero ? '' : (isPositive ? '▲' : '▼');
                                                    const signPlus = isPositive ? '+' : '';
                                                    
                                                    return (
                                                        <div className="flex items-end gap-3">
                                                            <span className={`text-3xl font-extrabold tracking-tight ${colorClass}`}>
                                                                {formatCurrency(currentPrice, isKR ? 'KRW' : 'USD')}
                                                            </span>
                                                            <span className={`px-2 py-1 mb-1 rounded-md text-sm font-bold flex items-center gap-1.5 ${colorClass} ${bgClass}`}>
                                                                {sign} {formatCurrency(Math.abs(changeAmount), isKR ? 'KRW' : 'USD')} 
                                                                ({signPlus}{changePercent.toFixed(2)}%)
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* 차트 영역 */}
                                            <div className="flex items-center gap-3 text-gray-500 text-[10px] mb-2 font-medium">
                                                <span>이동평균선</span>
                                                <div className="flex gap-2 text-[10px]">
                                                    <span style={{ color: '#f97316' }}>■ 5</span>
                                                    <span style={{ color: '#8b5cf6' }}>■ 20</span>
                                                    <span style={{ color: '#3b82f6' }}>■ 60</span>
                                                    <span style={{ color: '#22c55e' }}>■ 120</span>
                                                </div>
                                            </div>
                                            <div className="h-[200px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={chartData.slice(-60)} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="etfDetail">
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                        <XAxis dataKey="date" hide />
                                                        <YAxis
                                                            domain={['auto', 'auto']}
                                                            orientation="right"
                                                            tick={{ fontSize: 10, fill: '#666' }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                                            labelStyle={{ color: '#999' }}
                                                        />
                                                        <Line type="monotone" dataKey="ma5" stroke="#f97316" strokeWidth={1} dot={false} />
                                                        <Line type="monotone" dataKey="ma20" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                                                        <Line type="monotone" dataKey="ma60" stroke="#3b82f6" strokeWidth={1} dot={false} />
                                                        <Line type="monotone" dataKey="ma120" stroke="#22c55e" strokeWidth={1} dot={false} />
                                                        <Line type="monotone" dataKey="close" stroke="#F7D047" strokeWidth={2} dot={false} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            {/* 거래량 하단 차트 */}
                                            <div className="h-12 mt-1 border-t border-[#333] relative">
                                                <span className="absolute top-1 left-0 text-[9px] text-gray-600 font-bold z-10">거래량</span>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={chartData.slice(-60)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} syncId="etfDetail">
                                                        <Bar dataKey="volume" fill="#444" />
                                                        <YAxis orientation="right" tick={false} axisLine={false} tickLine={false} />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-[150px] flex items-center justify-center text-sm text-gray-500">
                                            차트 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>

                                {/* 보유종목 테이블 */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                                        📊 보유종목 구성
                                        <span className="text-xs text-gray-500 font-normal">({holdings.length}개)</span>
                                    </h4>
                                    {holdings.length > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1A1A1A]">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[#222]">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-gray-400 font-medium border-b border-[#333]">#</th>
                                                        <th className="px-4 py-2.5 text-gray-400 font-medium border-b border-[#333]">종목코드</th>
                                                        <th className="px-4 py-2.5 text-gray-400 font-medium border-b border-[#333]">종목명</th>
                                                        <th className="px-4 py-2.5 text-gray-400 font-medium border-b border-[#333] text-right">비중(%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {holdings.map((h, i) => (
                                                        <tr key={h.holding_symbol} className="border-b border-[#2A2A2A] hover:bg-[#252525] transition-colors">
                                                            <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                                                            <td className="px-4 py-2 text-gray-400 font-mono">{h.holding_symbol}</td>
                                                            <td className="px-4 py-2 text-gray-200 font-medium">{h.holding_name}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <div className="w-20 h-1.5 bg-[#333] rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-[#F7D047] rounded-full"
                                                                            style={{ width: `${Math.min(h.weight_pct, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[#F7D047] font-bold w-12 text-right">
                                                                        {h.weight_pct.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-xs bg-[#1A1A1A] border border-[#333] rounded-lg p-4 text-center">
                                            아직 수집된 보유종목이 없습니다. {isAdmin ? '"보유종목 수집" 버튼을 눌러주세요.' : '관리자가 보유종목을 수집하면 표시됩니다.'}
                                        </p>
                                    )}
                                </div>

                                {/* 변경 이력 */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                                        🔄 변경 이력
                                        <span className="text-xs text-gray-500 font-normal">({changes.length}개)</span>
                                    </h4>
                                    {changes.length > 0 ? (
                                        <div className="space-y-2">
                                            {changes.map((c) => (
                                                <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs ${
                                                    c.change_type === 'added' ? 'bg-emerald-900/20 border-emerald-800/50' :
                                                    c.change_type === 'removed' ? 'bg-red-900/20 border-red-800/50' :
                                                    'bg-blue-900/20 border-blue-800/50'
                                                }`}>
                                                    {c.change_type === 'added' && <Plus size={14} className="text-emerald-400 shrink-0" />}
                                                    {c.change_type === 'removed' && <Minus size={14} className="text-red-400 shrink-0" />}
                                                    {c.change_type === 'weight_changed' && <ArrowUpDown size={14} className="text-blue-400 shrink-0" />}
                                                    <span className="text-gray-500 shrink-0">{c.change_date}</span>
                                                    <span className="text-gray-200 font-medium">{c.holding_name}</span>
                                                    <span className="text-gray-500 font-mono">{c.holding_symbol}</span>
                                                    <span className="ml-auto font-bold">
                                                        {c.change_type === 'added' && <span className="text-emerald-400">신규 편입 {c.curr_weight?.toFixed(2)}%</span>}
                                                        {c.change_type === 'removed' && <span className="text-red-400">편출 (기존 {c.prev_weight?.toFixed(2)}%)</span>}
                                                        {c.change_type === 'weight_changed' && (
                                                            <span className={(c.weight_diff || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                {c.prev_weight?.toFixed(2)}% → {c.curr_weight?.toFixed(2)}%
                                                                ({(c.weight_diff || 0) > 0 ? '+' : ''}{c.weight_diff?.toFixed(2)}%)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-xs bg-[#1A1A1A] border border-[#333] rounded-lg p-4 text-center">
                                            변경 이력이 없습니다. 2일 이상 데이터가 수집되면 변경사항이 표시됩니다.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* 전체 변경 요약 (ETF 미선택 시) */
                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-[#F7D047]" />
                            ETF 분석기
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            추적하고 싶은 종목을 검색하여 추가하세요. ETF의 보유종목 구성 변화를 매일 추적합니다.
                            <br />
                            좌측에서 종목을 선택하면 상세 보유종목과 변경 이력을 확인할 수 있습니다.
                        </p>

                        {allChanges.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-300 mb-3">📋 최근 변경 사항</h4>
                                <div className="space-y-2">
                                    {allChanges.slice(0, 20).map((c) => (
                                        <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs ${
                                            c.change_type === 'added' ? 'bg-emerald-900/20 border-emerald-800/50' :
                                            c.change_type === 'removed' ? 'bg-red-900/20 border-red-800/50' :
                                            'bg-blue-900/20 border-blue-800/50'
                                        }`}>
                                            {c.change_type === 'added' && <Plus size={14} className="text-emerald-400 shrink-0" />}
                                            {c.change_type === 'removed' && <Minus size={14} className="text-red-400 shrink-0" />}
                                            {c.change_type === 'weight_changed' && <ArrowUpDown size={14} className="text-blue-400 shrink-0" />}
                                            <span className="text-gray-500 shrink-0">{c.change_date}</span>
                                            <span className="text-gray-400 font-medium">{c.etf_name}</span>
                                            <span className="text-gray-200">{c.holding_name}</span>
                                            <span className="ml-auto font-bold">
                                                {c.change_type === 'added' && <span className="text-emerald-400">편입</span>}
                                                {c.change_type === 'removed' && <span className="text-red-400">편출</span>}
                                                {c.change_type === 'weight_changed' && (
                                                    <span className={(c.weight_diff || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                        {(c.weight_diff || 0) > 0 ? '+' : ''}{c.weight_diff?.toFixed(2)}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {allChanges.length === 0 && trackedETFs.length === 0 && (
                            <div className="text-center p-8 bg-[#1A1A1A] border border-[#333] rounded-xl">
                                <Search size={48} className="text-[#333] mx-auto mb-4" />
                                <p className="text-gray-400 text-sm mb-2">추적 종목이 없습니다</p>
                                <p className="text-gray-600 text-xs">좌측 검색 바에서 추적하고 싶은 종목/ETF를 검색하여 추가하세요.</p>
                            </div>
                        )}

                        {allChanges.length === 0 && trackedETFs.length > 0 && (
                            <div className="text-center p-8 bg-[#1A1A1A] border border-[#333] rounded-xl">
                                <p className="text-gray-500 text-sm mb-2">아직 변경 이력이 없습니다</p>
                                <p className="text-gray-600 text-xs">2일 이상 보유종목 수집이 진행되면 일일 변화가 표시됩니다.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
