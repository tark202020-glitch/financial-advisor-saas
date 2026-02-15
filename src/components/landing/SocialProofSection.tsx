"use client";

import { motion } from 'framer-motion';
import { Quote, Terminal, CheckCircle2 } from 'lucide-react';

export default function SocialProofSection() {
    return (
        <section className="py-24 px-6 bg-white text-black border-t border-gray-200 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-4 bg-gray-100 px-3 py-1 rounded-sm">
                        <Terminal size={14} className="text-gray-500" />
                        <span className="font-mono text-xs text-gray-500">USER_DATABASE_ACCESS</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        Investor Protocol<br />
                        <span className="text-gray-400">Successfully Executed.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Testimonial Card (Log Style) */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white border border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative group overflow-hidden"
                    >
                        {/* Header Bar */}
                        <div className="border-b border-black p-3 bg-gray-50 flex justify-between items-center">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                            </div>
                            <span className="font-mono text-xs font-bold text-gray-500">LOG_ID: #8829-A</span>
                        </div>

                        <div className="p-8">
                            <Quote className="text-gray-200 w-12 h-12 mb-4" />
                            <p className="text-lg font-medium leading-relaxed mb-8 text-black break-keep font-mono">
                                &gt; "주봇 사용 3개월 만에 뇌동매매 습관을 고치고 수익률 안정을 찾았습니다. <span className="bg-[#F7D047] px-1">매수 이유를 적는 습관</span>이 제 투자를 완전히 바꿨어요."
                            </p>

                            <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold font-mono text-sm">
                                    KIM
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm uppercase tracking-wider">User_Kim_001</span>
                                    <span className="text-xs text-gray-500 font-mono">EXP: 3_YEARS | STATUS: PROFITABLE</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Use Case Example Mockup (Code Editor Style) */}
                    <div className="bg-[#1E1E1E] text-white p-6 rounded-lg font-mono text-sm border border-black shadow-xl relative overflow-hidden flex flex-col">
                        {/* Line Numbers Background */}
                        <div className="absolute top-0 left-0 bottom-0 w-8 bg-[#252525] border-r border-[#333] z-0"></div>

                        <div className="relative z-10 pl-4 space-y-4">
                            <div className="text-gray-500 text-xs mb-4">
                                // TRADING_JOURNAL_ENTRY.json
                            </div>

                            <div className="space-y-1">
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">1</span>
                                    <span className="text-purple-400">{"{"}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">2</span>
                                    <span className="ml-4 text-blue-400">"stock"</span>: <span className="text-[#F7D047]">"Samsung Electronics"</span>,
                                </div>
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">3</span>
                                    <span className="ml-4 text-blue-400">"profit"</span>: <span className="text-green-400">"+12.5%"</span>,
                                </div>
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">4</span>
                                    <span className="ml-4 text-blue-400">"reason"</span>: <span className="text-gray-300">"Semiconductor sector turnaround..."</span>,
                                </div>
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">5</span>
                                    <span className="ml-4 text-blue-400">"target"</span>: <span className="text-gray-300">"Breakout above 85,000 KRW"</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-600 w-6 text-right mr-4 select-none">6</span>
                                    <span className="text-purple-400">{"}"}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-green-500 text-xs">
                                <CheckCircle2 size={12} />
                                <span>ANALYSIS_COMPLETE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
