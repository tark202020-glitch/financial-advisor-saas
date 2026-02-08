"use client";

import { usePortfolio } from '@/context/PortfolioContext';
import PortfolioCard from './PortfolioCard';
import { Trash2 } from 'lucide-react';

export default function PortfolioTable() {
    const { assets, removeAsset, isLoading } = usePortfolio();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-64 animate-pulse">
                        <div className="h-6 bg-slate-100 rounded mb-4 w-1/3"></div>
                        <div className="h-8 bg-slate-100 rounded mb-6 w-1/2"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-100 rounded"></div>
                            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">보유한 자산이 없습니다. 자산을 추가해 보세요.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
                <PortfolioCard key={asset.id} asset={asset} />
            ))}
        </div>
    );
}
