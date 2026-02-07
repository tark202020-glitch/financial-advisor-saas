"use client";

import SectorWatchList from '@/components/SectorWatchList';
import StockSearchModal from '@/components/modals/StockSearchModal';
import { SECTOR_STOCKS } from '@/lib/mockData';
import { useState } from 'react';

export default function DashboardWatchlists() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1: Global */}
                <SectorWatchList
                    title="🇺🇸 Global Big Tech"
                    stocks={SECTOR_STOCKS['Global Big Tech']}
                />
                <SectorWatchList
                    title="🇺🇸 Global Finance & Consumption"
                    stocks={SECTOR_STOCKS['Global Finance & Consumption']}
                />
                <SectorWatchList
                    title="🇺🇸 Global Semiconductor"
                    stocks={SECTOR_STOCKS['Global Semiconductor']}
                />

                {/* Row 2: Korea */}
                <SectorWatchList
                    title="🇰🇷 KR Tech & Manufacturing"
                    stocks={SECTOR_STOCKS['KR Tech & Manufacturing']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇰🇷 KR Industrial & Infra"
                    stocks={SECTOR_STOCKS['KR Industrial & Infra']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇰🇷 KR Finance & Index"
                    stocks={SECTOR_STOCKS['KR Finance & Index']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
            </div>

            {/* Kept Search Modal for "Adding" to Context, though context is not displayed here directly anymore.
                This allows adding to "My Stock Journal" behind the scenes or if we add a "My List" section later.
                For now, the "+" button is on the KR headers as a convenience entrance. */}
            <StockSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
