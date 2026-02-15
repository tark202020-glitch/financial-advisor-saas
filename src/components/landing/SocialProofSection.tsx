"use client";

import { motion } from 'framer-motion';

const reviews = [
    {
        user: "User_KIM",
        status: "VERIFIED",
        msg: "매매일지 기록이 정말 편합니다. 복기하는 습관이 생겼어요.",
        profit: "+15.4%"
    },
    {
        user: "Trader_LEE",
        status: "VERIFIED",
        msg: "포트폴리오 분석 덕분에 리스크 관리가 쉬워졌습니다.",
        profit: "+8.2%"
    },
    {
        user: "Investor_PARK",
        status: "VERIFIED",
        msg: "뇌동매매가 확실히 줄었습니다. 매수 전 한 번 더 생각하게 됩니다.",
        profit: "+21.0%"
    },
    {
        user: "Analyst_CHOI",
        status: "VERIFIED",
        msg: "데일리 브리핑으로 아침 시간을 획기적으로 줄였습니다.",
        profit: "TIME_SAVED"
    },
    {
        user: "User_JUNG",
        status: "VERIFIED",
        msg: "조건검색으로 찾은 종목 수익률이 기대 이상입니다.",
        profit: "+12.7%"
    },
];

export default function SocialProofSection() {
    return (
        <section className="py-24 bg-white border-t border-gray-200 overflow-hidden">
            <div className="max-w-[1920px] mx-auto mb-12 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm font-bold tracking-widest text-black uppercase">
                        LIVE USER FEEDBACK
                    </span>
                </div>
            </div>

            {/* Marquee Container */}
            <div className="relative w-full flex overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...reviews, ...reviews, ...reviews].map((review, index) => (
                        <div key={index} className="inline-block mx-4 p-6 border border-black bg-white hover:bg-black hover:text-white transition-colors duration-300 min-w-[350px] group">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-200 group-hover:border-gray-700 pb-2">
                                <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-gray-500">{review.user}</span>
                                <span className="font-mono text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full group-hover:bg-green-900 group-hover:text-green-300">
                                    {review.status}
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed whitespace-normal break-keep mb-6 h-12 flex items-center">
                                "{review.msg}"
                            </p>
                            <div className="flex justify-end">
                                <span className="font-mono text-xs font-bold text-black bg-[#F7D047] px-2 py-1">
                                    RESULT: {review.profit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex animate-marquee2 whitespace-nowrap absolute top-0 left-0">
                    {[...reviews, ...reviews, ...reviews].map((review, index) => (
                        <div key={index} className="inline-block mx-4 p-6 border border-black bg-white hover:bg-black hover:text-white transition-colors duration-300 min-w-[350px] group">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-200 group-hover:border-gray-700 pb-2">
                                <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-gray-500">{review.user}</span>
                                <span className="font-mono text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full group-hover:bg-green-900 group-hover:text-green-300">
                                    {review.status}
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed whitespace-normal break-keep mb-6 h-12 flex items-center">
                                "{review.msg}"
                            </p>
                            <div className="flex justify-end">
                                <span className="font-mono text-xs font-bold text-black bg-[#F7D047] px-2 py-1">
                                    RESULT: {review.profit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
