"use client";

import Link from 'next/link';
import { ArrowRight, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
    return (
        <section className="relative bg-[#F7D047] text-black pt-28 pb-32 sm:pt-40 sm:pb-48 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto text-center relative z-10">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block px-4 py-1.5 rounded-full border-2 border-black font-bold text-xs uppercase tracking-wider mb-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                    AI 투자의 새로운 기준
                </motion.div>

                {/* Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 break-keep"
                >
                    쓰기 좋아 하는<br />
                    당신을 위한 투자 기록 노트<span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">.</span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-10 leading-tight break-keep"
                >
                    종목 추천만 기다리는 투자는 이제 그만.<br className="hidden sm:block" />
                    스스로 기록하며 <span className="bg-black text-white px-1">확신</span>을 가지는 투자자가 되세요.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Link href="/dashboard" className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-black text-white rounded-2xl text-lg sm:text-xl font-bold shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                        내 투자 기록 시작하기 <ArrowRight strokeWidth={3} />
                    </Link>
                </motion.div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-16 sm:mt-24 relative mx-auto max-w-5xl"
                >
                    <div className="rounded-xl bg-[#121212] p-2 sm:p-4 shadow-2xl border border-gray-800">
                        {/* Browser Bar */}
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="flex-1 bg-[#252525] h-6 rounded-md ml-4"></div>
                        </div>
                        {/* Content Area - Animated Image */}
                        <div className="aspect-[16/10] bg-[#1E1E1E] rounded-lg border border-[#333] relative overflow-hidden w-full">
                            <motion.img
                                src="/images/dashboard_ALL.png"
                                alt="Jubot Dashboard"
                                className="w-full object-cover object-top"
                                initial={{ y: "0%" }}
                                animate={{ y: "-65%" }}
                                transition={{
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    duration: 15,
                                    ease: "linear"
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-20 opacity-10 hidden lg:block pointer-events-none">
                <div className="w-96 h-96 rounded-full border-[20px] border-black"></div>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 -mr-20 opacity-10 hidden lg:block pointer-events-none">
                <div className="w-96 h-96 bg-black rotate-45"></div>
            </div>
        </section>
    );
}
