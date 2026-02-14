"use client";

import { useState } from 'react';
import { Bot, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JubotPageGuideProps {
    guideText: string;
    className?: string; // For additional styling/positioning
}

export default function JubotPageGuide({ guideText, className }: JubotPageGuideProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("relative inline-block ml-2", className)}>
            {/* Trigger Button (Jubot Icon) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                    isOpen
                        ? "bg-[#F7D047] text-black shadow-[0_0_15px_rgba(247,208,71,0.5)] scale-110"
                        : "bg-[#252525] text-gray-400 hover:text-[#F7D047] hover:bg-[#333]"
                )}
                title="이 페이지에 대해 주봇에게 물어보기"
            >
                {isOpen ? <X size={18} strokeWidth={2.5} /> : <Bot size={20} />}
            </button>

            {/* Tooltip / Bubble */}
            {isOpen && (
                <div className="absolute top-10 left-0 sm:left-auto sm:-right-2 z-[50] w-[280px] sm:w-[320px] animate-in fade-in zoom-in-95 duration-200 origin-top-left sm:origin-top-right">
                    <div className="relative bg-[#1E1E1E] border border-[#F7D047]/30 rounded-2xl p-4 shadow-xl shadow-black/50">
                        {/* Triangle Indicator */}
                        <div className="absolute -top-2 left-3 sm:left-auto sm:right-3 w-4 h-4 bg-[#1E1E1E] border-t border-l border-[#F7D047]/30 transform rotate-45"></div>

                        <div className="flex gap-3">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-[#F7D047]/10 flex items-center justify-center border border-[#F7D047]/30">
                                    <Bot size={18} className="text-[#F7D047]" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#F7D047] flex items-center gap-1">
                                    주봇 가이드
                                </h4>
                                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line break-keep">
                                    {guideText}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
