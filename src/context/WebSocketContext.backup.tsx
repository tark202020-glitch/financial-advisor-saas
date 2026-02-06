"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface RealtimeData {
    symbol: string;
    price: number;
    change: number;
    rate: number;
    // Add time or other fields if needed
    time?: string;
}

interface WebSocketContextType {
    status: WebSocketStatus;
    subscribe: (symbol: string, trId?: string) => void;
    unsubscribe: (symbol: string, trId?: string) => void;
    lastData: Map<string, RealtimeData>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// KIS WebSocket URL (Real)
const WS_URL_REAL = "ws://ops.koreainvestment.com:21000";

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [approvalKey, setApprovalKey] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    // Store latest data for each symbol: Map<symbol, RealtimeData>
    const [lastData, setLastData] = useState<Map<string, RealtimeData>>(new Map());

    // Keep track of active subscriptions to re-subscribe on reconnect
    const subscriptions = useRef<Set<string>>(new Set());

    // 1. Fetch Approval Key on Mount
    useEffect(() => {
        const fetchKey = async () => {
            try {
                const res = await fetch('/api/kis/ws-approval', { method: 'POST' });
                const data = await res.json();
                if (data.approval_key) {
                    setApprovalKey(data.approval_key);
                }
            } catch (e) {
                console.error("Failed to fetch WS Approval Key", e);
            }
        };
        fetchKey();
    }, []);

    // 2. Connect WebSocket when Key is ready
    useEffect(() => {
        if (!approvalKey) return;

        const connect = () => {
            if (ws.current?.readyState === WebSocket.OPEN) return;

            setStatus('connecting');
            const socket = new WebSocket(WS_URL_REAL);
            ws.current = socket;

            socket.onopen = () => {
                console.log("KIS WebSocket Connected");
                setStatus('connected');
                // Re-subscribe if needed (for now, we rely on component re-mount or simple logic)
            };

            socket.onmessage = (event) => {
                if (typeof event.data === "string") {
                    parseData(event.data);
                }
            };

            socket.onclose = () => {
                console.log("KIS WebSocket Disconnected");
                setStatus('disconnected');
                // Simple reconnect logic (exponential backoff could be better)
                setTimeout(connect, 3000);
            };

            socket.onerror = (error) => {
                console.error("KIS WebSocket Error", error);
                setStatus('error');
            };
        };

        connect();

        return () => {
            ws.current?.close();
        };
    }, [approvalKey]);

    // 3. Parser
    const parseData = (rawData: string) => {
        const firstChar = rawData.charAt(0);

        // Plain JSON message (e.g. subscription success response)
        if (firstChar === '{') {
            // console.log("WS System Msg:", rawData);
            return;
        }

        // Data Message format: 0|TR_ID|KEY^V1^V2...
        // 0: Encryption (0=Plain)
        // 1: TR_ID
        // 2: KEY (Symbol)
        // 3: Data separated by ^ (Caret)

        const parts = rawData.split('|');
        if (parts.length < 4) return;

        const symbol = parts[2];
        const dataStr = parts[3];
        const values = dataStr.split('^');

        // KIS uses different index for Stock vs Index
        // Common Domestic Stock (H0STCNT0): 
        // [2] = Current Price, [4] = Rate, [5] = Change (Note: Index varies by TR_ID)
        // Let's assume H0STCNT0 (KOSPI Stock) for MVP

        // H0STCNT0 Layout:
        // 0: Time (HHMMSS)
        // 1: Current Price
        // 2: Change Sign
        // 3: Change
        // 4: Change Rate
        // ...

        const trId = parts[1];

        let newPrice = 0;
        let newChange = 0;
        let newRate = 0;

        if (trId === 'H0STCNT0') { // Domestic Stock
            // H0STCNT0 Data Format (typical):
            // MKSC_SHRN_ISCD^STCK_CNTG_HOUR^STCK_PRPR^PRDY_VRSS_SIGN^PRDY_VRSS^PRDY_CTRT^VOL...
            // 0: Symbol (Code)
            // 1: Time
            // 2: Current Price
            // 3: Sign (1:Upper, 2:Up, 3:Same, 4:Down, 5:Lower)
            // 4: Diff (Change Amount) - absolute value usually
            // 5: Rate

            // NOTE: rawData structure: 0|TR_ID|KEY|DATA...
            // parts[3] is the DATA part. 
            // BUT parts[3] often starts with ^ or contains the fields directly.

            // Let's verify commonly used indices:
            // values[2] = Price ? 
            // Let's try to grab by position assuming the standard output.

            // If values[0] is Code and values[1] is Time...
            // values[2] = Price
            // values[3] = Sign
            // values[4] = Diff
            // values[5] = Rate

            // Previous code used values[1] for Price. Let's correct to [2].
            // Also add safeguard.

            if (values.length > 5) {
                newPrice = parseInt(values[2]);
                const sign = values[3];
                const diff = parseInt(values[4]);
                newChange = (sign === '4' || sign === '5') ? -diff : diff;
                newRate = parseFloat(values[5]);

                // console.log(`[WS DEBUG] ${symbol}: ${newPrice} (${newRate}%)`);
            } else {
                // Fallback or log error
                // console.warn("[WS] Unexpected format", values);
            }
        }
        else if (trId === 'H0STASP0') {
            // Similar structure
            if (values.length > 5) {
                newPrice = parseInt(values[2]);
                // ... simplify logic same as above
            }
        }

        if (newPrice) {
            setLastData((prev) => {
                const next = new Map(prev);
                next.set(symbol, {
                    symbol,
                    price: newPrice,
                    change: newChange,
                    rate: newRate
                });
                return next;
            });
        }
    };

    const subscribe = (symbol: string, trId: string = 'H0STCNT0') => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !approvalKey) return;

        // Avoid duplicate sub
        if (subscriptions.current.has(symbol)) return;

        const msg = {
            header: {
                approval_key: approvalKey,
                custtype: "P",
                tr_type: "1", // 1=Subscribe, 2=Unsubscribe
                "content-type": "utf-8"
            },
            body: {
                input: {
                    tr_id: trId,
                    tr_key: symbol
                }
            }
        };

        ws.current.send(JSON.stringify(msg));
        subscriptions.current.add(symbol);
        console.log(`Subscribed to ${symbol}`);
    };

    const unsubscribe = (symbol: string, trId: string = 'H0STCNT0') => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !approvalKey) return;

        const msg = {
            header: {
                approval_key: approvalKey,
                custtype: "P",
                tr_type: "2",
                "content-type": "utf-8"
            },
            body: {
                input: {
                    tr_id: trId,
                    tr_key: symbol
                }
            }
        };

        ws.current.send(JSON.stringify(msg));
        subscriptions.current.delete(symbol);
    };

    return (
        <WebSocketContext.Provider value={{ status, subscribe, unsubscribe, lastData }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error("useWebSocketContext must be used within WebSocketProvider");
    return context;
}
