import Link from 'next/link';
import { Bot } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import FeatureSection from '@/components/landing/FeatureSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import CTASection from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-[#F7D047]">

      {/* Navigation (Transparent/Floating) */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-black">
            <Bot strokeWidth={2.5} size={32} />
            <span>JUBOT</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-5 py-2.5 font-bold text-sm bg-black/5 hover:bg-black/10 rounded-full transition backdrop-blur-sm">
              로그인
            </Link>
            <Link href="/register" className="px-6 py-2.5 font-bold text-sm bg-black text-[#F7D047] rounded-full hover:scale-105 transition shadow-lg">
              회원가입
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <SocialProofSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6 text-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-black text-xl">
            <Bot size={24} />
            <span>JUBOT</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-500">
            <Link href="#" className="hover:text-black">개인정보처리방침</Link>
            <Link href="#" className="hover:text-black">이용약관</Link>
            <Link href="#" className="hover:text-black">문의하기</Link>
          </div>
          <div className="text-slate-400 text-sm font-bold">
            © 2026 Jubot Inc.
          </div>
        </div>
      </footer>

    </div>
  );
}

