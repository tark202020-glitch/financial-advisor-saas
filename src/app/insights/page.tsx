"use client";

import SidebarLayout from "@/components/SidebarLayout";
import PortfolioCompositionBlock from "@/components/insights/PortfolioCompositionBlock";
import TargetProximityBlock from "@/components/insights/TargetProximityBlock";

export default function InsightsPage() {
    return (
        <SidebarLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">내 주식 인사이트</h1>
                    <p className="text-slate-500 mt-2">보유 종목의 다양한 분석 정보를 한눈에 확인하세요.</p>
                </header>

                {/* Block 1: Portfolio Composition (Pie Chart & Top 5) */}
                <section>
                    <PortfolioCompositionBlock />
                </section>

                {/* Block 2: Target Price Proximity */}
                <section>
                    <TargetProximityBlock />
                </section>
            </div>
        </SidebarLayout>
    );
}
