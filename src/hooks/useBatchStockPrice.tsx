import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

interface StockData {
    price: number;
    change: number;
    changePercent: number;
    time: string;
    sector?: string;
}

export function useBatchStockPrice(symbols: string[], market: 'KR' | 'US') {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();
    const [batchData, setBatchData] = useState<Record<string, StockData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
    const [fetchTrigger, setFetchTrigger] = useState(0);

    // 1. Batch Fetch (with enhanced retry)
    useEffect(() => {
        let isMounted = true;

        const fetchBatch = async () => {
            if (symbols.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setHasError(false);
            setFailedSymbols([]);

            const chunkSize = 6;
            const chunks: string[][] = [];
            for (let i = 0; i < symbols.length; i += chunkSize) {
                chunks.push(symbols.slice(i, i + chunkSize));
            }

            const allFailed: string[] = [];

            const processChunk = async (chunkSymbols: string[], attempt = 1): Promise<void> => {
                if (!isMounted) return;
                try {
                    const query = chunkSymbols.join(',');

                    // Timeout with AbortController
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);

                    const res = await fetch(`/api/kis/price/batch?market=${market}&symbols=${query}`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!res.ok) throw new Error(`Status ${res.status}`);

                    const data = await res.json();

                    if (isMounted && data) {
                        const chunkFailed: string[] = [];

                        setBatchData(prev => {
                            const next = { ...prev };
                            chunkSymbols.forEach(symbol => {
                                const item = data[symbol];
                                if (!item) {
                                    chunkFailed.push(symbol);
                                    return;
                                }

                                let price = 0, diff = 0, rate = 0;
                                let sector: string | undefined = undefined;

                                if (market === 'KR') {
                                    price = parseFloat(item.stck_prpr || '0');
                                    diff = parseFloat(item.prdy_vrss || '0');
                                    rate = parseFloat(item.prdy_ctrt || '0');
                                    sector = item.bstp_kor_isnm;
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
                                        time: timeDisplay,
                                        sector
                                    };
                                } else {
                                    chunkFailed.push(symbol);
                                }
                            });
                            return next;
                        });

                        // Track failed symbols from this chunk
                        if (chunkFailed.length > 0) {
                            allFailed.push(...chunkFailed);
                        }
                    }
                } catch (e: any) {
                    const isTimeout = e.name === 'AbortError';
                    console.warn(`[Batch] Chunk failed: ${chunkSymbols.join(',')} (Attempt ${attempt})${isTimeout ? ' [TIMEOUT]' : ''}`, e);

                    if (attempt < 3) {
                        // Exponential backoff: 1s, 2s, 4s
                        const delay = 1000 * Math.pow(2, attempt - 1);
                        await new Promise(r => setTimeout(r, delay));
                        await processChunk(chunkSymbols, attempt + 1);
                    } else {
                        // All retries exhausted - track as failed
                        allFailed.push(...chunkSymbols);
                    }
                }
            };

            // Execute chunks sequentially with delay
            for (const chunk of chunks) {
                if (!isMounted) break;
                await processChunk(chunk);
                await new Promise(r => setTimeout(r, 300));
            }

            if (isMounted) {
                setIsLoading(false);
                if (allFailed.length > 0) {
                    setHasError(true);
                    setFailedSymbols(allFailed);
                }
            }
        };

        fetchBatch();
        return () => { isMounted = false; };
    }, [JSON.stringify(symbols), market, fetchTrigger]);

    // 2. WebSocket Subscription
    useEffect(() => {
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
                time: wsItem.time || 'Realtime',
                sector: batchData[symbol]?.sector
            };
        }
        // Priority 2: Batch REST
        return batchData[symbol] || null;
    };

    // 4. Refetch functions
    const refetch = useCallback(() => {
        setFetchTrigger(prev => prev + 1);
    }, []);

    const refetchSymbol = useCallback(async (symbol: string) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`/api/kis/price/batch?market=${market}&symbols=${symbol}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) return;
            const data = await res.json();
            const item = data[symbol];
            if (!item) return;

            let price = 0, diff = 0, rate = 0;
            let sector: string | undefined = undefined;

            if (market === 'KR') {
                price = parseFloat(item.stck_prpr || '0');
                diff = parseFloat(item.prdy_vrss || '0');
                rate = parseFloat(item.prdy_ctrt || '0');
                sector = item.bstp_kor_isnm;
            } else {
                price = parseFloat(item.last?.replace(/,/g, '') || '0');
                diff = parseFloat(item.diff?.replace(/,/g, '') || '0');
                rate = parseFloat(item.rate?.replace(/,/g, '') || '0');
            }

            if (price > 0) {
                const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
                const now = new Date();
                const timeDisplay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (Retry)`;

                setBatchData(prev => ({
                    ...prev,
                    [symbol]: { price, change, changePercent: rate, time: timeDisplay, sector }
                }));

                // Remove from failed list
                setFailedSymbols(prev => prev.filter(s => s !== symbol));
                if (failedSymbols.length <= 1) setHasError(false);
            }
        } catch (e) {
            console.warn(`[Batch] Single retry failed: ${symbol}`, e);
        }
    }, [market, failedSymbols]);

    return { getStockData, isLoading, hasError, failedSymbols, refetch, refetchSymbol };
}
