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
    const [restData, setRestData] = useState<StockData | null>(null);

    const shouldSkip = options?.skip;

    // REST Fallback (using Batch API to avoid rate limits)
    useEffect(() => {
        let isMounted = true;

        const fetchFallback = async () => {
            // Throttling to prevent rate limits
            await new Promise(r => setTimeout(r, Math.random() * 2000));
            if (!isMounted) return;

            // Stop fetching if we already have WS data (Realtime took over)
            if (lastData.get(symbol)) return;

            try {
                let endpoint: string;
                let market: string;
                if (category === 'GOLD') {
                    endpoint = '/api/kis/price/gold';
                    market = 'GOLD';
                } else if (category === 'KR') {
                    const cleanSymbol = symbol.replace('.KS', '');
                    endpoint = `/api/kis/price/batch?market=KR&symbols=${cleanSymbol}`;
                    market = 'KR';
                } else {
                    endpoint = `/api/kis/price/batch?market=US&symbols=${symbol}`;
                    market = 'US';
                }

                const res = await fetch(endpoint);
                if (!res.ok) return; // Silent fail
                const data = await res.json();

                if (isMounted) {
                    if (category === 'GOLD') {
                        // Gold uses direct response format
                        const price = parseFloat(data.stck_prpr || '0');
                        const diff = parseFloat(data.prdy_vrss || '0');
                        const rate = parseFloat(data.prdy_ctrt || '0');
                        const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
                        const now = new Date();
                        const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (REST)`;
                        if (price > 0) {
                            setRestData({ price, change, changePercent: rate, time: timeDisplay });
                        }
                    } else {
                        // Batch response: data[symbol] = { ... }
                        const cleanSymbol = symbol.replace('.KS', '');
                        const item = data[cleanSymbol] || data[symbol];
                        if (!item) return;

                        let price = 0, diff = 0, rate = 0;
                        if (market === 'KR') {
                            price = parseFloat(item.stck_prpr || '0');
                            diff = parseFloat(item.prdy_vrss || '0');
                            rate = parseFloat(item.prdy_ctrt || '0');
                        } else {
                            price = parseFloat(item.last?.replace(/,/g, '') || '0');
                            diff = parseFloat(item.diff?.replace(/,/g, '') || '0');
                            rate = parseFloat(item.rate?.replace(/,/g, '') || '0');
                        }

                        const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
                        const now = new Date();
                        const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (REST)`;

                        if (price > 0) {
                            setRestData({ price, change, changePercent: rate, time: timeDisplay });
                        }
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        };

        // Trigger Fallback if no WS data immediate
        if (!shouldSkip && !lastData.get(symbol)) {
            fetchFallback();
        }

        return () => { isMounted = false; };
    }, [symbol, category, lastData, shouldSkip]);


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
