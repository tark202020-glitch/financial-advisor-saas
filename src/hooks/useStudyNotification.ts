'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function useStudyNotification() {
    const [hasNewStudy, setHasNewStudy] = useState(false);
    const [latestStudyId, setLatestStudyId] = useState<string | null>(null);
    const pathname = usePathname();

    const checkNewStudies = useCallback(async () => {
        try {
            // Add timestamp parameter to forcefully bypass aggressive browser caching
            const res = await fetch(`/api/study/recent?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            
            if (data.success && data.documents.length > 0) {
                const latest = data.documents[0].id;
                setLatestStudyId(latest);
                
                if (typeof window !== 'undefined') {
                    const lastRead = localStorage.getItem('lastReadStudyId');
                    if (String(latest) !== lastRead) {
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
    }, [checkNewStudies, pathname]); // Re-runs on router navigation (e.g. login to /dashboard)

    useEffect(() => {
        // Watch for custom event so multiple hook instances stay synced
        const handleMarkedAsRead = () => setHasNewStudy(false);
        const handleCheckSync = () => checkNewStudies();
        
        if (typeof window !== 'undefined') {
            window.addEventListener('study-marked-as-read', handleMarkedAsRead);
            window.addEventListener('study-check-sync', handleCheckSync);
        }
        
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('study-marked-as-read', handleMarkedAsRead);
                window.removeEventListener('study-check-sync', handleCheckSync);
            }
        };
    }, [checkNewStudies]);

    const markAsRead = useCallback(() => {
        if (latestStudyId && typeof window !== 'undefined') {
            localStorage.setItem('lastReadStudyId', String(latestStudyId));
            setHasNewStudy(false);
            // Dispatch to sync with other instances (like Sidebar) instantly
            window.dispatchEvent(new Event('study-marked-as-read'));
        }
    }, [latestStudyId]);

    return { hasNewStudy, markAsRead, checkNewStudies };
}
