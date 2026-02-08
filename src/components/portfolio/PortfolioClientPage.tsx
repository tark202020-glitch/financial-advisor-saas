"use client";

import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import SidebarLayout from '@/components/SidebarLayout';

export default function PortfolioClientPage() {
    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6 animate-in fade-in duration-500">
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
