'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { createClient } from '@/utils/supabase/client';
import { Edit3, Trash2, Search, X, Save } from 'lucide-react';

interface Memo {
    id: string;
    title: string;
    content: string;
    page_path: string;
    page_name: string;
    created_at: string;
    updated_at: string;
}

export default function MemoPage() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        loadMemos();
    }, []);

    const getAuthToken = async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    };

    const loadMemos = async () => {
        setIsLoading(true);
        try {
            const token = await getAuthToken();
            const res = await fetch('/api/memos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMemos(data);
            }
        } catch (e) {
            console.error('Failed to load memos:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 메모를 삭제하시겠습니까?')) return;
        try {
            const token = await getAuthToken();
            const res = await fetch(`/api/memos?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMemos(prev => prev.filter(m => m.id !== id));
            }
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const startEdit = (memo: Memo) => {
        setEditingId(memo.id);
        setEditTitle(memo.title);
        setEditContent(memo.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const token = await getAuthToken();
            const res = await fetch('/api/memos', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: editingId, title: editTitle, content: editContent })
            });
            if (res.ok) {
                const updated = await res.json();
                setMemos(prev => prev.map(m => m.id === editingId ? updated : m));
                cancelEdit();
            }
        } catch (e) {
            console.error('Update error:', e);
        }
    };

    // Group memos by date
    const filteredMemos = memos.filter(m => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.page_name.toLowerCase().includes(q);
    });

    const groupedMemos: Record<string, Memo[]> = {};
    filteredMemos.forEach(memo => {
        const dateKey = new Date(memo.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        });
        if (!groupedMemos[dateKey]) groupedMemos[dateKey] = [];
        groupedMemos[dateKey].push(memo);
    });

    return (
        <SidebarLayout>
            <div className="p-8 pb-32 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">📝 주식일지 메모</h1>
                    <p className="text-slate-500">투자 관련 메모를 날짜별로 관리합니다.</p>
                </header>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="메모 검색 (제목, 내용, 페이지명)..."
                        className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-1 shadow-sm">
                        <p className="text-xs text-slate-400">전체 메모</p>
                        <p className="text-2xl font-bold text-slate-800">{memos.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-1 shadow-sm">
                        <p className="text-xs text-slate-400">검색 결과</p>
                        <p className="text-2xl font-bold text-indigo-600">{filteredMemos.length}</p>
                    </div>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-500 text-sm">메모를 불러오는 중...</p>
                    </div>
                ) : filteredMemos.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-slate-500 text-sm">
                            {searchQuery ? '검색 결과가 없습니다.' : '저장된 메모가 없습니다. 우측 하단의 메모 버튼으로 새 메모를 작성해보세요!'}
                        </p>
                    </div>
                ) : (
                    /* Memo List grouped by date */
                    Object.entries(groupedMemos).map(([dateKey, dateMemos]) => (
                        <div key={dateKey} className="space-y-3">
                            {/* Date Header */}
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                                    {dateKey}
                                </div>
                                <div className="flex-1 h-px bg-slate-200"></div>
                                <span className="text-xs text-slate-400">{dateMemos.length}건</span>
                            </div>

                            {/* Memo Cards */}
                            {dateMemos.map(memo => (
                                <div key={memo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                    {editingId === memo.id ? (
                                        /* Edit Mode */
                                        <div className="p-4 space-y-3">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="제목"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full h-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={cancelEdit} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">취소</button>
                                                <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                                    <Save size={12} /> 저장
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {memo.title && (
                                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{memo.title}</h4>
                                                    )}
                                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{memo.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => startEdit(memo)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="수정"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(memo.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Meta */}
                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-50">
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(memo.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {memo.page_name && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{memo.page_name}</span>
                                                )}
                                                {memo.updated_at !== memo.created_at && (
                                                    <span className="text-[10px] text-slate-300">수정됨</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </SidebarLayout>
    );
}
