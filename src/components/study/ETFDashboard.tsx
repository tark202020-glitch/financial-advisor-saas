"use client";

import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, ChevronRight, TrendingUp, TrendingDown, Plus, Minus, ArrowUpDown } from 'lucide-react';

interface TrackedETF {
    symbol: string;
    name: string;
    category: string;
    is_active: boolean;
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
    change_type: string; // 'added', 'removed', 'weight_changed'
    holding_symbol: string;
    holding_name: string;
    prev_weight: number | null;
    curr_weight: number | null;
    weight_diff: number | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    ai: { label: 'AI·테크', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
    strategy: { label: '전략', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' },
    dividend: { label: '배당', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },

};

export default function ETFDashboard({ isAdmin }: { isAdmin: boolean }) {
    const [trackedETFs, setTrackedETFs] = useState<TrackedETF[]>([]);
    const [selectedETF, setSelectedETF] = useState<TrackedETF | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [changes, setChanges] = useState<Change[]>([]);
    const [allChanges, setAllChanges] = useState<Change[]>([]);
    const [loading, setLoading] = useState(true);
    const [holdingLoading, setHoldingLoading] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [snapshotDate, setSnapshotDate] = useState<string>('');

    // 추적 ETF 목록 로드
    useEffect(() => {
        fetchTrackedList();
        fetchAllChanges();
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

    const handleSelectETF = async (etf: TrackedETF) => {
        setSelectedETF(etf);
        setHoldingLoading(true);
        try {
            // 보유종목 로드
            const holdRes = await fetch(`/api/etf/holdings?symbol=${etf.symbol}`);
            if (holdRes.ok) {
                const holdData = await holdRes.json();
                setHoldings(holdData.holdings || []);
                setSnapshotDate(holdData.snapshot_date || '');
            }

            // 해당 ETF 변경 기록 로드
            const changeRes = await fetch(`/api/etf/holdings?changes=true&symbol=${etf.symbol}&limit=30`);
            if (changeRes.ok) {
                const changeData = await changeRes.json();
                setChanges(changeData.changes || []);
            }
        } catch (e) {
            console.error('Failed to load ETF details:', e);
        } finally {
            setHoldingLoading(false);
        }
    };

    // ETF 자동 선정 실행
    const handleAutoSelect = async () => {
        if (!confirm('stock_master에서 새 기준으로 ETF를 선정합니다. 기존 목록·보유종목·변경이력이 모두 삭제됩니다.')) return;
        setIsSelecting(true);
        try {
            const res = await fetch('/api/etf/select-active', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`ETF 선정 완료: 총 ${data.total}개 (AI-테크: ${data.categories.ai}, 배당: ${data.categories.dividend}, 전략: ${data.categories.strategy})`);
                fetchTrackedList();
            } else {
                alert(`선정 실패: ${data.error}`);
            }
        } catch (e) {
            alert('ETF 자동 선정 중 오류 발생');
        } finally {
            setIsSelecting(false);
        }
    };

    // 보유종목 수동 수집
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

    return (
        <div className="flex h-full bg-[#121212]">
            {/* 좌측: ETF 목록 패널 */}
            <div className="w-80 border-r border-[#333] bg-[#1E1E1E] flex flex-col h-full overflow-hidden">
                {/* 헤더 */}
                <div className="p-4 border-b border-[#333]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-[#F7D047]" />
                            <h2 className="font-bold text-sm text-gray-200">추적 ETF 목록</h2>
                            <span className="text-xs text-gray-500">({trackedETFs.length})</span>
                        </div>
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="flex gap-1 flex-wrap mb-3">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeCategory === 'all' ? 'bg-[#F7D047] text-black font-bold' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                        >
                            전체 {trackedETFs.length}
                        </button>
                        {Object.entries(CATEGORY_LABELS).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeCategory === key ? `${cfg.bg} ${cfg.color} font-bold border` : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                            >
                                {cfg.label} {categoryCount(key)}
                            </button>
                        ))}
                    </div>

                    {/* 관리 버튼 */}
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleAutoSelect}
                                disabled={isSelecting || isCollecting}
                                className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                            >
                                <RefreshCw size={12} className={isSelecting ? 'animate-spin' : ''} />
                                {isSelecting ? '선정중...' : 'ETF 선정'}
                            </button>
                            <button
                                onClick={handleCollectHoldings}
                                disabled={isSelecting || isCollecting}
                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
                            >
                                <RefreshCw size={12} className={isCollecting ? 'animate-spin' : ''} />
                                {isCollecting ? '수집중...' : '보유종목 수집'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ETF 리스트 */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <p className="text-gray-500 text-xs text-center p-4">불러오는 중...</p>
                    ) : filteredETFs.length === 0 ? (
                        <div className="text-center p-6 text-gray-500 text-xs">
                            {trackedETFs.length === 0
                                ? '추적 대상 ETF가 없습니다.\n"ETF 선정" 버튼을 눌러주세요.'
                                : '해당 카테고리에 ETF가 없습니다.'}
                        </div>
                    ) : (
                        <ul className="space-y-0.5">
                            {filteredETFs.map((etf) => {
                                const cat = CATEGORY_LABELS[etf.category] || CATEGORY_LABELS.etc;
                                return (
                                    <li key={etf.symbol}>
                                        <button
                                            onClick={() => handleSelectETF(etf)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 group
                                                ${selectedETF?.symbol === etf.symbol
                                                    ? 'bg-[#333] text-white border-l-2 border-[#F7D047]'
                                                    : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}`}
                                        >
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.color} border font-bold shrink-0`}>
                                                {cat.label}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium text-gray-200 text-[11px]">{etf.name}</div>
                                                <div className="text-[10px] text-gray-500">{etf.symbol}</div>
                                            </div>
                                            <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400 shrink-0" />
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
                        <div className="h-12 border-b border-[#333] flex items-center justify-between px-6 bg-[#1A1A1A] shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-sm text-gray-200">{selectedETF.name}</h3>
                                <span className="text-xs text-gray-500">{selectedETF.symbol}</span>
                                {snapshotDate && (
                                    <span className="text-xs text-gray-600">스냅샷: {snapshotDate}</span>
                                )}
                            </div>
                        </div>

                        {holdingLoading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                보유종목 불러오는 중...
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                            아직 수집된 보유종목이 없습니다. "보유종목 수집" 버튼을 눌러주세요.
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
                            국내 액티브 ETF의 보유종목 구성 변화를 매일 추적합니다.
                            좌측에서 ETF를 선택하여 상세 보유종목과 변경 이력을 확인하세요.
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
                                <BarChart3 size={48} className="text-[#333] mx-auto mb-4" />
                                <p className="text-gray-500 text-sm mb-2">추적 대상 ETF가 없습니다</p>
                                {isAdmin && (
                                    <p className="text-gray-600 text-xs">좌측 "ETF 선정" 버튼으로 액티브 ETF를 자동 선정하세요.</p>
                                )}
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
