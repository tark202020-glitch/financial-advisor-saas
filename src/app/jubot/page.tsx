"use client";

import SidebarLayout from '@/components/SidebarLayout';
import JubotBriefing from '@/components/jubot/JubotBriefing';
import JubotPortfolioInsight from '@/components/jubot/JubotPortfolioInsight';
import { Bot } from 'lucide-react';

export default function JubotPage() {
    return (
        <SidebarLayout>
            <div className="max-w-[1400px] mx-auto p-1 sm:p-6 animate-in fade-in duration-500">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F7D047] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-yellow-900/30">
                            <Bot size={28} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">주봇 AI 전문가</h1>
                            <p className="text-gray-400 text-sm">매일 뉴스와 데이터를 분석하여 투자 인사이트를 제공합니다</p>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="space-y-6">
                    {/* 1. Daily Briefing */}
                    <JubotBriefing />

                    {/* 2. Portfolio AI Analysis */}
                    <JubotPortfolioInsight />
                </div>
            </div>
        </SidebarLayout>
    );
}
