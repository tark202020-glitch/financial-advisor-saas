import AiGuruBlock from '@/components/insights/AiGuruBlock';
import PortfolioCompositionBlock from '@/components/insights/PortfolioCompositionBlock';
import TargetProximityBlock from '@/components/insights/TargetProximityBlock';
import SidebarLayout from "@/components/SidebarLayout";

export const metadata = {
    title: '내 주식 인사이트 - Financial Advisor',
    description: '보유 주식에 대한 심층 분석 및 목표가 관리',
};

export default function InsightsPage() {
    return (
        <SidebarLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">내 주식 인사이트</h1>
                    <p className="text-slate-500">보유한 주식의 목표가 달성 현황과 포트폴리오 구성을 분석합니다.</p>
                </header>

                {/* AI Guru Advice */}
                <AiGuruBlock />

                {/* 1. Target Price Graphs */}
                <TargetProximityBlock />

                {/* 2. Portfolio Composition */}
                <PortfolioCompositionBlock />
            </div>
        </SidebarLayout>
    );
}
