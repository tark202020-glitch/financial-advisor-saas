"use client";

import { useActionState } from 'react';
import { login } from './actions';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const initialState = {
    error: '',
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 mb-4">
                        <Lock className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Sign in to access your portfolio</p>
                </div>

                <div className="p-8">
                    <form action={formAction} className="space-y-6">
                        {state?.error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
                                🛑 {state.error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
                                    placeholder="Enter your email"
                                />
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-900 bg-white placeholder:text-slate-400"
                                    placeholder="Enter your password"
                                />
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 transition">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
