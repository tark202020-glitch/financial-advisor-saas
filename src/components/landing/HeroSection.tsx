"use client";

import Link from 'next/link';
import { ArrowRight, Bot, TrendingUp, BarChart3, Search, Play } from 'lucide-react';
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
        <section className="relative min-h-[90vh] bg-white text-black overflow-hidden flex flex-col pt-24 text-black font-sans selection:bg-black selection:text-[#F7D047]">

            {/* Unicorn Studio Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-80" data-us-project="I3ce1qwYAbbqQdgYp5FS"></div>

            {/* Grid Overlay Texture (Optional) */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-l border-gray-200 bg-white/40 backdrop-blur-[2px]">

                    {/* Top Bar: Ticker / Branding */}
                    <div className="col-span-1 lg:col-span-12 border-b border-r border-gray-200 p-4 flex items-center justify-between overflow-hidden">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#F7D047]"></div>
                            <span className="text-xs font-mono uppercase tracking-widest text-gray-500">System Status: Online</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-8 animate-marquee whitespace-nowrap text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                            <span>AI Driven Analysis</span>
                            <span>•</span>
                            <span>Real-time Market Data</span>
                            <span>•</span>
                            <span>Portfolio Management</span>
                            <span>•</span>
                            <span>Smart Alerts</span>
                        </div>
                        <div className="text-xs font-mono font-bold">V1.220</div>
                    </div>

                    {/* Left Hero Content */}
                    <div className="col-span-1 lg:col-span-7 border-b border-r border-gray-200 p-6 sm:p-12 lg:p-16 flex flex-col justify-center relative group">
                        <div className="absolute top-0 left-0 p-2">
                            <Bot size={24} className="text-[#F7D047]" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter mb-8 uppercase break-keep">
                                AI Investment<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-gray-700 to-gray-500">Advisor.</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-lg md:text-xl font-medium text-gray-600 mb-10 max-w-lg leading-relaxed"
                        >
                            투자의 모든 순간을 기록하고, AI와 함께 성장하세요.<br />
                            데이터에 기반한 가장 확실한 투자 습관.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link href="/dashboard" className="px-8 py-4 bg-black text-white font-bold text-lg hover:bg-[#F7D047] hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black flex items-center gap-2 group">
                                시작하기
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/login" className="px-8 py-4 bg-transparent text-black font-bold text-lg border-2 border-black hover:bg-black hover:text-white transition-colors rounded-none">
                                로그인
                            </Link>
                        </motion.div>
                    </div>

                    {/* Center Visual / Feature Highlights (Right Side on Desktop) */}
                    <div className="col-span-1 lg:col-span-5 border-b border-r border-gray-200 flex flex-col">

                        {/* Feature 1 */}
                        <div className="flex-1 border-b border-gray-200 p-8 flex items-start gap-4 hover:bg-white/50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-[#F7D047] transition-colors">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">포트폴리오 정밀 진단</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    보유 종목의 리스크와 기회를 AI가 실시간으로 분석하여 최적의 비중을 제안합니다.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex-1 border-b border-gray-200 p-8 flex items-start gap-4 hover:bg-white/50 transition-colors group">
                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-[#F7D047] transition-colors">
                                <Search size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">스마트 조건 검색</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    원하는 조건의 저평가 우량주를 실시간으로 발굴하고 알림을 받아보세요.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 (Small Ticker) */}
                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-gray-400">MARKET PULSE</span>
                            <div className="flex gap-4">
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1">KOSPI ▼ 0.5%</span>
                                <span className="text-xs font-bold text-green-500 flex items-center gap-1">NASDAQ ▲ 1.2%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Strip / Tech Stack */}
                <div className="border border-t-0 border-gray-200 p-6 bg-white flex flex-wrap items-center justify-between gap-6">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase">Powered By</span>
                    <div className="flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder Logos / Tech Names */}
                        <span className="font-bold text-sm tracking-widest">KIS DEVELOPERS</span>
                        <span className="font-bold text-sm tracking-widest">OPENAI</span>
                        <span className="font-bold text-sm tracking-widest">SUPABASE</span>
                        <span className="font-bold text-sm tracking-widest">NEXT.JS</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
