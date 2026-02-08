"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getMarketType } from '@/utils/market';

export interface TradeRecord {
    id: number; // DB ID is bigint
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    kospiIndex?: number;
    memo?: string;
}

export interface Asset {
    id: number; // DB ID is bigint
    symbol: string;
    name: string;
    category: 'KR' | 'US';
    quantity: number;
    pricePerShare: number;
    purchaseDate?: string;
    purchasePurpose?: string;
    purchaseIndexValue?: number;
    memo?: string;
    targetPriceLower?: number; // Maps to buy_target
    targetPriceUpper?: number; // Maps to sell_target
    trades?: TradeRecord[];
}

interface PortfolioContextType {
    assets: Asset[];
    totalInvested: number;
    isLoading: boolean;
    user: any | null;
    addAsset: (asset: Omit<Asset, 'id'>) => Promise<void>;
    removeAsset: (id: number) => Promise<void>;
    updateAsset: (id: number, updates: Partial<Asset>) => Promise<void>;
    addTradeLog: (assetId: number, trade: Omit<TradeRecord, 'id'>) => Promise<void>;
    removeTradeLog: (tradeId: number, assetId: number) => Promise<void>;
    logout: () => Promise<void>;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false); // Global Init State
    const router = useRouter();
    const supabase = createClient();

    // 1. Auth & Data Fetching
    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            if (session?.user) {
                await fetchPortfolio(session.user.id);
            } else {
                setAssets([]);
                setIsLoading(false);
            }
            // Mark initialized
            setIsInitialized(true);
        };

        initSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                if (event === 'SIGNED_IN') {
                    setIsInitialized(false);
                    await fetchPortfolio(session.user.id);
                    setIsInitialized(true);
                } else {
                    await fetchPortfolio(session.user.id);
                }
            } else {
                setAssets([]);
                setIsLoading(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchPortfolio = async (userId: string) => {
        setIsLoading(true);
        try {
            // Fetch Portfolios with Trades
            const { data: portfolios, error } = await supabase
                .from('portfolios')
                .select(`
                    *,
                    trade_logs (*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (portfolios) {
                const loadedAssets: Asset[] = portfolios.map((p: any) => {
                    if (!p.symbol) return null;
                    return {
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
                            memo: t.memo,
                        })) : []
                    };
                }).filter((a): a is Asset => a !== null);

                setAssets(loadedAssets);
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Actions
    const addAsset = async (newAsset: Omit<Asset, 'id'>) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            router.push('/login');
            return;
        }

        try {
            // 2.1 Insert Portfolio
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

            // 2.2 Insert Initial Trades if any
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

            // Update Quantity Simple Logic
            const asset = assets.find(a => a.id === assetId);
            if (asset) {
                const change = trade.type === 'BUY' ? trade.quantity : -trade.quantity;
                const newQty = Number(asset.quantity) + Number(change);
                await supabase.from('portfolios').update({ quantity: newQty }).eq('id', assetId);
            }

            await fetchPortfolio(user.id);
        } catch (e) { console.error(e) }
    };

    const removeTradeLog = async (tradeId: number, assetId: number) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trade_logs').delete().eq('id', tradeId);
            await fetchPortfolio(user.id);
        } catch (e) { console.error(e) }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const totalInvested = assets.reduce((sum, asset) => sum + (asset.pricePerShare * asset.quantity), 0);

    // Blocking Loader
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Initializing Financial Advisor...</p>
                </div>
            </div>
        );
    }

    return (
        <PortfolioContext.Provider value={{
            assets,
            totalInvested,
            isLoading,
            user,
            addAsset,
            removeAsset,
            updateAsset,
            addTradeLog,
            removeTradeLog,
            logout,
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
    return context;
};
