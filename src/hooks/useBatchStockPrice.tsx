import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

interface StockData {
    price: number;
    change: number;
    changePercent: number;
    time: string;
}

export function useBatchStockPrice(symbols: string[], market: 'KR' | 'US') {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();
    const [batchData, setBatchData] = useState<Record<string, StockData>>({});
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initial Batch Fetch (REST)
    useEffect(() => {
        let isMounted = true;

        const fetchBatch = async () => {
            if (symbols.length === 0) return;
            setIsLoading(true);

            try {
                const query = symbols.join(',');
                const res = await fetch(`/api/kis/price/batch?market=${market}&symbols=${query}`);
                if (!res.ok) throw new Error("Batch fetch failed");
                const data = await res.json();

                if (isMounted && data) {
                    const formatted: Record<string, StockData> = {};

                    Object.keys(data).forEach(symbol => {
                        const item = data[symbol]; // This matches KIS response structure (stck_prpr or last)
                        if (!item) return;

                        // Parse Logic (Similar to useStockPrice)
                        // KR: stck_prpr, prdy_vrss, prdy_ctrt
                        // US: last, diff, rate (or output structure)
                        // The batch API returns the raw output from getDomesticPrice/OverseasPrice.
                        // client.ts returns 'output' object key properties directly usually? 
                        // Let's check client.ts returns. 
                        // getDomesticPrice returns KisDomStockPrice (stck_prpr...)
                        // getOverseasPrice returns KisOvStockPrice (last, diff...)

                        let price = 0, diff = 0, rate = 0;

                        if (market === 'KR') {
                            // KR Data
                            price = parseFloat(item.stck_prpr || '0');
                            diff = parseFloat(item.prdy_vrss || '0');
                            rate = parseFloat(item.prdy_ctrt || '0');
                        } else {
                            // US Data
                            price = parseFloat(item.last?.replace(/,/g, '') || item.rsym?.last || '0'); // Remove commas if any
                            diff = parseFloat(item.diff?.replace(/,/g, '') || item.rsym?.diff || '0');
                            rate = parseFloat(item.rate?.replace(/,/g, '') || item.rsym?.rate || '0');
                        }

                        // Correction: Rate sign
                        const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);

                        // Time
                        const now = new Date();
                        const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (Batch)`;

                        if (price > 0) {
                            formatted[symbol] = {
                                price,
                                change,
                                changePercent: rate,
                                time: timeDisplay
                            };
                        }
                    });

                    setBatchData(formatted);
                }
            } catch (e) {
                console.error("Batch fetch error", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchBatch();

        return () => { isMounted = false; };
    }, [JSON.stringify(symbols), market]); // React to symbol list change


    // 2. WebSocket Subscription
    useEffect(() => {
        // Subscribe to all
        symbols.forEach(symbol => subscribe(symbol, market));

        return () => {
            symbols.forEach(symbol => unsubscribe(symbol, market));
        };
    }, [JSON.stringify(symbols), market, subscribe, unsubscribe]);


    // 3. Merge Data (Realtime > Batch)
    const getStockData = (symbol: string): StockData | null => {
        // Priority 1: WebSocket
        const wsItem = lastData.get(symbol);
        if (wsItem) {
            return {
                price: wsItem.price,
                change: wsItem.change,
                changePercent: wsItem.rate,
                time: wsItem.time || 'Realtime'
            };
        }

        // Priority 2: Batch REST
        return batchData[symbol] || null;
    };

    return { getStockData, isLoading };
}
