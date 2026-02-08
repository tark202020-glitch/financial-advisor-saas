"use client";

import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import { usePortfolio } from '@/context/PortfolioContext';
import { Wallet } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';

export default function PortfolioPage() {
    const { totalInvested } = usePortfolio();

    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <Wallet className="text-indigo-600" />
                            내 자산 관리 (My Asset)
                        </h1>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 text-right">
                        <span className="block text-xs text-slate-500 uppercase font-semibold">총 매수 금액</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            {totalInvested.toLocaleString()} <span className="text-sm text-slate-400 font-normal">KRW (est)</span>
                        </span>
                    </div>
                </header>

                {/* Add Asset Section */}
                <section>
                    <AddAssetForm />
                </section>

                {/* Asset List Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">보유 자산 목록</h2>
                    <PortfolioTable />
                </section>
            </div>
        </SidebarLayout>
    );
}
