"use client";

import { motion } from 'framer-motion';
import { Database, BrainCircuit, LineChart, RefreshCw } from 'lucide-react';

const steps = [
    {
        step: "01",
        label: "DATA INPUT",
        title: "루틴 형성",
        description: "시장 브리핑과 관심 종목 정리로\n하루 투자를 체계적으로 시작합니다.",
        icon: <Database className="w-6 h-6" />
    },
    {
        step: "02",
        label: "AI ANALYSIS",
        title: "AI 정밀 분석",
        description: "입력된 데이터와 시장 상황을 분석하여\n객관적인 투자 지표를 산출합니다.",
        icon: <BrainCircuit className="w-6 h-6" />
    },
    {
        step: "03",
        label: "EXECUTION",
        title: "원칙 매매",
        description: "감정이 아닌 데이터와 원칙에 기반하여\n매수하고 매도합니다.",
        icon: <LineChart className="w-6 h-6" />
    },
    {
        step: "04",
        label: "FEEDBACK",
        title: "복기 및 성장",
        description: "매매 결과를 기록하고 분석하여\n나만의 투자 알고리즘을 고도화합니다.",
        icon: <RefreshCw className="w-6 h-6" />
    }
];

export default function SolutionSection() {
    return (
        <section className="py-32 px-6 bg-gray-50 text-black border-t border-gray-200">
            <div className="max-w-[1920px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24">
                    <div>
                        <div className="inline-block px-3 py-1 bg-black text-white text-xs font-bold font-mono rounded-full mb-6">
                            PROCESS OPTIMIZATION
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                            From Chaos<br />
                            <span className="text-gray-400">To Clarity.</span>
                        </h2>
                    </div>
                    <p className="text-lg font-medium text-gray-500 max-w-md text-right md:text-left mt-8 md:mt-0 leading-relaxed break-keep">
                        주봇은 당신의 투자를 단순한 '감'의 영역에서<br />
                        '데이터 기반의 과학'으로 변화시킵니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-[60px] left-0 w-full h-[1px] bg-black/10 -z-10"></div>

                    {steps.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gray-50 group"
                        >
                            <div className="flex items-center gap-4 mb-6 bg-gray-50 pr-4">
                                <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center rounded-full group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300 shadow-sm">
                                    {item.icon}
                                </div>
                                <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-black transition-colors">STEP {item.step}</span>
                            </div>

                            <div className="pr-8">
                                <div className="font-mono text-[10px] font-bold text-[#F7D047] mb-2 uppercase tracking-wider">{item.label}</div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed break-keep">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
