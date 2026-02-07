"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react';

export default function UserMenu() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (loading) return <div className="text-slate-400"><Loader2 className="animate-spin" size={16} /></div>;
    if (!user) return null;

    const nickname = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition text-sm font-medium text-slate-700"
            >
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon size={14} />
                </div>
                <span>{nickname}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            )}

            {/* Backdrop to close menu */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
