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
                    투자는 운이 아니라 기록입니다.<br className="hidden md:block" />
                    매일 쓰고, 복기하고, AI와 분석하는 나만의 주식 실습 노트 '주봇'
                </motion.p>

                {/* Floating Navigation Pill Removed */}
            </div>
        </section>
    );
}
