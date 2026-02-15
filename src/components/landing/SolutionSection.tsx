"use client";

import { motion } from 'framer-motion';
import { GitCommit, Cpu, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SolutionSection() {
    return (
        <section className="py-24 px-6 bg-white text-black overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col items-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
                        <span className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase">System Optimization</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black text-center mb-10 leading-[0.9] tracking-tighter break-keep"
                    >
                        We Don't Just Give Answers.<br />
                        <span className="text-gray-400">We Optimize the Process.</span>
                    </motion.h2>

                    <p className="text-lg md:text-xl text-gray-600 text-center max-w-2xl font-medium break-keep leading-relaxed border-l-4 border-[#F7D047] pl-6">
                        주봇은 당신의 투자 프로세스를 디버깅하고,<br />
                        데이터 기반의 의사결정 알고리즘을 구축합니다.
                    </p>
                </div>

                {/* Process Flow Layout */}
                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[50%] left-0 w-full h-[2px] bg-gray-200 -z-10 -translate-y-[50%]"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SolutionCard
                            step="01"
                            title="Routine Input"
                            subtitle="투자 루틴 형성"
                            desc="시장 브리핑과 함께 하루를 시작하는 데이터 인풋 프로세스"
                            icon={<GitCommit className="w-6 h-6" />}
                        />
                        <SolutionCard
                            step="02"
                            title="Data Processing"
                            subtitle="데이터 기반 의사결정"
                            desc="재무 데이터와 기록을 바탕으로 감정을 배제한 연산"
                            icon={<Cpu className="w-6 h-6" />}
                        />
                        <SolutionCard
                            step="03"
                            title="Logic Execution"
                            subtitle="매매 원칙 확립"
                            desc="매수/매도 이유를 기록하고 나만의 투자 알고리즘 실행"
                            icon={<BarChart3 className="w-6 h-6" />}
                        />
                        <SolutionCard
                            step="04"
                            title="System Upgrade"
                            subtitle="지속 가능한 성장"
                            desc="데이터 복기를 통해 투자 모델을 지속적으로 업데이트"
                            icon={<ShieldCheck className="w-6 h-6" />}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SolutionCard({ step, title, subtitle, desc, icon }: { step: string, title: string, subtitle: string, desc: string, icon: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="bg-white border text-left border-gray-200 p-6 h-full flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 group relative"
        >
            {/* Hover Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

            <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-gray-400">STEP_{step}</span>
                    <div className="text-gray-300 group-hover:text-black transition-colors">
                        {icon}
                    </div>
                </div>
                <h3 className="text-sm font-mono font-bold text-black mb-1 uppercase tracking-wider">{title}</h3>
                <h4 className="text-lg font-bold text-gray-800 mb-4">{subtitle}</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed break-keep border-t border-gray-100 pt-4">
                    {desc}
                </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400 group-hover:text-[#F7D047] transition-colors">
                <span>EXECUTE_NODE</span>
                <ArrowRight className="w-3 h-3" />
            </div>
        </motion.div>
    )
}
