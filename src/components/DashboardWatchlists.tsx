"use client";

import SectorWatchList from '@/components/SectorWatchList';
import StockSearchModal from '@/components/modals/StockSearchModal';
import { SECTOR_STOCKS } from '@/lib/mockData';
import { useState } from 'react';

export default function DashboardWatchlists() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            {/* Adjusted Grid: 1 col mobile, 2 col tablet/laptop, 3 col large desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Row 1: Global */}
                <SectorWatchList
                    title="🇺🇸 미국 빅테크 (Big Tech)"
                    stocks={SECTOR_STOCKS['Global Big Tech']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇺🇸 미국 금융 & 소비"
                    stocks={SECTOR_STOCKS['Global Finance & Consumption']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇺🇸 미국 반도체"
                    stocks={SECTOR_STOCKS['Global Semiconductor']}
                    onAddClick={() => setIsSearchOpen(true)}
                />

                {/* Row 2: Korea */}
                <SectorWatchList
                    title="🇰🇷 한국 기술 & 제조"
                    stocks={SECTOR_STOCKS['KR Tech & Manufacturing']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇰🇷 한국 산업 & 인프라"
                    stocks={SECTOR_STOCKS['KR Industrial & Infra']}
                    onAddClick={() => setIsSearchOpen(true)}
                />
                <SectorWatchList
                    title="🇰🇷 한국 금융 & 지수"
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
