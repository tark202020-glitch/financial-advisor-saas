"use client";

import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';

interface WatchlistEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    watchlistId: string;
    currentTitle: string;
}

export default function WatchlistEditModal({ isOpen, onClose, watchlistId, currentTitle }: WatchlistEditModalProps) {
    const { updateWatchlistTitle, removeWatchlist } = useWatchlist();
    const [title, setTitle] = useState(currentTitle);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle);
            setIsDeleting(false);
        }
    }, [isOpen, currentTitle]);

    const handleSave = async () => {
        if (!title.trim() || title === currentTitle) {
            onClose();
            return;
        }
        await updateWatchlistTitle(watchlistId, title);
        onClose();
    };

    const handleDelete = async () => {
        if (!confirm(`'${currentTitle}' 그룹을 정말 삭제하시겠습니까?\n포함된 모든 종목이 함께 삭제됩니다.`)) return;

        setIsDeleting(true);
        await removeWatchlist(watchlistId);
        setIsDeleting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">그룹 설정</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">그룹 이름</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="그룹 이름을 입력하세요"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 mt-4">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash2 size={16} />
                        그룹 삭제
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
