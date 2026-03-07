"use client";

import React, { useState, useEffect } from 'react';
import { Target, Search, Edit3, RefreshCw } from 'lucide-react';
import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import PortfolioSummaryBlock from '@/components/portfolio/PortfolioSummaryBlock';
import JubotPageGuide from '@/components/common/JubotPageGuide';
import SidebarLayout from '@/components/SidebarLayout';
import { usePortfolio } from '@/context/PortfolioContext';
import AutoTargetModal from '@/components/modals/AutoTargetModal';

export default function PortfolioClientPage() {
    const { recalculateAllPortfolios } = usePortfolio();
    const [isAutoTargetOpen, setIsAutoTargetOpen] = useState(false);

    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-1 sm:p-6 animate-in fade-in duration-500">
                <header className="flex items-center gap-2 mb-4">
                    <h1 className="text-2xl font-bold text-white">내 주식일지</h1>
                    <JubotPageGuide guideText={`보유한 주식을 기록하고, 매수/매도 이유와 목표가를 설정하여\n나만의 투자 원칙을 지키는 공간입니다.`} />
                </header>

                {/* Portfolio Summary Block */}
                <section>
                    <PortfolioSummaryBlock />
                </section>

                {/* Add Asset Section */}
                <section>
                    <AddAssetForm />
                </section>

                {/* Asset List Section */}
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Edit3 size={16} className="text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">내 주식에 메모하기</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAutoTargetOpen(true)}
                                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors px-3 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                                title="카테고리별 하한목표를 자동 설정합니다"
                            >
                                <Target size={14} />
                                하한목표 자동설정
                            </button>
                            <button
                                onClick={recalculateAllPortfolios}
                                className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors px-3 py-2 rounded-full border border-[#333] bg-[#1a1a1a] hover:bg-[#252525]"
                                title="모든 종목의 매입단가를 거래내역 기준으로 다시 계산합니다."
                            >
                                <RefreshCw size={14} />
                                매입단가 전체 재계산
                            </button>
                        </div>
                    </div>

                    <PortfolioTable />
                </section>
            </div>

            {/* Auto Target Modal */}
            <AutoTargetModal
                isOpen={isAutoTargetOpen}
                onClose={() => setIsAutoTargetOpen(false)}
            />
        </SidebarLayout>
    );
}
