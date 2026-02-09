"use client";

import TargetProximityBlock from "@/components/insights/TargetProximityBlock";

export default function InsightsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">내 주식 인사이트</h1>
                <p className="text-slate-500 mt-2">보유 종목의 다양한 분석 정보를 한눈에 확인하세요.</p>
            </header>

            {/* Block 1: Target Price Proximity */}
            <section>
                <TargetProximityBlock />
            </section>
        </div>
    );
}
