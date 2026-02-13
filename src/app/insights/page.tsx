"use client";

import JubotPortfolioInsight from '@/components/jubot/JubotPortfolioInsight';
import JubotHistory from '@/components/jubot/JubotHistory';
import PortfolioCompositionBlock from '@/components/insights/PortfolioCompositionBlock';
import TargetProximityBlock from '@/components/insights/TargetProximityBlock';
import SidebarLayout from "@/components/SidebarLayout";

export default function InsightsPage() {
    return (
        <SidebarLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">내 주식 인사이트</h1>
                    <p className="text-gray-400">보유한 주식의 목표가 달성 현황과 포트폴리오 구성을 분석합니다.</p>
                </header>

                {/* AI Portfolio Analysis (주봇) */}
                <JubotPortfolioInsight />

                {/* 1. Target Price Graphs */}
                <TargetProximityBlock />

                {/* 2. Portfolio Composition */}
                <PortfolioCompositionBlock />

                {/* 3. AI Analysis History Timeline */}
                <JubotHistory />
            </div>
        </SidebarLayout>
    );
}

