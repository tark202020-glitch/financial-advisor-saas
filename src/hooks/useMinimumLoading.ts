"use client";

import { useState, useEffect } from 'react';

export function useMinimumLoading(actualIsLoading: boolean, minDuration: number = 3000) {
    const [shouldShowLoading, setShouldShowLoading] = useState(true);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // If actual loading starts, ensure we show loading
        if (actualIsLoading) {
            setShouldShowLoading(true);
        } else {
            // If actual loading finishes, wait for the remainder of minDuration
            // Logic: We start a timer on mount (or when loading starts). 
            // Simplified: We just enforce that `shouldShowLoading` stays true for at least X ms from *mount*.
        }
    }, [actualIsLoading]);

    useEffect(() => {
        // Simple implementation: Lock loading state for minDuration on mount
        const timer = setTimeout(() => {
            setShouldShowLoading(false);
        }, minDuration);

        return () => clearTimeout(timer);
    }, [minDuration]);

    // Show loading if:
    // 1. The minimum timer hasn't finished (shouldShowLoading is true based on timeout)
    // 2. The actual data is still loading (actualIsLoading is true)

    // However, the above useEffect logic is slightly flawed because it only runs once on mount.
    // Correct logic:
    // We need a state that says "Timer Done".

    const [isTimerDone, setIsTimerDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTimerDone(true);
        }, minDuration);
        return () => clearTimeout(timer);
    }, [minDuration]);

    return !isTimerDone || actualIsLoading;
}
