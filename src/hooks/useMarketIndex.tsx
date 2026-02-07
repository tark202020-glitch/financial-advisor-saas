import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';

interface IndexData {
    value: number;
    change: number;
    changePercent: number;
    date?: string;
    time?: string;
    isDelay?: boolean;
}

export function useMarketIndex(symbol: string, initialValue: number, category: 'KR' | 'US' = 'KR') {
    const { subscribe, unsubscribe, lastData } = useWebSocketContext();

    // ... (comments omitted)

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
                    url = `/api/kis/index/overseas/${symbol}`;
                }

                const res = await fetch(url);
                if (!res.ok) return;

                const json = await res.json();

                if (category === 'KR') {
                    const newValue = parseFloat(json.bstp_nmix_prpr);
                    const newChange = parseFloat(json.bstp_nmix_prdy_vrss);
                    const newRate = parseFloat(json.bstp_nmix_prdy_ctrt);

                    // Domestic API (inquire-daily-indexchartprice) returns output1 (snapshot) which lacks time usually?
                    // Or we check if client.ts adds it. client.ts returns data.output1.
                    // types.ts says KisDomIndexPrice has only price fields.
                    // We might not have date/time for Domestic Index here easily unless we fetch RealTime or check output2.
                    // For now, keep Domestic as is.

                    if (!isNaN(newValue)) {
                        setData({
                            value: newValue,
                            change: newChange,
                            changePercent: newRate
                        });
                    }
                } else if (category === 'US') {
                    // Mapped to KisOvStockPrice-like structure (last, diff, rate, date, time, isDelay)
                    const newValue = parseFloat(json.last);
                    const newChange = parseFloat(json.diff);
                    const newRate = parseFloat(json.rate);

                    if (!isNaN(newValue)) {
                        setData({
                            value: newValue,
                            change: newChange,
                            changePercent: newRate,
                            date: json.date,
                            time: json.time,
                            isDelay: json.isDelay
                        });
                    }
                }
            } catch (e) {
                // console.error("Index fetch error", e);
                console.log(`[Index] Failed to fetch ${symbol} (${category})`, e);
            }
        };

        fetchIndex();
        const interval = setInterval(fetchIndex, 10000);
        return () => clearInterval(interval);
    }, [symbol, category]);

    return data;
}
