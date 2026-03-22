"use client";

import { useActionState } from 'react';
import { register } from './actions';
import { Lock, Mail, User, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type RegisterState = {
    error: string | null;
    success: boolean;
    email?: string;
};

const initialState: RegisterState = {
    error: null,
    success: false,
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, initialState);

    if (state?.success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">이메일을 확인해주세요</h2>
                    <p className="text-slate-600 mb-8">
                        <span className="font-semibold text-slate-900">{state.email}</span>으로 인증 링크를 보냈습니다.<br />
                        받은편지함을 확인하여 회원가입을 완료해주세요.
                    </p>
                    <Link href="/login" className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition">
                        로그인으로 이동
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 mb-4">
                        <User className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">회원가입</h2>
                    <p className="text-slate-400 mt-2">Market Insight Advisor에 가입하세요</p>
                </div>

                <div className="p-8">
                    <form action={formAction} className="space-y-6">
                        {state?.error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
                                🛑 {state.error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">닉네임</label>
                            <div className="relative">
                                <input
                                    name="nickname"
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
                                    placeholder="닉네임을 입력하세요"
                                />
                                <User className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
                                    placeholder="이메일을 입력하세요"
                                />
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
                                    placeholder="비밀번호를 입력하세요 (6자 이상)"
                                />
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={20} /> : '회원가입'}
                        </button>
                    </form>

                    <div className="mt-6 text-center space-y-4">
                        <Link href="/login" className="block text-slate-500 hover:text-slate-700 text-sm font-medium transition">
                            이미 계정이 있으신가요? <span className="text-indigo-600">로그인</span>
                        </Link>
                        <Link href="/" className="flex items-center justify-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition">
                            <ArrowLeft size={14} /> 홈으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
