"use client";

import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import PortfolioSummaryBlock from '@/components/portfolio/PortfolioSummaryBlock';
import SidebarLayout from '@/components/SidebarLayout';

import { usePortfolio } from '@/context/PortfolioContext';

export default function PortfolioClientPage() {
    const { recalculateAllPortfolios } = usePortfolio();

    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6 animate-in fade-in duration-500">
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
                    <div className="flex justify-between items-end">
                        <h2 className="text-xl font-bold text-white">내 주식에 메모하기</h2>
                        <button
                            onClick={recalculateAllPortfolios}
                            className="text-xs text-gray-400 hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-[#252525]"
                            title="모든 종목의 매입단가를 거래내역 기준으로 다시 계산합니다."
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 21h5v-5" />
                            </svg>
                            매입단가 전체 재계산
                        </button>
                    </div>
                    <PortfolioTable />
                </section>
            </div>
        </SidebarLayout>
    );
}
