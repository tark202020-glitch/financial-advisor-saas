"use client";

import { useState, useEffect } from 'react';
import { Search, X, Plus, Check } from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';

interface StockMaster {
    symbol: string;
    name: string;
    standard_code: string;
    group_code: string;
}

interface StockSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetWatchlistId?: string; // ID of the watchlist to add to
}

export default function StockSearchModal({ isOpen, onClose, targetWatchlistId }: StockSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [masterData, setMasterData] = useState<StockMaster[]>([]);
    const [results, setResults] = useState<StockMaster[]>([]);
    const [loading, setLoading] = useState(false);
    const { addItem, watchlists } = useWatchlist();

    useEffect(() => {
        if (isOpen && masterData.length === 0) {
            setLoading(true);
            fetch('/data/kospi_master.json')
                .then(res => res.json())
                .then(data => {
                    setMasterData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load master data", err);
                    setLoading(false);
                });
        }
    }, [isOpen, masterData]);

    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        // Filter: Limit to 20 results for performance
        const filtered = masterData.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.symbol.includes(term)
        ).slice(0, 20);

        setResults(filtered);
    }, [searchTerm, masterData]);

    if (!isOpen) return null;

    const handleAdd = async (stock: StockMaster) => {
        if (!targetWatchlistId) return;

        // Fetch sector info (KOSPI Sector Name)
        let sector = '';
        try {
            // Only try to fetch if it looks like a stock code (6 digits usually, fund codes differ)
            // But API handles most.
            const res = await fetch(`/api/kis/price/domestic/${stock.symbol}`);
            if (res.ok) {
                const data = await res.json();
                if (data.bstp_kor_isnm) {
                    sector = data.bstp_kor_isnm;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch sector info for", stock.symbol, e);
        }

        await addItem(targetWatchlistId, {
            symbol: stock.symbol,
            name: stock.name,
            market: 'KR', // Defaulting to KR as master data is KOSPI
            sector: sector // Save the fetched sector (or empty if not found)
        });
    };

    // Helper to check if in target list
    const isInTargetList = (symbol: string) => {
        if (!targetWatchlistId) return false;
        const list = watchlists.find(w => w.id === targetWatchlistId);
        return list?.items.some(i => i.symbol === symbol) || false;
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1E1E1E] rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[80vh] border border-[#333]">
                <div className="p-4 border-b border-[#333] flex items-center gap-3 bg-[#252525]">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="종목명 또는 종목코드 검색..."
                        className="flex-1 outline-none text-white font-medium placeholder:text-gray-500 bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-[#1E1E1E]">
                    {loading && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            마스터 데이터 로딩 중...
                        </div>
                    )}

                    {!loading && results.length === 0 && searchTerm && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            검색 결과가 없습니다.
                        </div>
                    )}

                    {!loading && results.length === 0 && !searchTerm && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            종목을 검색하여 선택한 관심목록에 추가하세요.
                        </div>
                    )}

                    <div className="space-y-1">
                        {results.map((stock) => {
                            const isAdded = isInTargetList(stock.symbol);
                            return (
                                <div key={stock.symbol} className="flex items-center justify-between p-3 hover:bg-[#252525] rounded-lg group transition-colors">
                                    <div>
                                        <div className="font-bold text-gray-200">{stock.name}</div>
                                        <div className="text-xs text-gray-500">{stock.symbol}</div>
                                    </div>
                                    <button
                                        onClick={() => !isAdded && handleAdd(stock)}
                                        disabled={isAdded}
                                        className={`p-2 rounded-full transition-all ${isAdded
                                            ? 'bg-emerald-900/30 text-emerald-400'
                                            : 'bg-[#333] text-gray-400 hover:bg-blue-900/30 hover:text-blue-400'
                                            }`}
                                    >
                                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
