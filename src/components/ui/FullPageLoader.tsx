"use client";

import React from 'react';
import { Bot } from 'lucide-react';

interface FullPageLoaderProps {
    message?: string;
}

export default function FullPageLoader({ message = "잠시만 기다려주세요..." }: FullPageLoaderProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 p-8 bg-[#1E1E1E] rounded-3xl shadow-2xl border border-[#333] max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
                {/* Animated Icon */}
                <div className="relative w-24 h-24">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 border-4 border-[#333] rounded-full"></div>
                    {/* Spinning Ring */}
                    <div className="absolute inset-0 border-4 border-[#F7D047] border-t-transparent rounded-full animate-spin"></div>
                    {/* Center Logo */}
                    <div className="absolute inset-0 flex items-center justify-center text-[#F7D047]">
                        <Bot size={40} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">잠시만 기다려주세요</h3>
                    <p className="text-sm text-gray-400 font-medium animate-pulse">{message}</p>
                </div>

                {/* Progress Bar (Decorative) */}
                <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-[#F7D047] w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
