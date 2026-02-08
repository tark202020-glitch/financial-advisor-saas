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

    // 1. Initial Batch Fetch (Sequential Blocks)
    useEffect(() => {
        let isMounted = true;

        const fetchBatch = async () => {
            if (symbols.length === 0) return;
            setIsLoading(true);

            // Split into chunks of 6 (Requested: 3 * 2 grid)
            const chunkSize = 6;
            const chunks = [];
            for (let i = 0; i < symbols.length; i += chunkSize) {
                chunks.push(symbols.slice(i, i + chunkSize));
            }

            // Helper to process one chunk with retry
            const processChunk = async (chunkSymbols: string[], attempt = 1): Promise<void> => {
                if (!isMounted) return;
                try {
                    const query = chunkSymbols.join(',');
                    // console.log(`[Batch] Fetching chunk: ${query} (Attempt ${attempt})`);

                    const res = await fetch(`/api/kis/price/batch?market=${market}&symbols=${query}`);
                    if (!res.ok) throw new Error(`Status ${res.status}`);

                    const data = await res.json();

                    if (isMounted && data) {
                        setBatchData(prev => {
                            const next = { ...prev };
                            Object.keys(data).forEach(symbol => {
                                const item = data[symbol];
                                if (!item) return;

                                let price = 0, diff = 0, rate = 0;

                                if (market === 'KR') {
                                    price = parseFloat(item.stck_prpr || '0');
                                    diff = parseFloat(item.prdy_vrss || '0');
                                    rate = parseFloat(item.prdy_ctrt || '0');
                                } else {
                                    price = parseFloat(item.last?.replace(/,/g, '') || item.rsym?.last || '0');
                                    diff = parseFloat(item.diff?.replace(/,/g, '') || item.rsym?.diff || '0');
                                    rate = parseFloat(item.rate?.replace(/,/g, '') || item.rsym?.rate || '0');
                                }

                                const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
                                const now = new Date();
                                const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (Batch)`;

                                if (price > 0) {
                                    next[symbol] = {
                                        price,
                                        change,
                                        changePercent: rate,
                                        time: timeDisplay
                                    };
                                }
                            });
                            return next;
                        });
                    }
                } catch (e) {
                    console.warn(`[Batch] Chunk failed: ${chunkSymbols.join(',')} (Attempt ${attempt})`, e);
                    if (attempt < 2) {
                        // Retry once after delay
                        await new Promise(r => setTimeout(r, 1000));
                        await processChunk(chunkSymbols, attempt + 1);
                    }
                }
            };

            // Execute chunks sequentially with small delay to avoid swamping server
            for (const chunk of chunks) {
                if (!isMounted) break;
                await processChunk(chunk);
                await new Promise(r => setTimeout(r, 300)); // 300ms delay between blocks
            }

            if (isMounted) setIsLoading(false);
        };

        fetchBatch();

        return () => { isMounted = false; };
    }, [JSON.stringify(symbols), market]);


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
