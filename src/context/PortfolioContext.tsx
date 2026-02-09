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
    updateTradeLog: (tradeId: number, assetId: number, updates: Partial<Omit<TradeRecord, 'id'>>) => Promise<void>;
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
                .select('*, trade_logs(*)')
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
                        trades: p.trade_logs ? p.trade_logs.map((t: any) => ({
                            id: t.id,
                            date: t.trade_date,
                            type: t.type,
                            price: t.price,
                            quantity: t.quantity,
                            kospiIndex: t.kospi_index, // Map from DB
                            memo: t.memo
                        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []
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
            // 1. Server-side User Injection (Priority)
            if (initialUser) {
                if (user?.id !== initialUser.id) {
                    setUser(initialUser);
                }

                setLoadingMessage("나의 주식일지를 불러오고 있습니다...");

                try {
                    await fetchPortfolio(initialUser.id);
                } catch (e) {
                    console.error("Init fetch failed:", e);
                } finally {
                    if (mounted) {
                        setLoadingMessage(null);
                        setIsLoading(false);
                    }
                }
                return;
            }

            // 2. Client-side Session Check (Fallback)
            setLoadingMessage("사용자 정보를 확인하고 있습니다...");
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session?.user) {
                    if (user?.id !== session.user.id) {
                        setUser(session.user);
                        setLoadingMessage("내 주식일지를 불러오고 있습니다...");
                        await fetchPortfolio(session.user.id);
                    }
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

        // Run init logic when mount or initialUser changes
        init();

        // Listen for auth changes (login/logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (!mounted) return;
            // console.log("[Auth] Event:", event);

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (session?.user && user?.id !== session.user.id) {
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
    }, [initialUser, user, fetchPortfolio, supabase]); // Re-run if server passes new user (e.g. after login redirect)

    // Helper: Recalculate Average Price & Quantity
    const recalculateAssetMetrics = async (assetId: number) => {
        try {
            const { data: trades, error } = await supabase
                .from('trade_logs')
                .select('*')
                .eq('portfolio_id', assetId)
                .order('trade_date', { ascending: true })
                .order('created_at', { ascending: true }); // Secondary sort for same day trades

            if (error || !trades) return;

            let currentQty = 0;
            let currentTotalCost = 0;

            for (const trade of trades) {
                const qty = Number(trade.quantity);
                const price = Number(trade.price);

                if (trade.type === 'BUY') {
                    currentTotalCost += price * qty;
                    currentQty += qty;
                } else if (trade.type === 'SELL') {
                    if (currentQty > 0) {
                        const avgPrice = currentTotalCost / currentQty;
                        currentTotalCost -= avgPrice * qty;
                        currentQty -= qty;
                    } else {
                        currentQty -= qty;
                    }
                }
            }

            // Prevent negative zero or precision errors
            if (currentQty <= 0) {
                currentQty = 0;
                currentTotalCost = 0;
            }

            const finalAvgPrice = currentQty > 0 ? (currentTotalCost / currentQty) : 0;

            await supabase.from('portfolios').update({
                quantity: currentQty,
                buy_price: finalAvgPrice
            }).eq('id', assetId);

        } catch (e) {
            console.error("Error recalculating metrics:", e);
        }
    };

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
                    kospi_index: t.kospiIndex,
                    memo: t.memo
                }));

                const { error: tradeError } = await supabase
                    .from('trade_logs')
                    .insert(tradesToInsert);

                if (tradeError) throw tradeError;

                // Recalculate immediately
                await recalculateAssetMetrics(portfolioData.id);
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
                kospi_index: trade.kospiIndex,
                memo: trade.memo
            });

            await recalculateAssetMetrics(assetId);
            await fetchPortfolio(user.id);
        } catch (e) { console.error(e); }
    };

    // CRUD: Update Trade Log (New)
    const updateTradeLog = async (tradeId: number, assetId: number, updates: Partial<Omit<TradeRecord, 'id'>>) => {
        if (!user) return;
        try {
            const dbUpdates: any = {};
            if (updates.date) dbUpdates.trade_date = updates.date;
            if (updates.type) dbUpdates.type = updates.type;
            if (updates.price) dbUpdates.price = updates.price;
            if (updates.quantity) dbUpdates.quantity = updates.quantity;
            if (updates.kospiIndex !== undefined) dbUpdates.kospi_index = updates.kospiIndex;
            if (updates.memo !== undefined) dbUpdates.memo = updates.memo;

            const { error } = await supabase
                .from('trade_logs')
                .update(dbUpdates)
                .eq('id', tradeId);

            if (error) throw error;

            await recalculateAssetMetrics(assetId);
            await fetchPortfolio(user.id);
        } catch (e) { console.error(e); }
    };

    // CRUD: Remove Trade Log
    const removeTradeLog = async (tradeId: number, assetId: number) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trade_logs').delete().eq('id', tradeId);
            if (error) throw error;

            await recalculateAssetMetrics(assetId);
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
            updateTradeLog,
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
