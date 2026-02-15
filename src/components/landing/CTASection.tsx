"use client";

import Link from 'next/link';
import { ArrowRight, Power } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
    return (
        <section className="py-32 px-6 bg-black text-white relative overflow-hidden flex items-center justify-center min-h-[600px]">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>

            <div className="max-w-5xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
                        READY TO<br />
                        <span className="text-[#F7D047]">UPGRADE?</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed break-keep">
                        감에 의존하는 투자는 이제 그만두세요.<br />
                        데이터와 시스템이 당신의 자산을 지킵니다.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            href="/dashboard"
                            className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 bg-[#F7D047] text-black text-xl font-bold uppercase tracking-wider overflow-hidden transition-all hover:bg-[#ffe175] hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Power size={24} />
                                주봇 시작하기
                            </span>
                        </Link>

                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-12 py-6 bg-transparent text-white border border-gray-700 text-xl font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
                        >
                            로그인
                            <ArrowRight size={24} />
                        </Link>
                    </div>

                    <p className="mt-12 text-sm text-gray-600 font-mono tracking-widest uppercase">
                        Secure System • Data Encryption • 24/7 Monitoring
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
