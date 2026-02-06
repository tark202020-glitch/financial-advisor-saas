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
}

export default function StockSearchModal({ isOpen, onClose }: StockSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [masterData, setMasterData] = useState<StockMaster[]>([]);
    const [results, setResults] = useState<StockMaster[]>([]);
    const [loading, setLoading] = useState(false);
    const { addStock, isInWatchlist } = useWatchlist();

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

    const handleAdd = (stock: StockMaster) => {
        // Adapt StockMaster to Stock interface
        // We might need to fetch price later, but for now we add basic info.
        // Price fetching happens in the Dashboard components (useStockPrice or SectorRowItem).
        addStock({
            symbol: stock.symbol,
            name: stock.name,
            price: 0, // Placeholder
            change: 0,
            changePercent: 0,
            sector: 'KOSPI' // Default
        }, 'KR');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="종목명 또는 종목코드 검색..."
                        className="flex-1 outline-none text-slate-800 font-medium placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading && (
                        <div className="p-4 text-center text-slate-400 text-sm">
                            마스터 데이터 로딩 중...
                        </div>
                    )}

                    {!loading && results.length === 0 && searchTerm && (
                        <div className="p-4 text-center text-slate-400 text-sm">
                            검색 결과가 없습니다.
                        </div>
                    )}

                    {!loading && results.length === 0 && !searchTerm && (
                        <div className="p-4 text-center text-slate-400 text-sm">
                            종목을 검색하여 관심목록에 추가하세요.
                        </div>
                    )}

                    <div className="space-y-1">
                        {results.map((stock) => {
                            const isAdded = isInWatchlist(stock.symbol);
                            return (
                                <div key={stock.symbol} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-800">{stock.name}</div>
                                        <div className="text-xs text-slate-400">{stock.symbol}</div>
                                    </div>
                                    <button
                                        onClick={() => !isAdded && handleAdd(stock)}
                                        disabled={isAdded}
                                        className={`p-2 rounded-full transition-all ${isAdded
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
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
