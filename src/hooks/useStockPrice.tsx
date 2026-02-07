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
    const [restData, setRestData] = useState<StockData | null>(null);

    // REST Fallback (Critical for Vercel where WSS might be blocked)
    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;

        const fetchFallback = async () => {
            // Throttling to prevent rate limits
            await new Promise(r => setTimeout(r, Math.random() * 2000));
            if (!isMounted) return;

            // Stop fetching if we already have WS data (Realtime took over)
            if (lastData.get(symbol)) return;

            try {
                const endpoint = category === 'KR'
                    ? `/api/kis/price/domestic/${symbol}`
                    : `/api/kis/price/overseas/${symbol}`;

                const res = await fetch(endpoint);
                if (!res.ok) return; // Silent fail
                const data = await res.json();

                // Format Data (Reuse logic)
                const isValidKR = data.stck_prpr && parseInt(data.stck_prpr) > 0;
                const isValidUS = data.last && parseFloat(data.last) > 0;

                if (isMounted && (isValidUS || isValidKR || data.output?.stck_prpr)) {
                    const rawPrice = data.last || data.stck_prpr || data.output?.stck_prpr || '0';
                    const price = parseFloat(rawPrice);

                    const rawDiff = data.diff || data.prdy_vrss || data.output?.prdy_vrss || '0';
                    const diff = parseFloat(rawDiff);

                    const rawRate = data.rate || data.prdy_ctrt || data.output?.prdy_ctrt || '0';
                    const changePercent = parseFloat(rawRate);
                    const change = changePercent < 0 ? -Math.abs(diff) : Math.abs(diff);

                    // Timestamp
                    const now = new Date();
                    const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (REST)`;

                    if (price > 0) {
                        setRestData({ price, change, changePercent, time: timeDisplay });
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        };

        // Trigger Fallback if no WS data immediate
        if (!lastData.get(symbol)) {
            fetchFallback();
        }

        return () => { isMounted = false; };
    }, [symbol, category, lastData]);


    // WebSocket Subscription
    useEffect(() => {
        if (category === 'KR' || category === 'US') {
            subscribe(symbol, category as any);
        }
        return () => {
            if (category === 'KR' || category === 'US') {
                unsubscribe(symbol, category as any);
            }
        };
    }, [symbol, category, subscribe, unsubscribe]);

    // Priority: WebSocket -> REST -> Null
    const wsData = lastData.get(symbol);
    if (wsData) {
        return {
            price: wsData.price,
            change: wsData.change,
            changePercent: wsData.rate,
            time: wsData.time
        };
    }

    return restData;
}
