"use client";

import Link from 'next/link';
import { ArrowRight, Power, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
    return (
        <section className="py-32 px-6 bg-[#F7D047] text-black relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '60px 60px' }}></div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 border-2 border-black px-4 py-1 rounded-full bg-white mb-8"
                >
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="font-mono font-bold text-xs tracking-widest uppercase">System Ready</span>
                </motion.div>

                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase break-keep">
                    Protocol<br />
                    Initiated.
                </h2>

                <p className="text-xl md:text-2xl font-bold mb-12 max-w-2xl mx-auto leading-relaxed border-l-4 border-black pl-6 text-left md:text-center md:border-none md:pl-0">
                    성공한 투자자들의 기록 습관,<br />
                    지금 바로 당신의 시스템에 설치하세요.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Link
                        href="/dashboard"
                        className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 bg-black text-white text-xl font-bold uppercase tracking-wider overflow-hidden transition-all hover:bg-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Power size={24} className="group-hover:text-[#F7D047] transition-colors" />
                            Initialize System
                        </span>
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-[#222] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left z-0"></div>
                    </Link>

                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-12 py-6 bg-transparent text-black border-4 border-black text-xl font-bold uppercase tracking-wider hover:bg-black hover:text-[#F7D047] transition-all"
                    >
                        <Terminal size={24} />
                        Access Login
                    </Link>
                </div>

                <div className="mt-16 pt-8 border-t-2 border-black/10 flex justify-center gap-8 text-xs font-mono font-bold opacity-60">
                    <span>STATUS: WAITING_FOR_INPUT</span>
                    <span>VERSION: 2.0.0</span>
                    <span>SECURE_CONNECTION</span>
                </div>
            </div>
        </section>
    );
}
