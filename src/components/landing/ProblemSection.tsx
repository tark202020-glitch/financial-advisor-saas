"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, SearchX } from 'lucide-react';

const problems = [
    {
        id: "ERR_01",
        label: "IMPULSE_BUYING",
        icon: <AlertTriangle className="w-12 h-12 text-[#FF4D4D]" />,
        title: "왜 샀는지 모르는\n묻지마 투자",
        description: "친구 말 듣고, 뉴스 보고 충동적으로 매수했다가\n주가가 떨어지면 그제서야 기업을 공부하기 시작합니다.",
        severity: "CRITICAL"
    },
    {
        id: "ERR_02",
        label: "NO_EXIT_STRATEGY",
        icon: <TrendingDown className="w-12 h-12 text-[#FF4D4D]" />,
        title: "감으로 팔고\n후회하는 매도",
        description: "명확한 원칙 없이 기분에 따라 팔고 나서\n급등하는 차트를 보며 땅을 치고 후회합니다.",
        severity: "HIGH"
    },
    {
        id: "ERR_03",
        label: "INFORMATION_OVERLOAD",
        icon: <SearchX className="w-12 h-12 text-[#FF4D4D]" />,
        title: "쏟아지는 뉴스,\n소음과 정보의 혼동",
        description: "매일 수천 개의 기사가 쏟아지지만,\n정작 내 계좌에 도움이 되는 핵심 정보는 놓치고 있습니다.",
        severity: "MODERATE"
    }
];

export default function ProblemSection() {
    return (
        <section className="py-32 px-6 bg-[#111] text-white">
            <div className="max-w-[1920px] mx-auto">
                <div className="mb-24 flex flex-col items-start">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-[#FF4D4D] rounded-full animate-pulse"></div>
                        <span className="text-[#FF4D4D] font-mono text-sm font-bold tracking-widest uppercase">System Diagnosis</span>
                    </div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase"
                    >
                        Investment<br />
                        <span className="text-gray-600">Errors.</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t border-[#333]">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative border-b border-[#333] lg:border-r last:border-r-0 border-[#333] p-12 hover:bg-[#1E1E1E] transition-colors duration-500 group flex flex-col justify-between min-h-[500px] overflow-hidden"
                        >
                            {/* Spotlight Effect */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,100,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <span className="font-mono text-lg font-bold opacity-30 group-hover:opacity-100 group-hover:text-[#FF4D4D] transition-all text-gray-500">
                                        {problem.id}
                                    </span>
                                    <div className="group-hover:scale-110 transition-transform duration-500">
                                        {problem.icon}
                                    </div>
                                </div>

                                <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight whitespace-pre-line group-hover:text-[#FF4D4D] transition-colors text-white">
                                    {problem.title}
                                </h3>

                                <p className="text-lg text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed break-keep">
                                    {problem.description}
                                </p>
                            </div>

                            <div className="mt-12 pt-6 border-t border-[#333] group-hover:border-[#555] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <span className="font-mono text-xs tracking-widest text-gray-500">SEVERITY LEVEL</span>
                                <span className="font-mono text-xs font-bold text-[#FF4D4D]">{problem.severity}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
