"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Connectivity Check
    const [connectionStatus, setConnectionStatus] = useState<string>('Checking...');

    const [diagLog, setDiagLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setDiagLog(prev => [...prev, msg].slice(-5));
    };

    useEffect(() => {
        const checkConnection = async () => {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl) return;

            addLog(`Target: ${supabaseUrl.substring(0, 20)}...`);
            setConnectionStatus('Diagnosing...');

            try {
                // 1. Raw Fetch to Auth Settings (Public)
                const settingsUrl = `${supabaseUrl}/auth/v1/settings`;
                addLog(`Fetch: ${settingsUrl}`);

                const fetchStart = performance.now();
                const res = await fetch(settingsUrl, { method: 'GET' });
                const fetchEnd = performance.now();

                addLog(`Fetch Status: ${res.status} (${(fetchEnd - fetchStart).toFixed(0)}ms)`);

                if (res.ok) {
                    setConnectionStatus('Network OK (Settings Accessible)');
                } else {
                    setConnectionStatus(`Network Warning: HTTP ${res.status}`);
                }

                // 2. Supabase Client Session Check
                addLog('Checking Client Session...');
                // Set a short timeout for the client check specifically
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Client Timeout")), 5000));

                try {
                    await Promise.race([sessionPromise, timeoutPromise]);
                    addLog('Client: Session Check OK');
                } catch (e: any) {
                    addLog(`Client Error: ${e.message}`);
                    // Don't show HANGING status automatically on load
                    // setConnectionStatus('Supabase Client HANGING'); 
                    console.warn("Background Session Check Timeout - Silent Fail");
                }

            } catch (e: any) {
                addLog(`Fetch Fail: ${e.message}`);
                setConnectionStatus('Network FAILED');
            }
        };

        // Delay slightly to let UI mount
        setTimeout(checkConnection, 500);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login submitted", { email });
        setLoading(true);
        setError(null);

        try {
            console.log("Calling supabase.auth.signInWithPassword with timeout...");

            // Create a timeout promise (Extended to 30s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Login Request Timed Out (30s)")), 30000)
            );

            // Race against the actual login
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ]) as any;

            console.log("Supabase response received:", { data, error });

            if (error) {
                console.error("Login error:", error.message);
                setError(error.message);
                setLoading(false);
            } else {
                console.log("Login success! Redirecting to /dashboard");
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            console.error("Unexpected error in handleLogin:", err);
            const msg = err.message || "An unexpected error occurred.";
            setError(msg);

            if (msg.includes("Timed Out")) {
                setConnectionStatus("Supabase Client HANGING");
            }

            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 mb-4">
                        <Lock className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Sign in to access your portfolio</p>
                    <div className="flex flex-col items-center">
                        <p className="text-xs text-slate-600 mt-2 font-mono">{connectionStatus}</p>
                        {connectionStatus.includes("HANGING") && (
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                                className="mt-2 px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full hover:bg-red-200 transition"
                            >
                                🔄 Force Session Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
                                🛑 {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
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
