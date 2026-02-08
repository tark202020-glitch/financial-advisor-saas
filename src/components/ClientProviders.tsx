"use client";

import { PortfolioProvider } from "@/context/PortfolioContext";
import { WebSocketProvider } from '@/context/WebSocketContext';
import { WatchlistProvider } from '@/context/WatchlistContext';

export default function ClientProviders({
    children,
    initialUser
}: {
    children: React.ReactNode;
    initialUser: any | null;
}) {
    return (
        <WebSocketProvider>
            <WatchlistProvider>
                <PortfolioProvider initialUser={initialUser}>
                    {children}
                </PortfolioProvider>
            </WatchlistProvider>
        </WebSocketProvider>
    );
}
