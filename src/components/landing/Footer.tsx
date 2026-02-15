"use client";

import Link from 'next/link';
import { Bot, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-white border-t border-[#222] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

            <div className="max-w-[1920px] mx-auto px-6 py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="w-10 h-10 bg-[#F7D047] rounded-lg flex items-center justify-center text-black">
                                <Bot size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter">JUBOT</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
                            투자는 운이 아니라 기록입니다.<br />
                            데이터 기반의 주식 실습 노트, 주봇과 함께<br />
                            당신의 투자를 과학으로 만드세요.
                        </p>

                        {/* System Status Indicator */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#111] border border-[#333] rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-400 tracking-widest uppercase">
                                All Systems Operational
                            </span>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div className="space-y-6">
                        <h4 className="font-mono text-xs font-bold text-[#F7D047] uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-4 text-sm text-gray-400 font-medium">
                            <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                            <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="space-y-6">
                        <h4 className="font-mono text-xs font-bold text-[#F7D047] uppercase tracking-widest">Connect</h4>
                        <div className="flex gap-4">
                            <Link href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Twitter size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Github size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all">
                                <Linkedin size={18} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-[#222] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-mono">
                    <div>© 2026 JUBOT INC. ALL RIGHTS RESERVED.</div>
                    <div className="flex gap-8">
                        <Link href="/terms" className="hover:text-gray-400 transition-colors">TERMS OF SERVICE</Link>
                        <Link href="/privacy" className="hover:text-gray-400 transition-colors">PRIVACY POLICY</Link>
                    </div>
                </div>
            </div>

            {/* Huge Background Typography */}
            <div className="absolute -bottom-10 left-0 right-0 text-center pointer-events-none select-none overflow-hidden">
                <span className="text-[20vw] font-black text-[#111] leading-none tracking-tighter opacity-50">
                    JUBOT
                </span>
            </div>
        </footer>
    );
}
