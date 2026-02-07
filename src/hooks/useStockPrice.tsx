import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

interface StockData {
    price: number;
    change: number;
    changePercent: number;
    time?: string; // Add time field
}

export function useStockPrice(symbol: string, initialPrice: number, category: string = 'KR'): StockData | null {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();

    // Pure WebSocket Mode: No REST Fallback
    useEffect(() => {
        // Subscribe based on category
        // Ensure we un-subscribe on unmount or change
        if (category === 'KR' || category === 'US') {
            subscribe(symbol, category as any);
        }

        return () => {
            if (category === 'KR' || category === 'US') {
                unsubscribe(symbol, category as any);
            }
        };
    }, [symbol, category, subscribe, unsubscribe]);

    const wsData = lastData.get(symbol);

    if (wsData) {
        return {
            price: wsData.price,
            change: wsData.change,
            changePercent: wsData.rate,
            time: wsData.time // Pass WS time
        };
    }

    return null;
}
