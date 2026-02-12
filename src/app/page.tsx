import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bot, BookOpen, TrendingUp, Search, Mic } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-orange-600">
            <Bot size={28} />
            <span className="font-extrabold tracking-tight">JUBOT</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-orange-600 transition">
              로그인
            </Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-full transition shadow-lg shadow-orange-500/20">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <main className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-bold mb-4">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
                감정까지 기록하는 나만의 투자 파트너
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                내 주식의 기록, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  주봇(JUBOT)
                </span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                차트만 보면 불안한가요? <br className="hidden lg:block" />
                오늘 느낀 감정과 매수 이유를 기록하세요. <br />
                주봇이 당신의 기록을 <span className="font-bold text-slate-900 border-b-4 border-orange-200">수익의 인사이트</span>로 바꿔줍니다.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-500 transition shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 group">
                  지금 바로 첫 기록 시작하기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition flex items-center justify-center">
                  투자는 기록이다?
                </Link>
              </div>
            </div>

            {/* Visual Element (JUBOT Character) */}
            <div className="flex-1 relative w-full max-w-lg lg:max-w-xl animate-in fade-in zoom-in duration-1000 delay-200">
              {/* Blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/50 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/50 rounded-full blur-3xl -z-10" />

              <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-amber-50 rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/jubot_main.png"
                  alt="주봇이 열심히 메모하는 모습"
                  width={600}
                  height={600}
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 2. Key Value Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">
              "복기 없는 투자는 <span className="text-orange-600">도박</span>과 같습니다"
            </h2>
            <p className="text-lg text-slate-500">주봇이 당신에게 꼭 필요한 3가지를 약속합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon="✍️" title="기록하는 습관"
              desc="매수/매도 시점의 감정까지 기록하여 나만의 투자 원칙을 세웁니다."
            />
            <ValueCard
              icon="📚" title="공부하는 습관"
              desc="매일 확인해야 할 필수 주가 정보를 주봇이 깔끔하게 요약해 드립니다."
            />
            <ValueCard
              icon="⚖️" title="흔들리지 않는 기준"
              desc="매수 시점의 목표가를 현재가와 비교해 감정적인 매도를 방지합니다."
            />
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Features</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">주봇의 특별한 능력</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureBox
              icon={<BookOpen className="text-white" size={24} />}
              color="bg-blue-500"
              title="메모 & 타임라인"
              copy="왜 샀는지 잊지 마세요"
              desc="차트 위에 매수/매도 시점의 내 솔직한 심리를 기록하고 복기합니다."
            />
            <FeatureBox
              icon={<TrendingUp className="text-white" size={24} />}
              color="bg-emerald-500"
              title="목표가 트래킹"
              copy="현재가 대비 목표 달성률"
              desc="감에 의존하지 마세요. 내 목표까지 남은 거리를 시각적으로 보여줍니다."
            />
            <FeatureBox
              icon={<Bot className="text-white" size={24} />}
              color="bg-orange-500"
              title="AI 조언 (주봇 픽)"
              copy="주봇의 똑똑한 한마디"
              desc="내 포트폴리오와 기록을 분석해 AI가 맞춤형 매매 전략을 조언합니다."
            />
          </div>

          <div className="mt-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                <Search className="text-white" size={24} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900 mb-1">스마트 조건 검색</h3>
                <p className="text-slate-600">"내 입맛에 맞는 종목 찾기" — 복잡한 수식 없이, 회사 기본 정보를 기반으로 쉽고 빠르게 우량주를 발굴하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works (3 Step) */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold">투자가 쉬워지는 3단계</h2>
            <p className="text-slate-400">주봇과 함께하면 복잡한 주식도 놀이처럼 즐거워집니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-slate-700 via-orange-500 to-slate-700 -z-10"></div>

            <StepCard
              step="01"
              action="쓰다"
              desc="매수 시점의 이유와 목표가를 주봇에게 속삭이듯 적습니다."
              icon={<Mic size={32} />}
            />
            <StepCard
              step="02"
              action="보다"
              desc="주봇이 가져온 시장 정보와 내 메모를 매일 비교하며 공부합니다."
              icon={<Search size={32} />}
            />
            <StepCard
              step="03"
              action="듣다"
              desc="AI 주봇이 분석한 내 투자 패턴과 종목 조언을 확인합니다."
              icon={<Bot size={32} />}
            />
          </div>
        </div>
      </section>

      {/* 5. Footer / Social Proof */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            초보 투자자의 가장 든든한 아가방, <br />
            <span className="text-orange-600">주봇</span>
          </h2>
          <p className="text-xl text-slate-500 font-medium">
            "오늘 당신의 기록이 내일의 계좌를 바꿉니다."
          </p>
          <div className="pt-4">
            <Link href="/register" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-xl hover:shadow-2xl hover:-translate-y-1">
              나만의 주봇 만들기 (무료)
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm gap-4">
          <p>© 2026 JUBOT. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-600">이용약관</Link>
            <Link href="#" className="hover:text-slate-600">개인정보처리방침</Link>
            <Link href="#" className="hover:text-slate-600">문의하기</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function ValueCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 transition duration-300 group">
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureBox({ icon, color, title, copy, desc }: { icon: React.ReactNode, color: string, title: string, copy: string, desc: string }) {
  return (
    <div className="flex flex-col h-full p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition duration-300">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg mb-6 rotate-3 hover:rotate-6 transition-transform`}>
        {icon}
      </div>
      <span className="text-orange-600 text-sm font-bold mb-2 block">{copy}</span>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed flex-grow">{desc}</p>
    </div>
  );
}

function StepCard({ step, action, desc, icon }: { step: string, action: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="relative bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center hover:-translate-y-2 transition-transform duration-300">
      <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center mb-6 text-orange-400 shadow-inner">
        {icon}
      </div>
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
        STEP {step}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{action}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
