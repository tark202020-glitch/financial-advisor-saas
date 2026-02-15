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

        // Remove Unicorn Studio Badge
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        if (node.innerText.includes('Made with unicorn.studio') || (node.tagName === 'A' && (node as HTMLAnchorElement).href.includes('unicorn.studio'))) {
                            node.style.display = 'none';
                            node.remove();
                        }
                        // Check children
                        const badges = node.querySelectorAll('a[href*="unicorn.studio"], .us-branding');
                        badges.forEach(badge => {
                            (badge as HTMLElement).style.display = 'none';
                            badge.remove();
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Cleanup
        return () => observer.disconnect();
    }, []);

    return (
        <section className="relative w-full h-screen overflow-hidden bg-black text-white flex flex-col justify-between">
            {/* Background Layer: Unicorn Studio + Aurora Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                {/* Unicorn Studio Canvas */}
                <div className="absolute inset-0 opacity-60 mix-blend-screen" data-us-project="I3ce1qwYAbbqQdgYp5FS"></div>

                {/* Aurora Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none"></div>

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
            </div>

            {/* Sticky Glassmorphic Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-black/5 backdrop-blur-sm border-b border-white/5 transition-all duration-300">
                {/* Left Logo */}
                <div className="hidden md:block">
                    <span className="font-black text-lg tracking-tighter mix-blend-difference">JUBOT</span>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-auto">
                    <Link href="/login" className="px-6 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all text-xs font-bold flex items-center gap-2 bg-black/20 backdrop-blur-md">
                        시작하기 <ArrowRight size={14} />
                    </Link>
                    <button className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md text-white">
                        <Search size={16} />
                    </button>
                    <button className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all bg-black/20 backdrop-blur-md md:hidden text-white">
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
                    <h1 className="text-[22vw] leading-[0.75] font-black tracking-tighter text-center text-white mix-blend-overlay opacity-80 animate-pulse">
                        Jubot
                    </h1>
                    {/* Duplicate specifically for visual weight & texture */}
                    <h1 className="text-[22vw] leading-[0.75] font-black tracking-tighter text-center text-white absolute inset-0 z-[-1] opacity-10 blur-sm">
                        Jubot
                    </h1>
                </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="relative z-10 w-full flex flex-col items-center gap-12 pb-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="relative max-w-4xl px-8 py-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                    <p className="text-xl md:text-3xl font-bold text-center text-gray-200 leading-relaxed whitespace-pre-line drop-shadow-lg">
                        <span className="text-white font-black">"투자는 운이 아니라 기록입니다."</span><br className="hidden md:block" />
                        매일 쓰고, AI와 분석하는 나만의 주식 실습 노트 <span className="text-[#F7D047] bg-white/10 border border-[#F7D047]/20 px-2 py-0.5 rounded-md inline-block transform -skew-x-12 ml-1 shadow-[0_0_15px_rgba(247,208,71,0.3)]">주봇</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
