"use client";

import React from 'react';

interface FullPageLoaderProps {
    message?: string;
}

export default function FullPageLoader({ message = "데이터를 불러오는 중입니다..." }: FullPageLoaderProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
                {/* Animated Icon */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                    </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">잠시만 기다려주세요</h3>
                    <p className="text-sm text-slate-500 font-medium animate-pulse">{message}</p>
                </div>

                {/* Progress Bar (Decorative) */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
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
