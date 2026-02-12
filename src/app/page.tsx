import Link from 'next/link';
import { ArrowRight, Bot, BookOpen, TrendingUp, Search, PenTool, Edit3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Grid Pattern (Note Style) */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/90 backdrop-blur-sm z-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <Bot strokeWidth={1.5} className="text-indigo-600" />
            <span className="tracking-tight">JUBOT</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/login" className="text-slate-500 hover:text-indigo-600 transition">
              로그인
            </Link>
            <Link href="/register" className="text-indigo-600 hover:text-indigo-800 transition underline underline-offset-4 decoration-2 decoration-indigo-200 hover:decoration-indigo-600">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <main className="relative z-10 pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-10">

          <div className="inline-block border border-slate-900 rounded-full px-4 py-1.5 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transform -rotate-2 hover:rotate-0 transition duration-300">
            <span className="text-sm font-bold text-slate-900">✍️ 감정까지 기록하는 투자 노트</span>
          </div>

          <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            투자는<br />
            <span className="relative inline-block text-indigo-600">
              기록
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
            이다.
          </h1>

          <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
            차트만 보며 불안해하지 마세요.<br />
            오늘의 감정과 매수 이유를 <span className="font-bold text-slate-900">주봇</span>에 적으세요.<br />
            당신의 기록이 곧 수익의 데이터가 됩니다.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-4 bg-slate-900 text-white text-lg font-bold border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all duration-200 flex items-center justify-center gap-2 group">
              <Edit3 size={20} className="group-hover:-rotate-12 transition-transform" />
              지금 기록 시작하기
            </Link>
            <Link href="#features" className="px-8 py-4 bg-white text-slate-900 text-lg font-bold border-2 border-slate-200 hover:border-slate-900 transition-colors flex items-center justify-center">
              더 알아보기
            </Link>
          </div>

          {/* Line Art Illustration Substitute */}
          <div className="pt-20 flex justify-center opacity-80">
            <div className="relative">
              <Bot size={240} strokeWidth={0.8} className="text-slate-800" />
              <div className="absolute -right-12 bottom-0 rotate-12">
                <PenTool size={80} strokeWidth={1} className="text-indigo-600" />
              </div>
              {/* Doodles */}
              <svg className="absolute -top-10 -right-20 w-32 h-32 text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 50 Q 50 10 90 50 T 90 90" strokeDasharray="5,5" />
              </svg>
            </div>
          </div>

        </div>
      </main>

      {/* 2. Key Value Section */}
      <section className="py-24 border-t border-slate-200 bg-white relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <Edit3 size={24} className="text-indigo-600" />
                적다.
              </h3>
              <p className="text-slate-600 leading-relaxed">
                매수 버튼을 누를 때의 떨림, 매도할 때의 아쉬움.
                숫자 뒤에 숨겨진 감정을 기록하세요.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <Search size={24} className="text-indigo-600" />
                보다.
              </h3>
              <p className="text-slate-600 leading-relaxed">
                내가 쓴 메모와 시장 데이터를 한눈에.
                과거의 나와 현재의 시장을 비교하며 배웁니다.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <TrendingUp size={24} className="text-indigo-600" />
                성장하다.
              </h3>
              <p className="text-slate-600 leading-relaxed">
                반복되는 실수를 줄이고 나만의 원칙을 세웁니다.
                기록은 가장 훌륭한 스승입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features (Note Cards) */}
      <section id="features" className="py-24 bg-[#F8FAFC] relative z-10 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900">당신의 투자도트, JUBOT</h2>
            <p className="text-slate-500">복잡한 기능은 뺐습니다. 오직 '기록'과 '인사이트'에만 집중하세요.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <NoteCard
              title="메모 & 타임라인"
              desc="차트 위에 그 날의 심리를 핀처럼 꽂아두세요. 언제든 다시 꺼내볼 수 있습니다."
              icon={<BookOpen size={32} strokeWidth={1} />}
            />
            <NoteCard
              title="목표가 트래킹"
              desc="감으로 매도하지 마세요. 내가 정한 목표가까지 남은 거리를 명확히 보여줍니다."
              icon={<TrendingUp size={32} strokeWidth={1} />}
            />
            <NoteCard
              title="AI 조언"
              desc="당신의 기록을 AI가 분석해 냉철한 조언을 건넵니다. 때론 뼈아픈 충고도 필요하니까요."
              icon={<Bot size={32} strokeWidth={1} />}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-12 relative z-10">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            오늘 당신의 기록이<br />
            <span className="text-indigo-600">내일의 계좌</span>를 바꿉니다.
          </h2>

          <Link href="/register" className="inline-block px-10 py-5 bg-slate-900 text-white text-lg font-bold rounded-full hover:bg-indigo-600 transition shadow-xl">
            나만의 주봇 만들기
          </Link>

          <div className="pt-12 text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center border-t border-slate-100 mt-12 pt-8">
            <p>© 2026 JUBOT. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-slate-900">Terms</Link>
              <Link href="#" className="hover:text-slate-900">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function NoteCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.1)] hover:shadow-[12px_12px_0px_0px_rgba(79,70,229,0.2)] hover:-translate-y-1 transition-all duration-300">
      <div className="text-indigo-600 mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
