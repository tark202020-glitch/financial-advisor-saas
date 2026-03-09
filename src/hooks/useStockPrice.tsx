import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

interface StockData {
    price: number;
    change: number;
    changePercent: number;
    time?: string; // Add time field
}

export function useStockPrice(symbol: string, initialPrice: number, category: string = 'KR', options?: { skip?: boolean }): StockData | null {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();

    const shouldSkip = options?.skip;

    // REST 폴백 제거: PortfolioContext가 배치로 모든 가격을 가져오므로 불필요
    // 이 훅은 WebSocket 실시간 데이터 전용

    // WebSocket Subscription
    useEffect(() => {
        if (shouldSkip) return;

        if (category === 'KR' || category === 'US') {
            subscribe(symbol, category as any);
        }
        return () => {
            if (category === 'KR' || category === 'US') {
                unsubscribe(symbol, category as any);
            }
        };
    }, [symbol, category, subscribe, unsubscribe, shouldSkip]);

    // Priority: WebSocket -> Null (batch data is handled by PortfolioContext)
    const wsData = lastData.get(symbol);
    if (wsData) {
        return {
            price: wsData.price,
            change: wsData.change,
            changePercent: wsData.rate,
            time: wsData.time
        };
    }

    return null;
}
