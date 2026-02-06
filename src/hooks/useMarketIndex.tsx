import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';

interface IndexData {
    value: number;
    change: number;
    changePercent: number;
}

export function useMarketIndex(symbol: string, initialValue: number, category: 'KR' | 'US' = 'KR') {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();

    // Note: KIS WebSocket for Index uses different TR_ID e.g., H0UPCNT0 (KOSPI Index)
    // Currently WebSocketContext Parser assumes H0STCNT0 (Stock) mapping.
    // We might need to update Parser if we want *exact* Index WebSocket support.
    // HOWEVER, for MVP Phase 4, users might be okay with Stock WebSocket working perfectly 
    // and Indices using REST (mixed) OR we check if Parser supports Index.

    // Let's implement REST fallback for Index for now to avoid breaking it,
    // OR update WebSocketContext to support Index TR_ID.
    // Index TR_ID: H0UPCNT0

    // For simplicity and stability of the "50 stock" requirement (which is the main blocker),
    // we will leave Index on REST polling for now (it's only 2-3 items, no rate limit issue).
    // AND the user specifically asked for "50 items" (Stocks) optimization.

    const [data, setData] = useState<IndexData>({
        value: initialValue,
        change: 0,
        changePercent: 0
    });

    useEffect(() => {
        // Keep REST Polling implementation for Index
        const fetchIndex = async () => {
            try {
                let url = '';
                if (category === 'KR') {
                    url = `/api/kis/index/domestic/${symbol}`;
                } else {
                    return;
                }

                const res = await fetch(url);
                if (!res.ok) return;

                const json = await res.json();

                if (category === 'KR') {
                    const newValue = parseFloat(json.bstp_nmix_prpr);
                    const newChange = parseFloat(json.bstp_nmix_prdy_vrss);
                    const newRate = parseFloat(json.bstp_nmix_prdy_ctrt);

                    if (!isNaN(newValue)) {
                        setData({
                            value: newValue,
                            change: newChange,
                            changePercent: newRate
                        });
                    }
                }
            } catch (e) {
                // console.error("Index fetch error", e);
            }
        };

        fetchIndex();
        const interval = setInterval(fetchIndex, 10000);
        return () => clearInterval(interval);
    }, [symbol, category]);

    return data;
}
