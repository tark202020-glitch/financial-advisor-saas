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
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 border-b border-transparent hover:bg-white/50 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-black">
            <div className="w-3 h-3 bg-[#F7D047]"></div>
            <Bot strokeWidth={2.5} size={28} />
            <span>JUBOT</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2.5 font-bold text-sm bg-white/50 border border-black/10 hover:border-black hover:bg-black hover:text-white transition-all backdrop-blur-sm">
              LOG IN
            </Link>
            <Link href="/register" className="px-6 py-2.5 font-bold text-sm bg-black text-[#F7D047] border border-black hover:bg-[#F7D047] hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
              GET STARTED
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
      <footer className="bg-[#0A0A0A] border-t border-[#222] py-16 px-6 text-white">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
              <div className="w-3 h-3 bg-[#F7D047]"></div>
              <Bot strokeWidth={2.5} size={28} />
              <span>JUBOT</span>
            </div>
            <p className="text-gray-500 font-mono text-xs max-w-xs">
              SYSTEM: ONLINE<br />
              VERSION: 2.0.0 (BETA)<br />
              ALL SYSTEMS OPERATIONAL
            </p>
          </div>

          <div className="flex gap-8 text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">
            <Link href="#" className="hover:text-[#F7D047] transition-colors">Privacy_Protocol</Link>
            <Link href="#" className="hover:text-[#F7D047] transition-colors">Terms_Of_Service</Link>
            <Link href="#" className="hover:text-[#F7D047] transition-colors">Contact_Support</Link>
          </div>

          <div className="text-gray-600 text-xs font-mono">
            © 2026 Jubot Inc. | EST. 2024
          </div>
        </div>
      </footer>

    </div>
  );
}

