'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Minus, Save, Trash2, ChevronDown } from 'lucide-react';

const PAGE_NAMES: Record<string, string> = {
    '/dashboard': '일일체크',
    '/portfolio': '내 주식일지',
    '/insights': '내 주식 인사이트',
    '/condition-search': '조건검색',
    '/memo': '주식일지메모',
};

interface MemoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize: () => void;
}

export default function MemoOverlay({ isOpen, onClose, onMinimize }: MemoOverlayProps) {
    const pathname = usePathname();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [recentMemos, setRecentMemos] = useState<any[]>([]);
    const [showRecent, setShowRecent] = useState(false);
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

    // Current date display
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][today.getDay()]})`;
    const pageName = PAGE_NAMES[pathname] || pathname;

    // Load recent memos when opening
    useEffect(() => {
        if (isOpen) {
            loadRecentMemos();
            setTimeout(() => textareaRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const loadRecentMemos = async () => {
        try {
            const res = await fetch('/api/memos');
            if (res.ok) {
                const data = await res.json();
                setRecentMemos(data.slice(0, 5));
            }
        } catch (e) {
            console.error('Failed to load memos:', e);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            if (editingMemoId) {
                const res = await fetch('/api/memos', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingMemoId, title, content })
                });
                if (!res.ok) throw new Error('Update failed');
            } else {
                const res = await fetch('/api/memos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        content,
                        page_path: pathname,
                        page_name: pageName
                    })
                });
                if (!res.ok) throw new Error('Save failed');
            }

            setSaveStatus('saved');
            setTitle('');
            setContent('');
            setEditingMemoId(null);
            loadRecentMemos();

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error('Save error:', e);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (memo: any) => {
        setEditingMemoId(memo.id);
        setTitle(memo.title || '');
        setContent(memo.content || '');
        setShowRecent(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const handleDelete = async (memoId: string) => {
        if (!confirm('이 메모를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/memos?id=${memoId}`, { method: 'DELETE' });
            if (res.ok) {
                loadRecentMemos();
                if (editingMemoId === memoId) {
                    setEditingMemoId(null);
                    setTitle('');
                    setContent('');
                }
            }
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const handleNewMemo = () => {
        setEditingMemoId(null);
        setTitle('');
        setContent('');
        setShowRecent(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[400px] max-h-[600px] bg-[#1E1E1E] rounded-2xl shadow-2xl shadow-black/50 border border-[#333] z-[9999] flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#252525] rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <div>
                        <h3 className="text-sm font-bold text-white">주식일지 메모</h3>
                        <p className="text-[10px] text-gray-400">{dateStr}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onMinimize} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <Minus size={14} />
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Page Info Bar */}
            <div className="px-4 py-2 bg-[#121212] border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded-md font-medium border border-indigo-500/20">{pageName}</span>
                    {editingMemoId && (
                        <span className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-md font-medium border border-amber-500/20">수정 중</span>
                    )}
                </div>
                <button
                    onClick={handleNewMemo}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                    + 새 메모
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col px-4 py-3 space-y-3 overflow-y-auto bg-[#1E1E1E]">
                {/* Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목 (선택사항)"
                    className="w-full px-3 py-2 bg-[#121212] border border-[#333] rounded-lg text-sm outline-none focus:border-indigo-500 text-white placeholder-gray-600 transition"
                />

                {/* Content Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="메모를 입력하세요..."
                    className="w-full h-40 px-3 py-2 bg-[#121212] border border-[#333] rounded-lg text-sm outline-none focus:border-indigo-500 text-white placeholder-gray-600 transition resize-none leading-relaxed"
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {saveStatus === 'saved' && <span className="text-emerald-400 font-medium">✅ 저장 완료!</span>}
                        {saveStatus === 'error' && <span className="text-red-400 font-medium">❌ 저장 실패</span>}
                        {saveStatus === 'idle' && content.length > 0 && <span>{content.length}자</span>}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !content.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                    >
                        <Save size={14} />
                        {isSaving ? '저장 중...' : editingMemoId ? '수정 저장' : '저장'}
                    </button>
                </div>
            </div>

            {/* Recent Memos Toggle */}
            <div className="border-t border-[#333] bg-[#1E1E1E]">
                <button
                    onClick={() => setShowRecent(!showRecent)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-400 hover:bg-[#252525] transition"
                >
                    <span>최근 메모 ({recentMemos.length})</span>
                    <ChevronDown size={14} className={`transition-transform ${showRecent ? 'rotate-180' : ''}`} />
                </button>

                {showRecent && (
                    <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-2 bg-[#1E1E1E]">
                        {recentMemos.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">저장된 메모가 없습니다.</p>
                        ) : (
                            recentMemos.map((memo) => (
                                <div
                                    key={memo.id}
                                    className={`group p-2.5 rounded-lg border transition cursor-pointer ${editingMemoId === memo.id
                                        ? 'border-indigo-500/50 bg-indigo-900/20'
                                        : 'border-[#333] hover:border-gray-600 bg-[#252525] hover:bg-[#2a2a2a]'
                                        }`}
                                    onClick={() => handleEdit(memo)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            {memo.title && (
                                                <p className="text-xs font-semibold text-gray-200 truncate">{memo.title}</p>
                                            )}
                                            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{memo.content}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(memo.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {memo.page_name && (
                                                    <span className="text-[10px] bg-[#333] text-gray-300 px-1.5 py-0.5 rounded">{memo.page_name}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(memo.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
