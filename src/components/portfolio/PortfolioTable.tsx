"use client";

import { usePortfolio } from '@/context/PortfolioContext';
import PortfolioCard from './PortfolioCard';
import { Trash2 } from 'lucide-react';

export default function PortfolioTable() {
    const { assets, removeAsset } = usePortfolio();

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
