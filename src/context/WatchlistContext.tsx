"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Stock, SECTOR_STOCKS } from '@/lib/mockData';
import { User } from '@supabase/supabase-js';

// Types matching DB schema
export interface WatchlistItem {
    id: string;
    watchlist_id: string;
    symbol: string;
    market: 'KR' | 'US';
    sector?: string;
    name?: string; // Newly added
    display_order: number;
}

export interface Watchlist {
    id: string;
    title: string;
    display_order: number;
    items: WatchlistItem[];
}

interface WatchlistContextType {
    watchlists: Watchlist[];
    loading: boolean;
    refreshWatchlists: () => Promise<void>;
    addWatchlist: (title: string) => Promise<void>;
    removeWatchlist: (id: string) => Promise<void>;
    addItem: (watchlistId: string, item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'display_order'>) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    user: User | null;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // Initial load
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            if (session?.user) {
                await fetchWatchlists(session.user.id);
            } else {
                // If not logged in, maybe show mock data? 
                // Currently user requested DB. We can show empty or prompt login.
                setWatchlists([]);
                setLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
                setUser(session?.user || null);
                if (session?.user) {
                    fetchWatchlists(session.user.id);
                } else {
                    setWatchlists([]);
                }
            });

            return () => subscription.unsubscribe();
        };
        init();
    }, []);

    const fetchWatchlists = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            // Fetch watchlists
            const { data: lists, error: listError } = await supabase
                .from('watchlists')
                .select('*')
                .eq('user_id', userId)
                .order('display_order', { ascending: true });

            if (listError) throw listError;

            // Fetch items
            const { data: items, error: itemError } = await supabase
                .from('watchlist_items')
                .select('*')
                .order('display_order', { ascending: true });

            if (itemError) throw itemError;

            // Group items by watchlist
            const grouped = (lists || []).map((list: any) => ({
                ...list,
                items: (items || []).filter((item: WatchlistItem) => item.watchlist_id === list.id)
            }));

            setWatchlists(grouped);
        } catch (error) {
            console.error('Error fetching watchlists:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const refreshWatchlists = async () => {
        if (user) await fetchWatchlists(user.id);
    };

    const addWatchlist = async (title: string) => {
        if (!user) return;
        // Check limit: Max 3 custom groups? Not strictly enforced here, maybe in UI.
        // Or enforce strictly:
        if (watchlists.length >= 3) {
            alert("관심종목 그룹은 최대 3개까지 생성할 수 있습니다.");
            return;
        }

        try {
            const { error } = await supabase.from('watchlists').insert({
                user_id: user.id,
                title,
                display_order: watchlists.length
            });
            if (error) throw error;
            await refreshWatchlists();
        } catch (error) {
            console.error(error);
            alert("그룹 생성 중 오류가 발생했습니다.");
        }
    };

    const removeWatchlist = async (id: string) => {
        try {
            const { error } = await supabase.from('watchlists').delete().eq('id', id);
            if (error) throw error;
            await refreshWatchlists();
        } catch (error) {
            console.error(error);
            alert("그룹 삭제 중 오류가 발생했습니다.");
        }
    };

    const addItem = async (watchlistId: string, item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'display_order'>) => {
        try {
            // Check if already exists in this watchlist
            const currentList = watchlists.find(w => w.id === watchlistId);
            if (currentList?.items.some(i => i.symbol === item.symbol)) {
                alert("이미 해당 그룹에 존재하는 종목입니다.");
                return;
            }

            const { error } = await supabase.from('watchlist_items').insert({
                watchlist_id: watchlistId,
                symbol: item.symbol,
                market: item.market,
                name: item.name,
                sector: item.sector,
                display_order: currentList ? currentList.items.length : 0
            });

            if (error) throw error;
            await refreshWatchlists();
        } catch (error) {
            console.error(error);
            alert("종목 추가 중 오류가 발생했습니다.");
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const { error } = await supabase.from('watchlist_items').delete().eq('id', itemId);
            if (error) throw error;
            await refreshWatchlists();
        } catch (error) {
            console.error(error);
            alert("종목 삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <WatchlistContext.Provider value={{ watchlists, loading, refreshWatchlists, addWatchlist, removeWatchlist, addItem, removeItem, user }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    const context = useContext(WatchlistContext);
    if (context === undefined) {
        throw new Error('useWatchlist must be used within a WatchlistProvider');
    }
    return context;
}
