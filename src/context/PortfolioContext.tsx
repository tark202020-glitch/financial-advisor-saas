"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getMarketType } from '@/utils/market';
import { signout } from '@/app/login/actions';
import FullPageLoader from '@/components/ui/FullPageLoader';

export interface TradeRecord {
    id: number;
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    kospiIndex?: number;
    memo?: string;
}

export interface Asset {
    id: number;
    symbol: string;
    name: string;
    category: 'KR' | 'US';
    quantity: number;
    pricePerShare: number;
    purchaseDate?: string;
    purchasePurpose?: string;
    purchaseIndexValue?: number;
    memo?: string;
    targetPriceLower?: number;
    targetPriceUpper?: number;
    trades?: TradeRecord[];
}

interface PortfolioContextType {
    assets: Asset[];
    totalInvested: number;
    isLoading: boolean;
    error: string | null;
    user: any | null;
    addAsset: (asset: Omit<Asset, 'id'>) => Promise<void>;
    removeAsset: (id: number) => Promise<void>;
    updateAsset: (id: number, updates: Partial<Asset>) => Promise<void>;
    addTradeLog: (assetId: number, trade: Omit<TradeRecord, 'id'>) => Promise<void>;
    removeTradeLog: (tradeId: number, assetId: number) => Promise<void>;
    logout: () => Promise<void>;
    refreshPortfolio: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children, initialUser }: { children: ReactNode; initialUser?: any | null }) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [user, setUser] = useState<any | null>(initialUser || null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState<string | null>("FinAdvisor을 시작합니다...");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Singleton Supabase client
    const supabaseRef = React.useRef<ReturnType<typeof createClient> | null>(null);
    if (!supabaseRef.current) {
        supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    // Core: Fetch portfolio data from Supabase
    const fetchPortfolio = useCallback(async (userId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: portfolios, error: queryError } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (queryError) throw queryError;

            if (portfolios) {
                const loadedAssets: Asset[] = portfolios
                    .filter((p: any) => p.symbol)
                    .map((p: any) => ({
                        id: p.id,
                        symbol: p.symbol,
                        name: p.name,
                        category: getMarketType(p.symbol),
                        quantity: p.quantity,
                        pricePerShare: p.buy_price || 0,
                        memo: p.memo,
                        targetPriceLower: p.buy_target,
                        targetPriceUpper: p.sell_target,
                        trades: []
                    }));
                setAssets(loadedAssets);
            }
        } catch (err: any) {
            console.error('Error fetching portfolio:', err);
            setError(err.message || "데이터를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Auth & Data Initialization
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            setLoadingMessage("사용자 정보를 확인하고 있습니다...");

            // If server already provided user, fetch immediately
            if (initialUser) {
                setLoadingMessage("나의 주식 목록을 불러오고 있습니다...");
                await fetchPortfolio(initialUser.id);
                if (mounted) setLoadingMessage(null);
                return;
            }

            // Otherwise check session client-side
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session?.user) {
                    setUser(session.user);
                    setLoadingMessage("나의 주식 목록을 불러오고 있습니다...");
                    await fetchPortfolio(session.user.id);
                } else if (mounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Session init failed:", err);
                if (mounted) setIsLoading(false);
            } finally {
                if (mounted) setLoadingMessage(null);
            }
        };

        init();

        // Listen for auth changes (login/logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (session?.user) {
                    setUser(session.user);
                    setLoadingMessage("로그인 정보를 동기화하고 있습니다...");
                    await fetchPortfolio(session.user.id);
                    setLoadingMessage(null);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setAssets([]);
                setLoadingMessage(null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    // CRUD: Add Asset
    const addAsset = async (newAsset: Omit<Asset, 'id'>) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            router.push('/login');
            return;
        }

        try {
            const { data: portfolioData, error: portfolioError } = await supabase
                .from('portfolios')
                .insert({
                    user_id: user.id,
                    symbol: newAsset.symbol,
                    name: newAsset.name,
                    quantity: newAsset.quantity,
                    buy_price: newAsset.pricePerShare,
                    memo: newAsset.memo,
                    buy_target: newAsset.targetPriceLower || null,
                    sell_target: newAsset.targetPriceUpper || null
                })
                .select()
                .single();

            if (portfolioError) throw portfolioError;

            if (newAsset.trades && newAsset.trades.length > 0) {
                const tradesToInsert = newAsset.trades.map(t => ({
                    portfolio_id: portfolioData.id,
                    user_id: user.id,
                    type: t.type,
                    price: t.price,
                    quantity: t.quantity,
                    trade_date: t.date,
                    memo: t.kospiIndex ? `${t.memo || ''} [KOSPI:${t.kospiIndex}]` : t.memo
                }));

                const { error: tradeError } = await supabase
                    .from('trade_logs')
                    .insert(tradesToInsert);

                if (tradeError) throw tradeError;
            }

            await fetchPortfolio(user.id);
        } catch (error: any) {
            console.error("Error adding asset:", error);
            alert(`저장 실패: ${error.message}`);
        }
    };

    // CRUD: Update Asset
    const updateAsset = async (id: number, updates: Partial<Asset>) => {
        if (!user) return;

        try {
            const dbUpdates: any = {};
            if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
            if (updates.pricePerShare !== undefined) dbUpdates.buy_price = updates.pricePerShare;
            if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
            if (updates.targetPriceLower !== undefined) dbUpdates.buy_target = updates.targetPriceLower;
            if (updates.targetPriceUpper !== undefined) dbUpdates.sell_target = updates.targetPriceUpper;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase
                    .from('portfolios')
                    .update(dbUpdates)
                    .eq('id', id);
                if (error) throw error;
            }

            await fetchPortfolio(user.id);
        } catch (error) {
            console.error("Error updating asset:", error);
        }
    };

    // CRUD: Remove Asset
    const removeAsset = async (id: number) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('portfolios').delete().eq('id', id);
            if (error) throw error;
            setAssets(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting asset:", error);
        }
    };

    // CRUD: Add Trade Log
    const addTradeLog = async (assetId: number, trade: Omit<TradeRecord, 'id'>) => {
        if (!user) return;
        try {
            await supabase.from('trade_logs').insert({
                portfolio_id: assetId,
                user_id: user.id,
                type: trade.type,
                price: trade.price,
                quantity: trade.quantity,
                trade_date: trade.date,
                memo: trade.memo
            });

            const asset = assets.find(a => a.id === assetId);
            if (asset) {
                const change = trade.type === 'BUY' ? trade.quantity : -trade.quantity;
                const newQty = Number(asset.quantity) + Number(change);
                await supabase.from('portfolios').update({ quantity: newQty }).eq('id', assetId);
            }

            await fetchPortfolio(user.id);
        } catch (e) { console.error(e); }
    };

    // CRUD: Remove Trade Log
    const removeTradeLog = async (tradeId: number, assetId: number) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trade_logs').delete().eq('id', tradeId);
            if (error) throw error;
            await fetchPortfolio(user.id);
        } catch (e) { console.error(e); }
    };

    // Auth: Logout
    const logout = async () => {
        // Optimistic UI update
        setUser(null);
        setAssets([]);

        // Call Server Action
        await signout();
    };

    // Refresh
    const refreshPortfolio = async () => {
        if (user) {
            await fetchPortfolio(user.id);
        }
    };

    const totalInvested = assets.reduce((sum, asset) => sum + (asset.pricePerShare * asset.quantity), 0);

    return (
        <PortfolioContext.Provider value={{
            assets,
            totalInvested,
            isLoading,
            error,
            user,
            addAsset,
            removeAsset,
            updateAsset,
            addTradeLog,
            removeTradeLog,
            logout,
            refreshPortfolio,
        }}>
            {loadingMessage ? <FullPageLoader message={loadingMessage} /> : children}
        </PortfolioContext.Provider>
    );
}

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
    return context;
};
