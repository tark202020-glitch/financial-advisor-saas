import Link from 'next/link';
import { ArrowRight, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100">

      {/* Navbar */}
      <nav className="border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-400">
            <TrendingUp size={24} />
            <span>Market Insight</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
              로그인
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-500/20">
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-4">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
            진지한 투자자를 위한 분석 도구
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
            시장을 읽는 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              가장 확실한 방법
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Market Insight Advisor는 단순한 시세 확인을 넘어, <br className="hidden md:block" />
            시장 흐름, 수급 분석, 그리고 포트폴리오 관리를 통합 제공합니다. <br />
            당신의 투자를 더 체계적으로, 더 깊이 있게 만드세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition shadow-xl flex items-center justify-center gap-2">
              대시보드 체험하기 <ArrowRight size={20} />
            </Link>
            <Link href="/about" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-slate-300 rounded-xl font-medium text-lg hover:bg-slate-700 transition border border-slate-700 flex items-center justify-center">
              더 알아보기
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
            <FeatureCard
              icon={<BarChart3 className="text-blue-400" />}
              title="실시간 수급 분석"
              desc="외국인/기관 순매수 동향을 시각적으로 파악하세요."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" />}
              title="검증된 데이터"
              desc="KIS API 기반의 신뢰할 수 있는 실시간 데이터를 제공합니다."
            />
            <FeatureCard
              icon={<TrendingUp className="text-indigo-400" />}
              title="투자 일지 관리"
              desc="매매 기록과 아이디어를 체계적으로 정리하고 복기하세요."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-slate-500 text-sm">
          <p>© 2026 Market Insight Advisor. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-300">이용약관</Link>
            <Link href="#" className="hover:text-slate-300">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition backdrop-blur-sm">
      <div className="mb-4 bg-slate-900/50 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-700">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
