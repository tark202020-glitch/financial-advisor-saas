import Link from 'next/link';
import {
  ArrowRight, Bot, TrendingUp, Zap,
  BarChart3, PieChart, LineChart,
  Smartphone, Search, ShieldCheck
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-[#F7D047]">

      {/* 1. Hero Section (Bright Yellow) */}
      <section className="bg-[#F7D047] text-black pt-8 pb-20 px-6 relative overflow-hidden">
        {/* Navbar Placeholder */}
        <nav className="max-w-7xl mx-auto flex items-center justify-between py-6 mb-12 lg:mb-20">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
            <Bot strokeWidth={2.5} size={32} />
            <span>JUBOT</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-5 py-2.5 font-bold text-sm bg-black/5 hover:bg-black/10 rounded-full transition">
              Log In
            </Link>
            <Link href="/register" className="px-6 py-2.5 font-bold text-sm bg-black text-[#F7D047] rounded-full hover:scale-105 transition shadow-lg">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border-2 border-black font-bold text-xs uppercase tracking-wider mb-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            UI meets AI Investment
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter mb-8">
            INVEST<br />
            SMARTER<span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">.</span>
          </h1>

          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-10 leading-tight">
            One Prompt. Infinite Outcomes. <br />
            Jubot turns your chaotic stock notes into crystal-clear profit insights.
          </p>

          <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl text-xl font-bold shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
            Start Building Wealth <ArrowRight strokeWidth={3} />
          </Link>
        </div>

        {/* Decorative Graphic Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-20 opacity-50 hidden lg:block">
          <BarChart3 size={300} strokeWidth={1} />
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 -mr-20 opacity-50 hidden lg:block">
          <PieChart size={300} strokeWidth={1} />
        </div>
      </section>


      {/* 2. Core Features (Deep Charcoal Bento Grid) */}
      <section className="bg-[#121212] text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              One Tool.<br />
              Infinite Possibilities.
            </h2>
            <p className="text-gray-400 text-xl max-w-xl">
              Powerful features packed into a vibrant dashboard.
              Everything you need to master the market.
            </p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">

            {/* Card 1: Large (Span 2) - Real-time Analysis */}
            <div className="md:col-span-2 rounded-3xl bg-[#3B82F6] p-8 relative overflow-hidden group shadow-lg shadow-blue-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">LIVE DATA</div>
                <h3 className="text-3xl font-bold mb-2">Real-time Market Flow</h3>
                <p className="text-blue-100 max-w-md font-medium">Capture institutional movements instantly with our live KIS API integration.</p>
              </div>
              <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-white/10 rounded-tl-3xl translate-y-8 translate-x-8 group-hover:translate-x-4 group-hover:translate-y-4 transition duration-500 p-6">
                {/* Abstract Chart UI */}
                <div className="w-full h-full bg-[#1e293b] rounded-xl p-4 flex flex-col gap-3 opacity-90">
                  <div className="h-2 w-1/3 bg-slate-600 rounded-full"></div>
                  <div className="flex-1 flex items-end gap-2">
                    <div className="w-1/5 h-[40%] bg-blue-500 rounded-t"></div>
                    <div className="w-1/5 h-[70%] bg-blue-400 rounded-t"></div>
                    <div className="w-1/5 h-[50%] bg-blue-300 rounded-t"></div>
                    <div className="w-1/5 h-[90%] bg-blue-200 rounded-t"></div>
                    <div className="w-1/5 h-[60%] bg-blue-100 rounded-t"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Tall (Span 1) - AI Insights */}
            <div className="md:row-span-1 rounded-3xl bg-[#8B5CF6] p-8 relative overflow-hidden group shadow-lg shadow-purple-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">AI POWERED</div>
                <h3 className="text-3xl font-bold mb-2">Guru's Brain</h3>
                <p className="text-purple-100 font-medium">Deep learning analysis of your portfolio health.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-40 group-hover:scale-110 transition duration-700">
                <Bot size={240} strokeWidth={1} />
              </div>
            </div>

            {/* Card 3: Regular - Goal Tracking */}
            <div className="rounded-3xl bg-[#F97316] p-8 relative overflow-hidden group shadow-lg shadow-orange-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">TRACKING</div>
                <h3 className="text-3xl font-bold mb-2">Target Lock</h3>
                <p className="text-orange-100 font-medium">Never miss your exit price again.</p>
              </div>
              <div className="absolute bottom-6 right-6 p-4 bg-white/20 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition">
                <TrendingUp size={48} className="text-white" />
              </div>
            </div>

            {/* Card 4: Wide (Span 2) - Journaling */}
            <div className="md:col-span-2 rounded-3xl bg-[#14B8A6] p-8 relative overflow-hidden group shadow-lg shadow-teal-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">MEMO & NOTES</div>
                <h3 className="text-3xl font-bold mb-2">Contextual Journaling</h3>
                <p className="text-teal-100 max-w-md font-medium">Attach notes directly to price points. Understand the 'Why' behind every trade.</p>
              </div>
              {/* Mockup Elements */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12 w-1/2 space-y-3 opacity-90">
                <div className="p-4 bg-white rounded-xl shadow-lg transform rotate-3 group-hover:rotate-6 transition">
                  <div className="h-2 w-20 bg-slate-200 rounded mb-2"></div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-lg transform -rotate-2 group-hover:-rotate-3 transition translate-x-4">
                  <div className="h-2 w-16 bg-slate-200 rounded mb-2"></div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* 3. Social Proof / Showcase (White) */}
      <section className="bg-white text-black py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                See what others are building.
              </h2>
              <p className="text-slate-500 font-bold text-lg">Trusted by smart investors worldwide.</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 rounded-full border-2 border-slate-200 hover:bg-black hover:text-white transition"><ArrowRight className="rotate-180" /></button>
              <button className="p-3 rounded-full border-2 border-slate-200 hover:bg-black hover:text-white transition"><ArrowRight /></button>
            </div>
          </div>

          {/* Carousel Placeholder */}
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
            <ShowcaseCard title="Dashboard" color="bg-gray-100" icon={<BarChart3 size={48} />} />
            <ShowcaseCard title="Portfolio" color="bg-gray-100" icon={<PieChart size={48} />} />
            <ShowcaseCard title="Mobile App" color="bg-gray-100" icon={<Smartphone size={48} />} />
            <ShowcaseCard title="Search" color="bg-gray-100" icon={<Search size={48} />} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-black text-xl">
            <Bot size={24} />
            <span>JUBOT</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-500">
            <Link href="#" className="hover:text-black">Privacy</Link>
            <Link href="#" className="hover:text-black">Terms</Link>
            <Link href="#" className="hover:text-black">Twitter</Link>
          </div>
          <div className="text-slate-400 text-sm font-bold">
            © 2026 Jubot Inc.
          </div>
        </div>
      </footer>

    </div>
  );
}

function ShowcaseCard({ title, color, icon }: { title: string, color: string, icon: React.ReactNode }) {
  return (
    <div className={`min-w-[300px] md:min-w-[400px] h-[300px] rounded-3xl ${color} flex flex-col items-center justify-center snap-center hover:scale-[1.02] transition duration-300 border-2 border-slate-100`}>
      <div className="mb-4 text-slate-300">{icon}</div>
      <h4 className="text-xl font-bold text-slate-400">{title} View</h4>
    </div>
  )
}
