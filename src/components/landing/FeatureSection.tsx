"use client";

import { motion } from 'framer-motion';
import { Newspaper, BookOpen, BarChart2, Search, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const features = [
    {
        id: 'MOD_01',
        icon: <Newspaper size={24} />,
        title: "데일리 브리핑",
        engTitle: "DAILY BRIEFING",
        description: "주요 경제지와 전문가 리포트를 AI가 요약합니다.\n매일 아침 3분, 시장의 흐름을 완벽하게 파악하세요.",
        image: "/images/feature_briefing.png" // Placeholder
    },
    {
        id: 'MOD_02',
        icon: <BookOpen size={24} />,
        title: "매매 일지",
        engTitle: "TRADING JOURNAL",
        description: "매수/매도 원칙을 기록하고 AI가 이를 분석합니다.\n성공적인 투자는 기록에서 시작됩니다.",
        image: "/images/feature_journal.png" // Placeholder
    },
    {
        id: 'MOD_03',
        icon: <BarChart2 size={24} />,
        title: "포트폴리오 인사이트",
        engTitle: "PORTFOLIO INSIGHT",
        description: "보유 종목의 리스크와 기회를 실시간으로 진단합니다.\n감정이 아닌 데이터로 내 자산을 관리하세요.",
        image: "/images/feature_portfolio.png" // Placeholder
    },
    {
        id: 'MOD_04',
        icon: <Search size={24} />,
        title: "조건 검색",
        engTitle: "CONDITIONAL SEARCH",
        description: "재무 건전성과 성장성을 갖춘 우량주를 발굴합니다.\n소문이 아닌 실적에 기반한 종목을 찾으세요.",
        image: "/images/feature_search.png" // Placeholder
    }
];

export default function FeatureSection() {
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <section className="py-32 px-6 bg-[#111] text-white">
            <div className="max-w-[1920px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-gray-800 pb-12">
                    <div>
                        <span className="text-[#F7D047] font-mono text-sm font-bold tracking-widest uppercase mb-4 block">
                            CORE MODULES
                        </span>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white">
                            Powerful<br />
                            <span className="text-gray-500">Tools.</span>
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-4 flex flex-col gap-2">
                        {features.map((feature, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveFeature(index)}
                                className={`group p-8 text-left transition-all duration-300 border border-transparent ${activeFeature === index
                                        ? "bg-[#1A1A1A] border-gray-700"
                                        : "hover:bg-[#151515] hover:border-[#333]"
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-mono text-xs tracking-widest ${activeFeature === index ? "text-[#F7D047]" : "text-gray-600"}`}>
                                        {feature.id}
                                    </span>
                                    {activeFeature === index && <ArrowUpRight className="text-[#F7D047]" size={16} />}
                                </div>
                                <h3 className={`text-2xl font-bold transition-colors ${activeFeature === index ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}>
                                    {feature.title}
                                </h3>
                            </button>
                        ))}
                    </div>

                    {/* Main Display Area */}
                    <div className="lg:col-span-8 relative min-h-[600px] bg-[#000] border border-gray-800 p-8 md:p-16 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            {features[activeFeature].icon}
                        </div>

                        <div>
                            <div className="font-mono text-[#F7D047] text-sm font-bold tracking-widest mb-4">
                                {features[activeFeature].engTitle}
                            </div>
                            <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                                {features[activeFeature].title}
                            </h3>
                            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed whitespace-pre-line font-medium">
                                {features[activeFeature].description}
                            </p>
                        </div>

                        {/* Visual Placeholder for Module Interface */}
                        <div className="mt-12 w-full h-64 bg-[#111] border border-gray-800 rounded-sm relative overflow-hidden group">
                            {/* Abstract UI Representation */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-mono text-xs uppercase tracking-widest group-hover:text-[#F7D047] transition-colors">
                                [ Module Interface Preview ]
                            </div>
                            {/* Actual Image if available would go here */}
                            {/* <img src={features[activeFeature].image} ... /> */}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
