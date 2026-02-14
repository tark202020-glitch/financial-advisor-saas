"use client";

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function SocialProofSection() {
    return (
        <section className="py-24 px-6 bg-white text-black">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black mb-4">투자자들의 변화</h2>
                    <p className="text-xl text-gray-600">주봇과 함께 성장하고 있는 투자자들의 이야기입니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Testimonial Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-gray-50 border border-gray-100 p-8 rounded-2xl relative"
                    >
                        <Quote className="absolute top-8 left-8 text-gray-200 w-12 h-12 -z-0" />
                        <div className="relative z-10">
                            <p className="text-xl font-medium leading-relaxed mb-6 text-gray-800 break-keep">
                                "주봇 사용 3개월 만에 뇌동매매 습관을 고치고 수익률 안정을 찾았습니다.
                                특히 **매수 이유를 적는 습관**이 제 투자를 완전히 바꿨어요."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-500">
                                    K
                                </div>
                                <div>
                                    <div className="font-bold">김OO 님</div>
                                    <div className="text-sm text-gray-500">직장인 / 주식 경력 3년</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Use Case Example Mockup */}
                    <div className="bg-[#121212] text-white p-8 rounded-2xl flex flex-col justify-center border border-gray-800 shadow-xl">
                        <div className="text-xs font-mono text-[#F7D047] mb-2">실제 주식 일지 기록 예시</div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <h4 className="text-lg font-bold">삼성전자</h4>
                                <span className="text-red-400 font-bold">+12.5%</span>
                            </div>
                            <div className="bg-[#1E1E1E] p-4 rounded-lg text-sm border border-[#333]">
                                <div className="text-gray-400 text-xs mb-1">매수 이유</div>
                                <p>반도체 업황 턴어라운드 예상 및 외국인 수급 연속 유입 확인.</p>
                            </div>
                            <div className="bg-[#1E1E1E] p-4 rounded-lg text-sm border border-[#333]">
                                <div className="text-gray-400 text-xs mb-1">매도 목표</div>
                                <p>전고점 85,000원 돌파 시 분할 매도 시작.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
