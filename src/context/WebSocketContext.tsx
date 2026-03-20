"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getWSPrefix } from '@/lib/kis/exchange';

// --- Types ---
type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'max_retry';
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
const MAX_RETRY_COUNT = 3; // KIS 차단 방지: 최대 재시도 3회 (5→3으로 축소)
const MIN_RETRY_DELAY = 5000; // 최소 재시도 간격 5초 (1초→5초로 강화)
const MAX_RETRY_DELAY = 60000; // 최대 재시도 간격 60초 (30초→60초로 강화)

// TR IDs
const TR_ID_KR = "H0STCNT0"; // Domestic Realtime Price
const TR_ID_US = "HDFSCNT0"; // Overseas Realtime Price

// WS 불필요 페이지 (로그인/랜딩)
const EXCLUDED_PATHS = ['/login', '/', '/signup'];

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    // VERSION LOG FOR DEBUGGING DEPLOYMENT
    useEffect(() => { console.log("[SYS] WebSocketProvider Mounted - Version: WSS_STABLE_v4_ANTI_BLOCK"); }, []);

    const pathname = usePathname();

    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [approvalKey, setApprovalKey] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const [lastData, setLastData] = useState<Map<string, RealtimeData>>(new Map());

    // Debug Logs
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    // Subscriptions
    const subscriptions = useRef<Set<string>>(new Set());

    // 접속 제외 페이지 여부 (ref로 추적 — effect 의존성에 넣지 않음)
    const isExcludedPage = useRef(EXCLUDED_PATHS.includes(pathname));
    useEffect(() => {
        isExcludedPage.current = EXCLUDED_PATHS.includes(pathname);
    }, [pathname]);

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

    // --- Helper: 정상 종료 시 모든 구독 해제 후 close ---
    const gracefulClose = useCallback(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            // 모든 구독 해제 메시지 전송
            subscriptions.current.forEach(key => {
                const [marketType, symbol] = key.split(':') as [MarketType, string];
                sendRawSubscription(symbol, marketType, '2');
            });
            addLog(`[SYS] Sent ${subscriptions.current.size} unsubscribes before close`);
        }
        ws.current?.close();
        ws.current = null;
    }, [sendRawSubscription, addLog]);

    // --- 1. Get Approval Key (최초 1회만, 제외 페이지 아닐 때) ---
    const approvalKeyFetched = useRef(false);
    useEffect(() => {
        // 이미 가져왔거나 제외 페이지면 스킵
        if (approvalKeyFetched.current || EXCLUDED_PATHS.includes(pathname)) {
            return;
        }

        const fetchKey = async () => {
            try {
                const res = await fetch('/api/kis/ws-approval', { method: 'POST' });
                const data = await res.json();
                if (data.approval_key) {
                    setApprovalKey(data.approval_key);
                    approvalKeyFetched.current = true;
                    addLog("[SYS] Approval Key Fetched");
                }
            } catch (e) {
                console.error("[WS] Failed to fetch Approval Key", e);
                addLog("[SYS] Failed to fetch Approval Key");
            }
        };
        fetchKey();
    }, [addLog, pathname]);


    // --- 2.1 Reconnection Effect (강화) ---
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const retryCount = useRef(0);

    useEffect(() => {
        if (status === 'disconnected' || status === 'error') {
            // 최대 재시도 횟수 제한 (KIS 무한 접속 차단 방지)
            if (retryCount.current >= MAX_RETRY_COUNT) {
                console.warn(`[WS] Max retry count (${MAX_RETRY_COUNT}) reached. Stopping reconnection.`);
                addLog(`[SYS] 최대 재시도 ${MAX_RETRY_COUNT}회 도달. 재접속 중지.`);
                setStatus('max_retry');
                return;
            }

            // 강화된 지수 백오프: 5초 → 10초 → 20초 → 40초 → 60초
            const delay = Math.min(MIN_RETRY_DELAY * (2 ** retryCount.current), MAX_RETRY_DELAY);
            addLog(`[SYS] 재접속 대기 ${Math.round(delay / 1000)}초 (시도 ${retryCount.current + 1}/${MAX_RETRY_COUNT})`);

            reconnectTimeout.current = setTimeout(() => {
                retryCount.current++;
                setRetryTrigger(r => r + 1);
            }, delay);
        } else if (status === 'connected') {
            retryCount.current = 0;
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        }

        // cleanup: 타이머 정리
        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
        };
    }, [status, addLog]);

    const [retryTrigger, setRetryTrigger] = useState(0);

    // --- 2.2 Main WebSocket Connection (pathname 의존성 제거!) ---
    // approvalKey가 설정되면 한 번만 접속하고, 페이지 이동과 무관하게 유지
    useEffect(() => {
        if (!approvalKey) return;

        // 이미 연결 중이면 스킵
        if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

        // 비활성 탭에서는 재접속 시도 중지
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            addLog("[SYS] Tab hidden, skipping reconnect");
            return;
        }

        // 접속 제외 페이지에선 스킵 (ref로 체크, 의존성에 넣지 않음)
        if (isExcludedPage.current) return;

        // Connect Logic
        setStatus('connecting');
        addLog("[SYS] Connecting...");
        const socket = new WebSocket(WS_URL);
        ws.current = socket;

        socket.onopen = () => {
            setStatus('connected');
            addLog("[SYS] Connected");
        };

        socket.onclose = (ev) => {
            addLog(`[SYS] Disconnected (code: ${ev.code})`);
            ws.current = null;
            setStatus('disconnected');
        };

        socket.onerror = () => {
            addLog("[SYS] Connection Error");
            setStatus('error');
        };

        // onmessage 등록
        socket.onmessage = (event) => {
            handleMessageRef.current(event.data as string);
        };

        // ⚠️ cleanup: 컴포넌트 언마운트 시에만 정상 종료
        // pathname 변경으로 인한 cleanup은 발생하지 않음 (의존성에서 제거)
        return () => {
            gracefulClose();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvalKey, retryTrigger]); // pathname 제거!

    // --- 2.3 Visibility Change 핸들러 (탭 비활성/활성) ---
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                // 탭이 비활성화되면 WebSocket 정상 종료 (불필요한 접속 유지 방지)
                addLog("[SYS] Tab hidden → closing WebSocket");
                gracefulClose();
            } else if (document.visibilityState === 'visible') {
                // 탭이 다시 활성화되면 재접속 (제외 페이지 아닌 경우에만)
                if (!isExcludedPage.current && approvalKey && (!ws.current || ws.current.readyState !== WebSocket.OPEN)) {
                    addLog("[SYS] Tab visible → reconnecting");
                    retryCount.current = 0; // 재시도 카운트 리셋
                    setRetryTrigger(r => r + 1);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [approvalKey, gracefulClose, addLog]);

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
    // useRef로 최신 핸들러 참조 유지 (onmessage 등록 시점과 분리)
    const handleMessageRef = useRef((rawData: string) => {});

    handleMessageRef.current = (rawData: string) => {
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
            return;
        }

        const offset = (price === p2) ? 2 : 1;

        if (values.length > offset + 3) {
            sign = values[offset + 1];
            diff = parseInt(values[offset + 2]);
            rate = parseFloat(values[offset + 3]);
        }

        const change = (sign === '4' || sign === '5') ? -Math.abs(diff) : Math.abs(diff);

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
