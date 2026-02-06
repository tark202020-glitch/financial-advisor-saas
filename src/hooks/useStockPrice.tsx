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

    // Initial Fetch for Fallback (especially for US)
    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;

        const fetchFallback = async () => {
            // Throttling: Random delay 0-1500ms to prevent API Rate Limit Bursts
            await new Promise(r => setTimeout(r, Math.random() * 1500));
            if (!isMounted) return;

            try {
                // Determine API endpoint based on category
                const endpoint = category === 'KR'
                    ? `/api/kis/price/domestic/${symbol}`
                    : `/api/kis/price/overseas/${symbol}`;

                // Fetch for both KR and US to ensure stability if WS is slow
                // (User requested accuracy > speed)
                const res = await fetch(endpoint);
                if (!res.ok) throw new Error("Fetch failed");
                const data = await res.json();

                // US: last, diff, rate
                // KR: stck_prpr (Price), prdy_vrss (Diff), prdy_ctrt (Rate)
                // Note: route.ts returns `output` directly for KR, so check `data.stck_prpr`.

                const isValidKR = data.stck_prpr && parseInt(data.stck_prpr) > 0;
                const isValidUS = data.last && parseFloat(data.last) > 0;

                if (isMounted && data && (isValidUS || isValidKR || data.output?.stck_prpr)) {

                    // Parse Price
                    // US: data.last
                    // KR: data.stck_prpr (or data.output.stck_prpr if wrapper exists)
                    const rawPrice = data.last || data.stck_prpr || data.output?.stck_prpr || '0';
                    let price = parseFloat(rawPrice);

                    // Parse Diff
                    const rawDiff = data.diff || data.prdy_vrss || data.output?.prdy_vrss || '0';
                    let diff = parseFloat(rawDiff);

                    // Parse Rate
                    const rawRate = data.rate || data.prdy_ctrt || data.output?.prdy_ctrt || '0';
                    const changePercent = parseFloat(rawRate);

                    // Logic to correct sign based on percentage
                    // If rate is negative, diff should be negative.
                    const change = changePercent < 0 ? -Math.abs(diff) : Math.abs(diff);

                    // Date Parsing (Try multiple common KIS keys)
                    const rawDate = data.date || data.stck_bsop_date || data.ymd || data.e_date || '';
                    const rawTime = data.time || data.stck_cntg_hour || data.t || data.e_time || '';

                    // Ensure format YYYY-MM-DD (KIS Time often HHMMSS or YYYYMMDD)
                    // If rawDate is YYYYMMDD, format it nicely.
                    let timeDisplay = '';
                    if (rawDate) {
                        if (rawDate.length === 8) {
                            timeDisplay = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
                        } else {
                            timeDisplay = rawDate;
                        }
                    }
                    if (rawTime) {
                        // If time exists (HHMMSS), append it
                        if (rawTime.length === 6) {
                            timeDisplay += ` ${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}`;
                        } else {
                            timeDisplay += ` ${rawTime}`;
                        }
                    }

                    // Fallback: If no time in data (common for REST snapshots), use current fetch time
                    // This answers "When was this info valid?" -> "Just now"
                    if (!timeDisplay.trim()) {
                        const now = new Date();
                        const mm = String(now.getMonth() + 1).padStart(2, '0');
                        const dd = String(now.getDate()).padStart(2, '0');
                        const hh = String(now.getHours()).padStart(2, '0');
                        const min = String(now.getMinutes()).padStart(2, '0');
                        timeDisplay = `${now.getFullYear()}-${mm}-${dd} ${hh}:${min}`;
                    }

                    if (price > 0) {
                        setRestData({
                            price,
                            change, // Use signed change
                            changePercent,
                            time: timeDisplay.trim()
                        });
                    }
                }
            } catch (e) {
                // Simple Retry Once
                if (retryCount < 2 && isMounted) {
                    retryCount++;
                    setTimeout(fetchFallback, 2000); // Retry after 2s
                }
            }
        };

        // Only fetch if no WS data AND no existing REST data
        if (!lastData.get(symbol) && !restData) {
            fetchFallback();
        }

        return () => { isMounted = false; };
    }, [symbol, category, lastData]);

    useEffect(() => {
        // WebSocket for KR (Domestic)
        if (category === 'KR') {
            subscribe(symbol, 'KR');
            return () => {
                unsubscribe(symbol, 'KR');
            };
        }
        // Unified WebSocket for US as well
        else if (category === 'US') {
            subscribe(symbol, 'US');
            return () => {
                unsubscribe(symbol, 'US');
            };
        }
    }, [symbol, category, subscribe, unsubscribe]);

    // Priority: WebSocket Data -> REST Data -> Null
    const wsData = lastData.get(symbol);

    if (wsData) {
        return {
            price: wsData.price,
            change: wsData.change,
            changePercent: wsData.rate,
            time: wsData.time // Pass WS time
        };
    }

    if (restData) {
        return restData;
    }

    // Return null if neither available
    return null;
}
