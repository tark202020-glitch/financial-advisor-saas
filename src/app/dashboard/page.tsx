"use client";

import SidebarLayout from '@/components/SidebarLayout';
import MarketFlowChart from '@/components/MarketFlowChart';
import DashboardWatchlists from '@/components/DashboardWatchlists';
import JubotBriefing from '@/components/jubot/JubotBriefing';
import { useState, useEffect } from 'react';
import FullPageLoader from '@/components/ui/FullPageLoader';

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <FullPageLoader message="일일 체크 리포트를 생성중입니다..." />;
    }

    return (
        <SidebarLayout>
            <div className="max-w-[1600px] mx-auto p-6 animate-in fade-in duration-500">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-white">일일 체크</h1>
                        <p className="text-gray-400 text-sm">매일 확인해야할 주식 정보를 보여줍니다.</p>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 space-y-6">

                        {/* 0. AI Market Briefing */}
                        <JubotBriefing />

                        {/* 1. Market Info & Trends */}
                        <div className="w-full">
                            <MarketFlowChart />
                        </div>

                        {/* 2. Watchlists */}
                        <DashboardWatchlists />

                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}

