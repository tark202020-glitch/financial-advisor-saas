"use client";

import { motion } from 'framer-motion';
import { Newspaper, BookOpen, BarChart2, Search, Terminal, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const features = [
    {
        id: 'SYS_01',
        icon: <Newspaper size={20} />,
        title: "DAILY_BRIEFING",
        subtitle: "Morning Routine Protocol",
        description: "4개 경제지 브리핑, 전문가 선정 지수, 섹터별 대표 종목을 한 페이지에서.\n여기저기 사이트를 헤맬 필요 없이 하루 흐름을 3분 만에 파악하세요.",
        image: "/images/feature_daily.png"
    },
    {
        id: 'SYS_02',
        icon: <BookOpen size={20} />,
        title: "TRADING_JOURNAL",
        subtitle: "Data-Driven Recording",
        description: "매수 이유와 매도 목표를 기록하세요.\n당신의 목표가 현실적인지, 언제 도달할 수 있을지 주봇이 냉철하게 분석해 드립니다.",
        image: "/images/feature_journal.png"
    },
    {
        id: 'SYS_03',
        icon: <BarChart2 size={20} />,
        title: "PORTFOLIO_INSIGHT",
        subtitle: "Personal Analyst Core",
        description: "매일 100여 개의 기사와 1년 치 공시를 AI가 대신 읽습니다.\n내 종목에 딱 필요한 정보만 골라 아침마다 리포트로 받아보세요.",
        image: "/images/feature_insight.png"
    },
    {
        id: 'SYS_04',
        icon: <Search size={20} />,
        title: "CONDITIONAL_SEARCH",
        subtitle: "Stock Discovery Engine",
        description: "남들이 좋다는 주식 말고, 매출 증가율과 영업이익률 등\n확실한 재무 데이터로 증명된 진짜 우량주를 직접 발굴해 보세요.",
        image: "/images/feature_search.png"
    }
];

export default function FeatureSection() {
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <section className="py-24 px-6 bg-[#0A0A0A] text-white border-t border-[#222]">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Terminal className="w-5 h-5 text-[#F7D047]" />
                            <span className="text-[#F7D047] font-mono text-xs tracking-widest uppercase">System Control Panel</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-0 tracking-tight">
                            Core Functionality<br />
                            <span className="text-gray-600">Modules.</span>
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#222] bg-[#111]">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-4 border-r border-[#222] bg-[#0F0F0F]">
                        <div className="p-4 border-b border-[#222]">
                            <span className="text-xs font-mono text-gray-500">AVAILABLE_MODULES</span>
                        </div>
                        {features.map((feature, index) => (
                            <button
                                key={feature.id}
                                onClick={() => setActiveFeature(index)}
                                className={`w-full text-left p-6 transition-all duration-200 border-b border-[#222] group relative overflow-hidden ${activeFeature === index
                                    ? "bg-[#1A1A1A] text-[#F7D047]"
                                    : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-[#151515]"
                                    }`}
                            >
                                {/* Active Indicator Line */}
                                {activeFeature === index && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F7D047]"></div>
                                )}

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <span className={`font-mono text-xs ${activeFeature === index ? 'text-[#F7D047]' : 'text-gray-600'}`}>
                                            [{feature.id}]
                                        </span>
                                        <span className="font-bold tracking-wide text-sm">{feature.title}</span>
                                    </div>
                                    <ChevronRight size={16} className={`transform transition-transform ${activeFeature === index ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-8 bg-[#000] relative overflow-hidden flex flex-col min-h-[500px]">
                        {/* CRT Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-20"></div>

                        <motion.div
                            key={activeFeature}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="p-8 md:p-12 flex flex-col h-full relative z-10"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white leading-tight">
                                        {features[activeFeature].subtitle}
                                    </h3>
                                    <div className="w-12 h-1 bg-[#F7D047] mb-6"></div>
                                    <p className="text-gray-400 leading-relaxed whitespace-pre-line break-keep font-mono text-sm">
                                        &gt; {features[activeFeature].description}
                                    </p>
                                </div>
                                <div className="hidden md:block p-4 border border-[#333] rounded-sm bg-[#111]">
                                    {features[activeFeature].icon}
                                </div>
                            </div>

                            {/* Image Area */}
                            <div className="mt-auto relative group w-full aspect-[16/9] border border-[#333] bg-[#111] overflow-hidden rounded-sm">
                                <motion.img
                                    src={features[activeFeature].image}
                                    alt={features[activeFeature].title}
                                    initial={{ scale: 1.05 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                />

                                {/* UI Overlay */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
