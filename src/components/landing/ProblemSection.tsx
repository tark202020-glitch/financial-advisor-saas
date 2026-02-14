"use client";

import { motion } from 'framer-motion';
import { HelpCircle, AlertTriangle, Newspaper } from 'lucide-react';

const problems = [
    {
        icon: <HelpCircle className="w-12 h-12 text-[#F7D047]" />,
        title: "내가 산 주식,\n왜 샀는지 아시나요?",
        description: "친구 말 듣고, 뉴스 보고 충동적으로 매수했다가 나중에 후회하신 적 없으신가요?"
    },
    {
        icon: <AlertTriangle className="w-12 h-12 text-[#F7D047]" />,
        title: "감으로 팔았다가\n후회한 적 없나요?",
        description: "명확한 매도 기준 없이 기분에 따라 팔고 나서 땅을 치고 후회하는 일이 반복됩니다."
    },
    {
        icon: <Newspaper className="w-12 h-12 text-[#F7D047]" />,
        title: "쏟아지는 뉴스,\n뭐부터 봐야 할까요?",
        description: "매일 수천 개의 기사가 쏟아지지만, 정작 내 종목에 중요한 뉴스는 놓치기 쉽습니다."
    }
];

export default function ProblemSection() {
    return (
        <section className="py-24 px-6 bg-[#121212] text-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold mb-6 break-keep"
                    >
                        투자가 어려운 이유,<br />
                        혹시 남의 이야기가 아닌가요?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-400 text-lg md:text-xl break-keep"
                    >
                        성공적인 투자를 방해하는 가장 큰 적은 '기록하지 않는 습관'입니다.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 hover:border-[#F7D047] transition-all duration-300 group"
                        >
                            <div className="mb-6 bg-[#252525] w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                {problem.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 whitespace-pre-line leading-tight text-white group-hover:text-[#F7D047] transition-colors">
                                {problem.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-normal break-keep">
                                {problem.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
