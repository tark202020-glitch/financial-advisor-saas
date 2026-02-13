"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseStockFetchOptions {
    maxRetries?: number;
    retryDelay?: number;  // Base delay in ms (exponential backoff applied)
    timeout?: number;     // Timeout per request in ms
    enabled?: boolean;    // Whether to auto-fetch on mount
    parser?: (data: any) => any; // Custom response parser
}

interface UseStockFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    retryCount: number;
    refetch: () => void;
}

/**
 * 주식 데이터 fetch 공통 훅
 * - 자동 Retry (지수 백오프)
 * - Timeout (AbortController)
 * - 수동 refetch 기능
 */
export function useStockFetch<T = any>(
    url: string | null,
    options?: UseStockFetchOptions
): UseStockFetchResult<T> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        timeout = 10000,
        enabled = true,
        parser,
    } = options || {};

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [fetchTrigger, setFetchTrigger] = useState(0);

    const isMounted = useRef(true);
    const abortRef = useRef<AbortController | null>(null);

    const doFetch = useCallback(async () => {
        if (!url) return;

        // Cancel previous request
        if (abortRef.current) {
            abortRef.current.abort();
        }

        setLoading(true);
        setError(null);
        setRetryCount(0);

        let lastError = '';

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (!isMounted.current) return;

            // Wait before retry (skip delay on first attempt)
            if (attempt > 0) {
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, delay));
                if (!isMounted.current) return;
                setRetryCount(attempt);
            }

            try {
                const controller = new AbortController();
                abortRef.current = controller;

                // Timeout
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    lastError = `HTTP ${res.status}`;
                    continue; // Retry
                }

                const json = await res.json();

                if (!isMounted.current) return;

                const parsed = parser ? parser(json) : json;

                if (parsed !== null && parsed !== undefined) {
                    setData(parsed);
                    setLoading(false);
                    setError(null);
                    return; // Success!
                } else {
                    lastError = '데이터가 비어있습니다';
                    continue; // Retry
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    lastError = '요청 시간 초과';
                } else {
                    lastError = e.message || '네트워크 오류';
                }
                // Continue to retry
            }
        }

        // All retries exhausted
        if (isMounted.current) {
            setLoading(false);
            setError(lastError || '데이터를 불러올 수 없습니다');
        }
    }, [url, maxRetries, retryDelay, timeout, parser]);

    // Auto-fetch on mount or URL change
    useEffect(() => {
        isMounted.current = true;
        if (enabled && url) {
            doFetch();
        }
        return () => {
            isMounted.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, [url, enabled, fetchTrigger]);

    // Manual refetch
    const refetch = useCallback(() => {
        setFetchTrigger(prev => prev + 1);
    }, []);

    return { data, loading, error, retryCount, refetch };
}
