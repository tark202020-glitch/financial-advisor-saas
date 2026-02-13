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
              로그인
            </Link>
            <Link href="/register" className="px-6 py-2.5 font-bold text-sm bg-black text-[#F7D047] rounded-full hover:scale-105 transition shadow-lg">
              회원가입
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border-2 border-black font-bold text-xs uppercase tracking-wider mb-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            AI 투자의 새로운 기준
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter mb-8 break-keep">
            기록하는<br />
            투자 습관<span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">.</span>
          </h1>

          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto mb-10 leading-tight break-keep">
            한 번의 기록. 무한한 통찰. <br />
            주봇은 당신의 복잡한 주식 메모를 명확한 수익 인사이트로 바꿔줍니다.
          </p>

          <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl text-xl font-bold shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
            지금 시작하기 <ArrowRight strokeWidth={3} />
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
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4 break-keep">
              하나의 도구.<br />
              무한한 가능성.
            </h2>
            <p className="text-gray-400 text-xl max-w-xl break-keep">
              강력한 기능을 담은 생동감 넘치는 대시보드.<br />
              시장을 마스터하기 위한 모든 것이 여기에 있습니다.
            </p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">

            {/* Card 1: Large (Span 2) - Real-time Analysis */}
            <div className="md:col-span-2 rounded-3xl bg-[#3B82F6] p-8 relative overflow-hidden group shadow-lg shadow-blue-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">LIVE DATA</div>
                <h3 className="text-3xl font-bold mb-2 break-keep">실시간 시장 흐름</h3>
                <p className="text-blue-100 max-w-md font-medium break-keep">KIS API 연동으로 기관의 움직임과 시장 변화를 실시간으로 포착하세요.</p>
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
                <h3 className="text-3xl font-bold mb-2 break-keep">주식 도사 멍구루</h3>
                <p className="text-purple-100 font-medium break-keep">딥러닝 알고리즘이 당신의 포트폴리오 건전성을 분석하고 조언합니다.</p>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-40 group-hover:scale-110 transition duration-700">
                <Bot size={240} strokeWidth={1} />
              </div>
            </div>

            {/* Card 3: Regular - Goal Tracking */}
            <div className="rounded-3xl bg-[#F97316] p-8 relative overflow-hidden group shadow-lg shadow-orange-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">TRACKING</div>
                <h3 className="text-3xl font-bold mb-2 break-keep">목표가 타겟 잠금</h3>
                <p className="text-orange-100 font-medium break-keep">매도 타이밍을 놓치지 마세요. 목표가 근접 시 즉시 알려드립니다.</p>
              </div>
              <div className="absolute bottom-6 right-6 p-4 bg-white/20 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition">
                <TrendingUp size={48} className="text-white" />
              </div>
            </div>

            {/* Card 4: Wide (Span 2) - Journaling */}
            <div className="md:col-span-2 rounded-3xl bg-[#14B8A6] p-8 relative overflow-hidden group shadow-lg shadow-teal-900/20">
              <div className="relative z-10">
                <div className="bg-black/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">MEMO & NOTES</div>
                <h3 className="text-3xl font-bold mb-2 break-keep">문맥을 이해하는 주식 일지</h3>
                <p className="text-teal-100 max-w-md font-medium break-keep">가격 변동에 직접 메모를 남기세요. 차트 위에서 모든 거래의 '이유'를 한눈에 파악할 수 있습니다.</p>
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
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2 break-keep">
                다른 투자자들은<br />어떻게 기록할까요?
              </h2>
              <p className="text-slate-500 font-bold text-lg">전 세계 스마트한 투자자들의 선택.</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 rounded-full border-2 border-slate-200 hover:bg-black hover:text-white transition"><ArrowRight className="rotate-180" /></button>
              <button className="p-3 rounded-full border-2 border-slate-200 hover:bg-black hover:text-white transition"><ArrowRight /></button>
            </div>
          </div>

          {/* Carousel Placeholder */}
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
            <ShowcaseCard title="대시보드" color="bg-gray-100" icon={<BarChart3 size={48} />} />
            <ShowcaseCard title="포트폴리오" color="bg-gray-100" icon={<PieChart size={48} />} />
            <ShowcaseCard title="모바일 앱" color="bg-gray-100" icon={<Smartphone size={48} />} />
            <ShowcaseCard title="조건 검색" color="bg-gray-100" icon={<Search size={48} />} />
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

function ShowcaseCard({ title, color, icon }: { title: string, color: string, icon: React.ReactNode }) {
  return (
    <div className={`min-w-[300px] md:min-w-[400px] h-[300px] rounded-3xl ${color} flex flex-col items-center justify-center snap-center hover:scale-[1.02] transition duration-300 border-2 border-slate-100`}>
      <div className="mb-4 text-slate-300">{icon}</div>
      <h4 className="text-xl font-bold text-slate-400">{title}</h4>
    </div>
  )
}
