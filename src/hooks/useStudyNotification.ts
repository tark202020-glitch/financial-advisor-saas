'use client';

import { useState, useEffect, useCallback } from 'react';

export function useStudyNotification() {
    const [hasNewStudy, setHasNewStudy] = useState(false);
    const [latestStudyId, setLatestStudyId] = useState<string | null>(null);

    const checkNewStudies = useCallback(async () => {
        try {
            const res = await fetch('/api/study/recent', { cache: 'no-store' });
            const data = await res.json();
            
            if (data.success && data.documents.length > 0) {
                const latest = data.documents[0].id;
                setLatestStudyId(latest);
                
                if (typeof window !== 'undefined') {
                    const lastRead = localStorage.getItem('lastReadStudyId');
                    if (latest !== lastRead) {
                        setHasNewStudy(true);
                    } else {
                        setHasNewStudy(false);
                    }
                }
            } else {
                setHasNewStudy(false);
            }
        } catch (error) {
            console.error('Failed to check new studies', error);
        }
    }, []);

    useEffect(() => {
        checkNewStudies();
        
        // Polling every 5 minutes in case it's left open
        const interval = setInterval(checkNewStudies, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkNewStudies]);

    const markAsRead = useCallback(() => {
        if (latestStudyId && typeof window !== 'undefined') {
            localStorage.setItem('lastReadStudyId', latestStudyId);
            setHasNewStudy(false);
        }
    }, [latestStudyId]);

    return { hasNewStudy, markAsRead, checkNewStudies };
}
