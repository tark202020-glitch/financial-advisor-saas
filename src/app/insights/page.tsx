"use client";

import JubotPortfolioInsight from '@/components/jubot/JubotPortfolioInsight';
import JubotHistory from '@/components/jubot/JubotHistory';
import PortfolioCompositionBlock from '@/components/insights/PortfolioCompositionBlock';
import TargetProximityBlock from '@/components/insights/TargetProximityBlock';
import SidebarLayout from "@/components/SidebarLayout";
import JubotPageGuide from '@/components/common/JubotPageGuide';
import { usePortfolio } from '@/context/PortfolioContext';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function DataStatusBanner() {
    const {
        krLoading, krRetrying, krHasError, krLoadedCount, krTotalCount, refetchKr,
        usLoading, usRetrying, usHasError, usLoadedCount, usTotalCount, refetchUs,
        goldLoading,
    } = usePortfolio();

    const isAnyLoading = krLoading || usLoading || goldLoading;
    const isAnyRetrying = krRetrying || usRetrying;
    const hasAnyError = krHasError || usHasError;

    // 모두 완료 + 에러 없음 → 배너 숨김
    if (!isAnyLoading && !isAnyRetrying && !hasAnyError) return null;

    const handleRetryAll = () => {
        if (krHasError) refetchKr();
        if (usHasError) refetchUs();
    };

    return (
        <div className={`rounded-xl border px-4 py-3 mb-6 flex items-center justify-between gap-3 text-sm transition-all duration-300 ${
            hasAnyError && !isAnyRetrying
                ? 'bg-red-950/30 border-red-900/40 text-red-300'
                : isAnyRetrying
                    ? 'bg-amber-950/30 border-amber-900/40 text-amber-300'
                    : 'bg-[#252525] border-[#333] text-gray-300'
        }`}>
            <div className="flex items-center gap-3 flex-wrap">
                {isAnyLoading ? (
                    <Loader2 size={16} className="animate-spin text-blue-400 flex-shrink-0" />
                ) : isAnyRetrying ? (
                    <RefreshCw size={16} className="animate-spin text-amber-400 flex-shrink-0" />
                ) : hasAnyError ? (
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                ) : (
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                )}

                <div className="flex items-center gap-4 flex-wrap">
                    {/* KR 상태 */}
                    {krTotalCount > 0 && (
                        <span className={`flex items-center gap-1.5 ${krLoading ? 'text-blue-400' : krRetrying ? 'text-amber-400' : krHasError ? 'text-red-400' : 'text-green-400'}`}>
                            <span className="font-bold">KR</span>
                            {krLoading ? (
                                <span>{krLoadedCount}/{krTotalCount} 로딩중</span>
                            ) : krRetrying ? (
                                <span>자동 재시도 중</span>
                            ) : krHasError ? (
                                <span>일부 실패</span>
                            ) : (
                                <span>{krLoadedCount}/{krTotalCount} ✓</span>
                            )}
                        </span>
                    )}
                    {/* US 상태 */}
                    {usTotalCount > 0 && (
                        <span className={`flex items-center gap-1.5 ${usLoading ? 'text-blue-400' : usRetrying ? 'text-amber-400' : usHasError ? 'text-red-400' : 'text-green-400'}`}>
                            <span className="font-bold">US</span>
                            {usLoading ? (
                                <span>{usLoadedCount}/{usTotalCount} 로딩중</span>
                            ) : usRetrying ? (
                                <span>자동 재시도 중</span>
                            ) : usHasError ? (
                                <span>일부 실패</span>
                            ) : (
                                <span>{usLoadedCount}/{usTotalCount} ✓</span>
                            )}
                        </span>
                    )}
                    {/* Gold 상태 */}
                    {goldLoading && (
                        <span className="text-yellow-500 flex items-center gap-1">
                            <span className="font-bold">GOLD</span> 로딩중
                        </span>
                    )}
                </div>
            </div>

            {/* 재시도 버튼 (에러 시만 표시) */}
            {hasAnyError && !isAnyLoading && !isAnyRetrying && (
                <button
                    onClick={handleRetryAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-lg border border-red-800/30 transition-colors font-medium text-xs flex-shrink-0"
                >
                    <RefreshCw size={12} />
                    재시도
                </button>
            )}
        </div>
    );
}


export default function InsightsPage() {
    return (
        <SidebarLayout>
            <div className="p-1 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-white">내 주식 인사이트</h1>
                        <JubotPageGuide guideText={`내 포트폴리오의 구성과 목표가 달성률을 분석하여,\n현재 상태를 점검하고 대응 전략을 세우는 공간입니다.`} />
                    </div>
                    <p className="text-gray-400">보유한 주식의 목표가 달성 현황과 포트폴리오 구성을 분석합니다.</p>
                </header>

                {/* Data Status Banner */}
                <DataStatusBanner />

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
