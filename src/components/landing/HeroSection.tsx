"use client";

import Link from 'next/link';
import { ArrowRight, Search, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function HeroSection() {
    useEffect(() => {
        const scriptId = 'unicorn-studio-script';

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js";
            script.onload = () => {
                if ((window as any).UnicornStudio) {
                    (window as any).UnicornStudio.init();
                }
            };
            document.head.appendChild(script);
        } else {
            if ((window as any).UnicornStudio) {
                (window as any).UnicornStudio.init();
            }
        }
    }, []);

    return (
        <section className="relative w-full h-screen overflow-hidden bg-white text-black flex flex-col justify-between p-6">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-multiply" data-us-project="I3ce1qwYAbbqQdgYp5FS"></div>

            {/* Top Navigation */}
            <header className="relative z-10 w-full flex justify-between items-start">
                {/* Left Logo - Keeping it minimal as requested */}
                <div className="hidden md:block">
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-auto">
                    <Link href="/login" className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-[#F7D047] transition-all text-xs font-bold flex items-center gap-2 bg-white/50 backdrop-blur-sm">
                        시작하기 <ArrowRight size={14} />
                    </Link>
                    <button className="w-10 h-10 border border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#F7D047] transition-all bg-white/50 backdrop-blur-sm">
                        <Search size={16} />
                    </button>
                    <button className="w-10 h-10 border border-black rounded-full flex items-center justify-center hover:bg-black hover:text-[#F7D047] transition-all bg-white/50 backdrop-blur-sm md:hidden">
                        <Menu size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content - Centered Massive Text */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center select-none pointer-events-none">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="relative"
                >
                    <h1 className="text-[22vw] leading-[0.75] font-black tracking-tighter text-center text-black mix-blend-overlay">
                        Jubot
                    </h1>
                    {/* Duplicate specifically for visual weight */}
                    <h1 className="text-[22vw] leading-[0.75] font-black tracking-tighter text-center text-black absolute inset-0 z-[-1] opacity-50">
                        Jubot
                    </h1>

                    <span className="absolute top-4 right-[-2vw] text-xl md:text-4xl font-black tracking-tighter">TM</span>
                </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="relative z-10 w-full flex flex-col items-center gap-12 pb-8">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-lg md:text-2xl font-medium text-center max-w-xl text-gray-900 leading-relaxed mix-blend-hard-light whitespace-pre-line"
                >
                    당신의 데이터에 기반한 AI 투자 전략.<br className="hidden md:block" />
                    심플하고, 투명하며, 강력합니다.
                </motion.p>

                {/* Floating Navigation Pill */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-[#222]/90 text-gray-300 backdrop-blur-md px-1.5 py-1.5 rounded-full flex flex-wrap justify-center gap-1 items-center shadow-2xl"
                >
                    {[
                        { name: '대시보드', href: '/dashboard' },
                        { name: '포트폴리오', href: '/portfolio' },
                        { name: '인사이트', href: '/insights' },
                        { name: '조건검색', href: '/condition-search' },
                        { name: '매매일지', href: '/memo' }
                    ].map((item) => (
                        <Link href={item.href} key={item.name} className="px-6 py-2.5 hover:bg-white hover:text-black rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all">
                            {item.name}
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
