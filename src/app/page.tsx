import Link from 'next/link';
import { Bot } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import FeatureSection from '@/components/landing/FeatureSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-[#F7D047]">



      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <SocialProofSection />
        <CTASection />
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}

