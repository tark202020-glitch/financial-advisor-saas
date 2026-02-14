"use client";

import { motion } from 'framer-motion';
import { Newspaper, BookOpen, BarChart2, Search } from 'lucide-react';
import { useState } from 'react';

const features = [
    {
        id: 'daily',
        icon: <Newspaper size={24} />,
        title: "일일 체크",
        subtitle: "투자자의 아침 루틴을 완성하다",
        description: "4개 경제지 브리핑, 전문가 선정 지수, 섹터별 대표 종목을 한 페이지에서.\n여기저기 사이트를 헤맬 필요 없이 하루 흐름을 3분 만에 파악하세요.",
        color: "bg-blue-500"
    },
    {
        id: 'journal',
        icon: <BookOpen size={24} />,
        title: "내 주식 일지",
        subtitle: "감으로 하는 투자를 데이터로 바꾸다",
        description: "매수 이유와 매도 목표를 기록하세요.\n당신의 목표가 현실적인지, 언제 도달할 수 있을지 주봇이 냉철하게 분석해 드립니다.",
        color: "bg-teal-500"
    },
    {
        id: 'insight',
        icon: <BarChart2 size={24} />,
        title: "내 주식 인사이트",
        subtitle: "나만을 위한 전용 애널리스트",
        description: "매일 100여 개의 기사와 1년 치 공시를 AI가 대신 읽습니다.\n내 종목에 딱 필요한 정보만 골라 아침마다 리포트로 받아보세요.",
        color: "bg-purple-500"
    },
    {
        id: 'search',
        icon: <Search size={24} />,
        title: "조건 검색",
        subtitle: "우량주를 발굴하는 안목",
        description: "남들이 좋다는 주식 말고, 매출 증가율과 영업이익률 등\n확실한 재무 데이터로 증명된 진짜 우량주를 직접 발굴해 보세요.",
        color: "bg-orange-500"
    }
];

export default function FeatureSection() {
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <section className="py-24 px-6 bg-[#121212] text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        투자 성공을 위한<br />
                        <span className="text-[#F7D047]">4가지 핵심 도구</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Navigation (Left) */}
                    <div className="lg:col-span-4 space-y-4">
                        {features.map((feature, index) => (
                            <button
                                key={feature.id}
                                onClick={() => setActiveFeature(index)}
                                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 border ${activeFeature === index
                                        ? "bg-[#252525] border-[#F7D047] shadow-[0_0_20px_rgba(247,208,71,0.1)]"
                                        : "bg-transparent border-transparent hover:bg-[#1E1E1E] text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                <div className={`flex items-center gap-4 ${activeFeature === index ? 'text-white' : ''}`}>
                                    <div className={`p-2 rounded-lg ${activeFeature === index ? 'bg-[#F7D047] text-black' : 'bg-[#333] text-gray-400'}`}>
                                        {feature.icon}
                                    </div>
                                    <span className="font-bold text-lg">{feature.title}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Preview (Right) */}
                    <div className="lg:col-span-8">
                        <motion.div
                            key={activeFeature}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#1E1E1E] border border-[#333] rounded-3xl p-8 md:p-12 h-full flex flex-col"
                        >
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-[#F7D047] mb-2">
                                    {features[activeFeature].title}
                                </h3>
                                <h4 className="text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">
                                    "{features[activeFeature].subtitle}"
                                </h4>
                                <p className="text-xl text-gray-400 leading-relaxed whitespace-pre-line break-keep">
                                    {features[activeFeature].description}
                                </p>
                            </div>

                            {/* Mockup Area */}
                            <div className="mt-auto bg-[#121212] rounded-xl border border-[#333] p-4 aspect-[16/9] flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#252525] to-[#121212]"></div>
                                {/* Abstract UI Placeholder */}
                                <div className="relative z-10 w-full max-w-[80%] space-y-3 opacity-80 group-hover:scale-105 transition-transform duration-500">
                                    <div className="h-4 w-1/3 bg-[#333] rounded mb-6"></div>
                                    <div className="h-2 w-full bg-[#333] rounded"></div>
                                    <div className="h-2 w-5/6 bg-[#333] rounded"></div>
                                    <div className="h-2 w-4/6 bg-[#333] rounded"></div>
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <div className="h-24 bg-[#333] rounded"></div>
                                        <div className="h-24 bg-[#333] rounded"></div>
                                        <div className="h-24 bg-[#333] rounded"></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-mono">
                                    {features[activeFeature].title} Preview
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
