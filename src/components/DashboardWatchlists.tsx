"use client";

import SectorWatchList from '@/components/SectorWatchList';
import StockSearchModal from '@/components/modals/StockSearchModal';
import { SECTOR_STOCKS, Stock } from '@/lib/mockData';
import { useState } from 'react';
import { useWatchlist, Watchlist } from '@/context/WatchlistContext';
import WatchlistEditModal from './modals/WatchlistEditModal';
import { Plus, Pencil } from 'lucide-react';

export default function DashboardWatchlists() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [targetWatchlistId, setTargetWatchlistId] = useState<string | undefined>(undefined);
    const { watchlists, addWatchlist, removeWatchlist, updateWatchlistTitle, removeItem, user } = useWatchlist();
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [isAddingGroup, setIsAddingGroup] = useState(false);

    // Edit Modal State
    const [editModal, setEditModal] = useState<{ isOpen: boolean; id: string; title: string }>({
        isOpen: false,
        id: '',
        title: ''
    });

    const handleOpenSearch = (watchlistId?: string) => {
        setTargetWatchlistId(watchlistId);
        setIsSearchOpen(true);
    };

    const handleAddGroup = async () => {
        if (!newGroupTitle.trim()) return;
        await addWatchlist(newGroupTitle);
        setNewGroupTitle('');
        setIsAddingGroup(false);
    };

    // Helper to convert WatchlistItem items to Stock[] for SectorWatchList
    const getStocksFromList = (list: Watchlist): Stock[] => {
        return list.items.map(item => ({
            id: item.id, // Add id for deletion
            symbol: item.symbol,
            name: item.name || item.symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            sector: item.sector,
            market: item.market
        }));
    };

    return (
        <>
            {/* Adjusted Grid: 1 col mobile, 2 col tablet/laptop, 3 col large desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Row 1: Global */}
                <SectorWatchList
                    title="🇺🇸 미국 빅테크 (Big Tech)"
                    stocks={SECTOR_STOCKS['Global Big Tech']}
                    // Static lists don't support adding in this requirement context
                    onAddClick={undefined}
                />
                <SectorWatchList
                    title="🇺🇸 미국 금융 & 소비"
                    stocks={SECTOR_STOCKS['Global Finance & Consumption']}
                    onAddClick={undefined}
                />
                <SectorWatchList
                    title="🇺🇸 미국 반도체"
                    stocks={SECTOR_STOCKS['Global Semiconductor']}
                    onAddClick={undefined}
                />

                {/* Row 2: Korea */}
                <SectorWatchList
                    title="🇰🇷 한국 기술 & 제조"
                    stocks={SECTOR_STOCKS['KR Tech & Manufacturing']}
                    onAddClick={undefined}
                />
                <SectorWatchList
                    title="🇰🇷 한국 산업 & 인프라"
                    stocks={SECTOR_STOCKS['KR Industrial & Infra']}
                    onAddClick={undefined}
                />
                <SectorWatchList
                    title="🇰🇷 한국 금융 & 지수"
                    stocks={SECTOR_STOCKS['KR Finance & Index']}
                    onAddClick={undefined}
                />

                {/* Row 3: Custom Watchlists (DB) */}
                {watchlists.map((list) => (
                    <div key={list.id} className="relative group">
                        <SectorWatchList
                            title={list.title}
                            stocks={getStocksFromList(list)}
                            onAddClick={() => handleOpenSearch(list.id)}
                            onRemoveItem={removeItem}
                        />
                        {/* Edit Group Button (Visible on hover) */}
                        <button
                            onClick={() => setEditModal({ isOpen: true, id: list.id, title: list.title })}
                            className="absolute top-4 right-12 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="그룹 설정"
                        >
                            <Pencil size={16} />
                        </button>
                    </div>
                ))}

                {/* Add Group Block */}
                {/* Add Group Block */}
                {watchlists.length < 3 && (
                    <div className="bg-[#1E1E1E] rounded-xl border-2 border-dashed border-[#333] p-6 flex flex-col items-center justify-center min-h-[300px] hover:border-[#F7D047] hover:bg-[#F7D047]/5 transition-all group">
                        {!isAddingGroup ? (
                            <button
                                onClick={() => setIsAddingGroup(true)}
                                className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-[#F7D047] transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <span className="font-bold">관심종목 그룹 추가</span>
                            </button>
                        ) : (
                            <div className="w-full max-w-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                <h4 className="font-bold text-white text-center">새 그룹 만들기</h4>
                                <input
                                    type="text"
                                    value={newGroupTitle}
                                    onChange={(e) => setNewGroupTitle(e.target.value)}
                                    placeholder="그룹 이름 (예: 반도체, ETF)"
                                    className="w-full px-4 py-2 rounded-lg bg-[#121212] border border-[#444] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#F7D047] focus:border-transparent"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                                />
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => setIsAddingGroup(false)}
                                        className="px-4 py-2 text-sm text-gray-500 hover:bg-[#333] rounded-lg transition-colors font-bold"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleAddGroup}
                                        disabled={!newGroupTitle.trim()}
                                        className="px-4 py-2 text-sm bg-[#F7D047] text-black rounded-lg hover:bg-[#E5C040] transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                                    >
                                        생성
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <StockSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                targetWatchlistId={targetWatchlistId}
            />

            <WatchlistEditModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                watchlistId={editModal.id}
                currentTitle={editModal.title}
            />
        </>
    );
}
