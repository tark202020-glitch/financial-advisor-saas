"use client";

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function SolutionSection() {
    return (
        <section className="py-24 px-6 bg-white text-black overflow-hidden relative">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block bg-black text-[#F7D047] font-bold px-6 py-2 rounded-full text-sm mb-8"
                >
                    OUR SOLUTION
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-black text-center mb-10 leading-tight break-keep"
                >
                    주봇은 답을 알려주지 않습니다.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">답을 찾는 과정</span>을 함께 합니다.
                </motion.h2>

                <p className="text-xl md:text-2xl text-gray-600 text-center max-w-3xl mb-16 font-medium break-keep leading-relaxed">
                    매일의 경제 지표 공부부터 매매 기록 분석까지,<br />
                    주봇은 당신의 <strong>투자 근육</strong>을 키워주는 페이스메이커입니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    <SolutionCard
                        title="투자 루틴 형성"
                        desc="매일 아침 시장 브리핑과 함께 하루를 시작하는 습관을 만들어드립니다."
                    />
                    <SolutionCard
                        title="데이터 기반 의사결정"
                        desc="감정이 아닌, 기업의 재무 데이터와 나의 기록을 바탕으로 결정합니다."
                    />
                    <SolutionCard
                        title="매매 원칙 확립"
                        desc="매수/매도 이유를 기록하며 성공적인 투자를 위한 나만의 원칙을 세웁니다."
                    />
                    <SolutionCard
                        title="지속 가능한 성장"
                        desc="성공도 실패도 모두 자산이 됩니다. 복기하며 더 나은 투자자로 성장합니다."
                    />
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>
        </section>
    );
}

function SolutionCard({ title, desc }: { title: string, desc: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl hover:border-black/5 transition-all duration-300 group"
        >
            <CheckCircle2 className="w-8 h-8 text-black shrink-0 group-hover:scale-110 transition-transform" />
            <div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed break-keep">{desc}</p>
            </div>
        </motion.div>
    )
}
