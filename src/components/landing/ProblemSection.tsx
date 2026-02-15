"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, FileWarning, SearchX } from 'lucide-react';

const problems = [
    {
        id: "ERR_001",
        label: "IMPULSE_BUYING_DETECTED",
        icon: <AlertTriangle className="w-8 h-8 text-[#FF4D4D]" />,
        title: "내가 산 주식,\n왜 샀는지 아시나요?",
        description: "친구 말 듣고, 뉴스 보고 충동적으로 매수했다가\n나중에 후회하신 적 없으신가요?",
        status: "CRITICAL"
    },
    {
        id: "ERR_002",
        label: "NO_EXIT_STRATEGY",
        icon: <TrendingDown className="w-8 h-8 text-[#FF4D4D]" />,
        title: "감으로 팔았다가\n후회한 적 없나요?",
        description: "명확한 매도 기준 없이 기분에 따라 팔고 나서\n땅을 치고 후회하는 일이 반복됩니다.",
        status: "WARNING"
    },
    {
        id: "ERR_003",
        label: "INFORMATION_OVERLOAD",
        icon: <SearchX className="w-8 h-8 text-[#FF4D4D]" />,
        title: "쏟아지는 뉴스,\n뭐부터 봐야 할까요?",
        description: "매일 수천 개의 기사가 쏟아지지만,\n정작 내 종목에 중요한 뉴스는 놓치기 쉽습니다.",
        status: "OVERFLOW"
    }
];

export default function ProblemSection() {
    return (
        <section className="py-24 px-6 bg-[#0A0A0A] text-white border-t border-[#222]">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-pulse"></div>
                            <span className="text-[#FF4D4D] font-mono text-xs tracking-widest uppercase">System Diagnosis</span>
                        </div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none"
                        >
                            Investor<br />
                            <span className="text-gray-600">Common Errors.</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-400 font-mono text-sm md:text-base max-w-md text-right md:text-left"
                    >
                        &gt; DIAGNOSTIC_TOOL_RUNNING...<br />
                        &gt; ANALYZING_INVESTMENT_PATTERNS...<br />
                        <span className="text-[#FF4D4D]">&gt; 3_CRITICAL_ISSUES_FOUND</span>
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-[#111] border border-[#222] p-8 hover:border-[#FF4D4D] transition-all duration-300 group relative overflow-hidden"
                        >
                            {/* Decorative Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-[#1A1A1A] rounded-sm group-hover:bg-[#2A1111] transition-colors">
                                            {problem.icon}
                                        </div>
                                        <span className="font-mono text-[10px] text-[#FF4D4D] border border-[#FF4D4D]/30 px-2 py-1 bg-[#FF4D4D]/5">
                                            {problem.id}
                                        </span>
                                    </div>

                                    <div className="font-mono text-xs text-gray-500 mb-2 tracking-wider">
                                        // {problem.label}
                                    </div>

                                    <h3 className="text-xl font-bold mb-4 whitespace-pre-line leading-tight text-white group-hover:text-[#FF4D4D] transition-colors">
                                        {problem.title}
                                    </h3>

                                    <p className="text-gray-400 text-sm leading-relaxed font-medium break-keep">
                                        {problem.description}
                                    </p>
                                </div>

                                <div className="mt-8 pt-4 border-t border-[#222] flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-mono text-gray-500">SEVERITY:</span>
                                    <span className="text-[10px] font-mono font-bold text-[#FF4D4D]">{problem.status}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
