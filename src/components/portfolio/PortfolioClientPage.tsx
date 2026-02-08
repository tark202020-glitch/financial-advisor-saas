"use client";

import AddAssetForm from '@/components/portfolio/AddAssetForm';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import SidebarLayout from '@/components/SidebarLayout';
import { usePortfolio } from '@/context/PortfolioContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    serverDebugInfo?: {
        userEmail: string | null;
        portfolioCount: number | null;
        error: string | null;
    }
}

export default function PortfolioClientPage({ serverDebugInfo }: Props) {
    const { assets, isLoading, user, logout, refreshPortfolio, debugLog } = usePortfolio();

    // Sync Check Logic
    const serverCount = serverDebugInfo?.portfolioCount || 0;
    const clientCount = assets.length;

    // Condition: Server has data, Client has finished loading but has 0 data.
    const isSyncError = !isLoading && serverCount > 0 && clientCount === 0;

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto space-y-8 p-6 animate-in fade-in duration-500">

                {/* Debug Info (Only show if mismatch or error) */}
                {(isSyncError || serverDebugInfo?.error) && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-bold text-base">데이터 동기화 오류 감지</p>
                                <ul className="list-disc pl-5 mt-1 text-red-700/80">
                                    <li>Server Data: <strong>{serverCount}</strong> items found.</li>
                                    <li>Client Data: <strong>{clientCount}</strong> items loaded.</li>
                                    {serverDebugInfo?.error && <li>Server Error: {serverDebugInfo.error}</li>}
                                </ul>
                                <p className="mt-2 text-xs text-red-600">
                                    서버에는 데이터가 존재하지만, 브라우저에서 불러오지 못했습니다.<br />
                                    네트워크 문제이거나 일시적인 인증 오류일 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 pl-8">
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                페이지 새로고침
                            </button>
                            <button
                                onClick={() => logout()}
                                className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-lg text-xs font-medium transition"
                            >
                                재로그인
                            </button>
                        </div>
                    </div>
                )}

                {/* Debug Info (Only show if mismatch or error OR manually toggled) */}
                <div className="space-y-4">
                    {/* 1. Server Verification */}
                    {serverDebugInfo && (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-800 flex justify-between items-center">
                            <div className="flex gap-4">
                                <span>User: <strong>{serverDebugInfo.userEmail}</strong></span>
                                <span>DB Count: <strong>{serverDebugInfo.portfolioCount}</strong></span>
                            </div>
                            <span className="text-indigo-400">Server OK</span>
                        </div>
                    )}

                    {/* 2. Client Logs (Always visible for now to debug) */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs font-mono text-slate-600 max-h-40 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2 sticky top-0 bg-slate-50 pb-2 border-b border-slate-200">
                            <p className="font-bold text-slate-800">🛠 Client Debug Logs</p>
                            <button onClick={() => refreshPortfolio()} className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 transition">
                                <RefreshCw size={12} className="inline mr-1" /> Force Refresh
                            </button>
                        </div>
                        <div className="flex flex-col gap-1">
                            {debugLog.length === 0 ? (
                                <span className="text-slate-400 italic">No logs yet...</span>
                            ) : (
                                debugLog.map((log, i) => (
                                    <div key={i} className="break-all border-b border-slate-100 pb-0.5 last:border-0">
                                        <span className="text-slate-400 mr-2">{i + 1}.</span>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Asset Section */}
                <section>
                    <AddAssetForm />
                </section>

                {/* Asset List Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">내 주식에 메모하기</h2>
                    {/* Pass server count to Table to handle empty state better? For now just render table */}
                    <PortfolioTable />
                </section>
            </div>
        </SidebarLayout>
    );
}
