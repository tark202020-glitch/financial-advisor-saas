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

                {/* Add Asset Section */}
                <section>
                    <AddAssetForm />
                </section>

                {/* Asset List Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">내 주식에 메모하기</h2>
                    <PortfolioTable />
                </section>
            </div>
        </SidebarLayout>
    );
}
