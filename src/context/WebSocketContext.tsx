"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { getWSPrefix } from '@/lib/kis/exchange';

// --- Types ---
type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type MarketType = 'KR' | 'US';

interface RealtimeData {
    symbol: string;
    price: number;
    change: number;
    rate: number;
    time?: string;
    marketType: MarketType;
}

interface WebSocketContextType {
    status: WebSocketStatus;
    subscribe: (symbol: string, marketType: MarketType) => void;
    unsubscribe: (symbol: string, marketType: MarketType) => void;
    lastData: Map<string, RealtimeData>;
    debugLogs: string[];
}

// --- Constants ---
const WS_URL = "wss://ops.koreainvestment.com:21000";

// TR IDs
const TR_ID_KR = "H0STCNT0"; // Domestic Realtime Price
const TR_ID_US = "HDFSCNT0"; // Overseas Realtime Price

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    // VERSION LOG FOR DEBUGGING DEPLOYMENT
    useEffect(() => { console.log("[SYS] WebSocketProvider Mounted - Version: WSS_FIX_APPLIED_v2"); }, []);

    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [approvalKey, setApprovalKey] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const [lastData, setLastData] = useState<Map<string, RealtimeData>>(new Map());

    // Debug Logs
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    // Subscriptions
    const subscriptions = useRef<Set<string>>(new Set());

    const addLog = useCallback((msg: string) => {
        setDebugLogs(prev => [msg, ...prev].slice(0, 30));
    }, []);

    // --- Helper: US Exchange Prefix ---
    const getUSExchangePrefix = useCallback((symbol: string) => {
        return getWSPrefix(symbol);
    }, []);

    // --- Helper: Send Subscription Message ---
    // trType: '1' (Sub), '2' (Unsub)
    const sendRawSubscription = useCallback((symbol: string, marketType: MarketType, trType: '1' | '2') => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !approvalKey) {
            // If trying to subscribe but not ready, we rely on the Reconnector effect.
            // But if trying to unsubscribe and not ready, we can't do much (connection dead anyway).
            return;
        }

        const trId = marketType === 'KR' ? TR_ID_KR : TR_ID_US;

        let trKey = symbol;
        if (marketType === 'US') {
            const upperSymbol = symbol.toUpperCase();
            const prefix = getUSExchangePrefix(upperSymbol);
            trKey = `${prefix}${upperSymbol}`;
        }

        const msg = {
            header: {
                approval_key: approvalKey,
                custtype: "P",
                tr_type: trType,
                "content-type": "utf-8"
            },
            body: {
                input: {
                    tr_id: trId,
                    tr_key: trKey
                }
            }
        };

        try {
            ws.current.send(JSON.stringify(msg));
            const verboseType = trType === '1' ? 'SUB' : 'UNSUB';
            addLog(`[${verboseType}] ${marketType} ${trKey}`);
        } catch (e) {
            console.error("[WS] Send Error", e);
        }
    }, [approvalKey, getUSExchangePrefix, addLog]);

    // --- 1. Get Approval Key ---
    useEffect(() => {
        const fetchKey = async () => {
            try {
                const res = await fetch('/api/kis/ws-approval', { method: 'POST' });
                const data = await res.json();
                if (data.approval_key) {
                    setApprovalKey(data.approval_key);
                    addLog("[SYS] Approval Key Fetched");
                }
            } catch (e) {
                console.error("[WS] Failed to fetch Approval Key", e);
                addLog("[SYS] Failed to fetch Approval Key");
            }
        };
        fetchKey();
    }, [addLog]);

    // --- 2. Connection Logic ---
    useEffect(() => {
        if (!approvalKey) return;

        const connect = () => {
            if (ws.current?.readyState === WebSocket.OPEN) return;

            setStatus('connecting');
            try {
                const socket = new WebSocket("wss://ops.koreainvestment.com:21000");
                ws.current = socket;

                socket.onopen = () => {
                    console.log("[WS] Connected");
                    setStatus('connected');
                    addLog("[SYS] Connected to KIS WS");
                };

                socket.onmessage = (event) => {
                    if (typeof event.data === 'string') {
                        handleMessage(event.data);
                    }
                };

                socket.onclose = () => {
                    console.log("[WS] Disconnected");
                    setStatus('disconnected');
                    addLog("[SYS] Disconnected");
                    setTimeout(connect, 3000); // Auto Reconnect
                };

                socket.onerror = (err) => {
                    console.error("[WS] Error", err);
                    setStatus('error');
                    addLog("[SYS] Connection Error");
                };
            } catch (e) {
                console.error("[WS] Construction Error", e);
                setStatus('error');
            }
        };

        connect();

        return () => {
            ws.current?.close();
        };
    }, [approvalKey, addLog]);

    // --- 2.5 Reconnection / Queue Processing ---
    // Whenever status becomes 'connected', re-send all active subscriptions.
    useEffect(() => {
        if (status === 'connected' && approvalKey) {
            if (subscriptions.current.size > 0) {
                addLog(`[SYS] Resending ${subscriptions.current.size} subs...`);
                subscriptions.current.forEach(key => {
                    const [marketType, symbol] = key.split(':') as [MarketType, string];
                    sendRawSubscription(symbol, marketType, '1');
                });
            }
        }
    }, [status, approvalKey, sendRawSubscription, addLog]);


    // --- 3. Message Handling (The Core) ---
    const handleMessage = (rawData: string) => {
        const firstChar = rawData.charAt(0);

        // System Messages (PING/PONG/Subscription Ack)
        if (firstChar === '{' || firstChar === '0' && !rawData.includes('|')) {
            // Log subscription success explicitly
            if (firstChar === '{') {
                try {
                    const json = JSON.parse(rawData);
                    if (json.msgCd) addLog(`[ACK] ${json.msgCd}`);
                } catch (e) { addLog(`[ACK] Raw JSON`); }
            }
            return;
        }

        // Data Packet: 0|TR_ID|KEY|DATA...
        const parts = rawData.split('|');
        if (parts.length < 4) {
            addLog(`[RAW] Invalid Parts: ${parts.length}`);
            return;
        }

        const trId = parts[1];
        const symbol = parts[2];
        const dataBody = parts[3];

        // LOGGING DATA ARRIVALS
        addLog(`[RECV] ${symbol} (${trId})`);

        if (trId === TR_ID_KR) {
            parseDomestic(symbol, dataBody);
        } else if (trId === 'H0GSCNT0' || trId === 'HDFSCNT0') {
            parseOverseas(symbol, dataBody, trId);
        }
    };

    // --- 4. Parsers ---
    const parseDomestic = (headerSymbol: string, dataBody: string) => {
        const values = dataBody.split('^');
        if (values.length < 5) {
            addLog(`[KR-ERR] Split Len ${values.length}`);
            return;
        }

        // KIS WS: Real symbol is often at values[0] in the body
        const realSymbol = values[0];

        let price = 0;
        let diff = 0;
        let rate = 0;
        let sign = '3';

        const p1 = parseInt(values[1]);
        const p2 = parseInt(values[2]);

        // Use p2 (current price) primarily, fallback to p1
        if (p2 > 0 && p2 < 50000000) price = p2;
        else if (p1 > 0 && p1 < 50000000) price = p1;

        if (price === 0) {
            // addLog(`[KR-ZERO] ${realSymbol} P1=${p1} P2=${p2}`);
            return;
        }

        const offset = (price === p2) ? 2 : 1;

        if (values.length > offset + 3) {
            sign = values[offset + 1];
            diff = parseInt(values[offset + 2]);
            rate = parseFloat(values[offset + 3]);
        }

        // DEBUG SIGN
        // addLog(`[KR-SIGN] ${realSymbol} Sig=${sign} Dif=${diff} Rt=${rate}`);

        const change = (sign === '4' || sign === '5') ? -Math.abs(diff) : Math.abs(diff);

        // addLog(`[KR-OK] ${realSymbol} ${price}`);

        updateData(realSymbol, {
            symbol: realSymbol,
            price,
            change,
            rate,
            marketType: 'KR'
        });
    };

    const parseOverseas = (headerSymbol: string, dataBody: string, trId: string) => {
        const values = dataBody.split('^');

        // US Format typically: SYMBOL^...
        const realSymbol = values[0];

        let price = 0;
        let change = 0;
        let rate = 0;

        if (values.length > 10) {
            // Check indices for US (HDFSCNT0)
            // Often: ...^Price(3)^... or Price(11)?
            // Let's stick to previous generic logic for now but use realSymbol
            price = parseFloat(values[3]);
            const diff = parseFloat(values[5]);
            rate = parseFloat(values[6]);

            const sign = values[4];
            change = (sign === '4' || sign === '5') ? -Math.abs(diff) : Math.abs(diff);
        } else {
            addLog(`[US-ERR] ${headerSymbol} Len=${values.length}`);
        }

        if (price > 0) {
            updateData(realSymbol, {
                symbol: realSymbol,
                price,
                change,
                rate,
                marketType: 'US'
            });
        }
    };

    const updateData = (symbol: string, data: RealtimeData) => {
        setLastData(prev => {
            const next = new Map(prev);
            next.set(symbol, data);
            return next;
        });
    };

    // --- 5. Subscribe / Unsubscribe ---
    const subscribe = useCallback((symbol: string, marketType: MarketType) => {
        const key = `${marketType}:${symbol}`;

        // Always add to "Desired State" first
        if (!subscriptions.current.has(key)) {
            subscriptions.current.add(key);
            // Try to send immediately if connected
            sendRawSubscription(symbol, marketType, '1');
        } else {
            // Already in set, but maybe disconnected? 
            // Logic in 'Reconnection Effect' ensures it sends if we reconnect.
            // If we are already connected and called subscribe again, do we resend?
            // Maybe safe to ignore if Set has it.

            // BUT: If user refreshed or something, handle redundancy.
            // Actually, checking Set existence is good enough.
        }
    }, [sendRawSubscription]);

    const unsubscribe = useCallback((symbol: string, marketType: MarketType) => {
        const key = `${marketType}:${symbol}`;

        if (subscriptions.current.has(key)) {
            subscriptions.current.delete(key);
            sendRawSubscription(symbol, marketType, '2');
        }
    }, [sendRawSubscription]);

    return (
        <WebSocketContext.Provider value={{ status, subscribe, unsubscribe, lastData, debugLogs }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error("useWebSocketContext must be used within WebSocketProvider");
    return context;
}
