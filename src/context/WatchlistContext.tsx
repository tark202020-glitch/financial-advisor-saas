"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stock, SECTOR_STOCKS } from '@/lib/mockData';

interface WatchlistContextType {
    krStocks: Stock[];
    usStocks: Stock[];
    addStock: (stock: Stock, market: 'KR' | 'US') => void;
    removeStock: (symbol: string, market: 'KR' | 'US') => void;
    isInWatchlist: (symbol: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const [krStocks, setKrStocks] = useState<Stock[]>([]);
    const [usStocks, setUsStocks] = useState<Stock[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load from LocalStorage or Fallback to partial Mock Data
    useEffect(() => {
        const savedKR = localStorage.getItem('watchlist_kr');
        const savedUS = localStorage.getItem('watchlist_us');

        if (savedKR) {
            setKrStocks(JSON.parse(savedKR));
        } else {
            // Default: Korea Major
            setKrStocks(SECTOR_STOCKS['KR Tech & Manufacturing']);
        }

        if (savedUS) {
            setUsStocks(JSON.parse(savedUS));
        } else {
            // Default: US Big Tech + US Finance
            setUsStocks([...SECTOR_STOCKS['Global Big Tech'], ...SECTOR_STOCKS['Global Finance & Consumption']]);
        }
        setLoaded(true);
    }, []);

    // Save to LocalStorage whenever changes happen
    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('watchlist_kr', JSON.stringify(krStocks));
    }, [krStocks, loaded]);

    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('watchlist_us', JSON.stringify(usStocks));
    }, [usStocks, loaded]);

    const addStock = (stock: Stock, market: 'KR' | 'US') => {
        if (market === 'KR') {
            if (krStocks.find(s => s.symbol === stock.symbol)) return;
            setKrStocks(prev => [...prev, stock]);
        } else {
            if (usStocks.find(s => s.symbol === stock.symbol)) return;
            setUsStocks(prev => [...prev, stock]);
        }
    };

    const removeStock = (symbol: string, market: 'KR' | 'US') => {
        if (market === 'KR') {
            setKrStocks(prev => prev.filter(s => s.symbol !== symbol));
        } else {
            setUsStocks(prev => prev.filter(s => s.symbol !== symbol));
        }
    };

    const isInWatchlist = (symbol: string) => {
        return krStocks.some(s => s.symbol === symbol) || usStocks.some(s => s.symbol === symbol);
    };

    return (
        <WatchlistContext.Provider value={{ krStocks, usStocks, addStock, removeStock, isInWatchlist }}>
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
