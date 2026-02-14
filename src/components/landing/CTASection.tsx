"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
    return (
        <section className="py-24 px-6 bg-[#F7D047] text-black">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight break-keep">
                    성공한 투자자들은<br />
                    모두 기록합니다.
                </h2>
                <p className="text-xl md:text-2xl font-bold mb-12 break-keep">
                    당신의 기록은 언제 시작되나요?<br />
                    지금 바로 주봇과 함께 1%의 습관을 만드세요.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-black text-white rounded-2xl text-xl font-bold shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                    >
                        지금 바로 주봇 시작하기 <ArrowRight strokeWidth={3} />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-black border-2 border-black rounded-2xl text-xl font-bold hover:bg-gray-100 transition-all"
                    >
                        로그인하기
                    </Link>
                </div>

                <p className="mt-8 text-sm font-bold opacity-70">
                    * 별도의 설치 없이 웹에서 바로 시작할 수 있습니다.
                </p>
            </div>
        </section>
    );
}
