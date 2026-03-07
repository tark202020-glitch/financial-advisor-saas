"use client";

import { useState, useRef } from 'react';
import { X, Download, Upload, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePortfolio, Asset } from '@/context/PortfolioContext';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
    const { user, assets, refreshPortfolio } = usePortfolio();
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [restoreMessage, setRestoreMessage] = useState('');
    const [backupStatus, setBackupStatus] = useState<'idle' | 'success'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // ---- 백업 (JSON 다운로드) ----
    const handleBackup = async () => {
        try {
            // Fetch full portfolio data from Supabase via API
            const res = await fetch('/api/portfolio/backup');
            if (!res.ok) throw new Error('백업 데이터를 가져올 수 없습니다.');
            const backupData = await res.json();

            // Create downloadable JSON file
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
            a.href = url;
            a.download = `JUBOT_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setBackupStatus('success');
            setTimeout(() => setBackupStatus('idle'), 3000);
        } catch (e: any) {
            alert(e.message || '백업 실패');
        }
    };

    // ---- 복원 (JSON 업로드) ----
    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setRestoreStatus('loading');
        setRestoreMessage('데이터를 복원하는 중...');

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);

            // Validate backup structure
            if (!backupData.portfolios || !Array.isArray(backupData.portfolios)) {
                throw new Error('올바른 백업 파일이 아닙니다.');
            }

            // Send to restore API
            const res = await fetch('/api/portfolio/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '복원 실패');
            }

            const result = await res.json();
            setRestoreStatus('success');
            setRestoreMessage(`${result.restoredCount}개 종목이 복원되었습니다.`);

            // Refresh portfolio data
            await refreshPortfolio();

            setTimeout(() => {
                setRestoreStatus('idle');
                setRestoreMessage('');
            }, 3000);
        } catch (e: any) {
            setRestoreStatus('error');
            setRestoreMessage(e.message || '복원 중 오류가 발생했습니다.');
            setTimeout(() => {
                setRestoreStatus('idle');
                setRestoreMessage('');
            }, 5000);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#333]">
                    <h2 className="text-lg font-bold text-white">계정 정보</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* User Info */}
                    <div className="flex items-center gap-4 p-4 bg-[#252525] rounded-xl border border-[#333]">
                        <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-[#F7D047] border border-[#444]">
                            <User size={24} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-base font-bold text-white truncate">
                                {user?.user_metadata?.full_name || "Guest"}
                            </span>
                            <span className="text-sm text-gray-400 truncate">
                                {user?.email || "이메일 없음"}
                            </span>
                        </div>
                    </div>

                    {/* Portfolio Summary */}
                    <div className="p-4 bg-[#252525] rounded-xl border border-[#333]">
                        <div className="text-sm text-gray-400 mb-1">등록된 종목 수</div>
                        <div className="text-2xl font-bold text-[#F7D047]">{assets.length}개</div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-[#333]" />

                    {/* Backup Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-3">📦 데이터 백업 / 복원</h3>

                        {/* Backup Button */}
                        <button
                            onClick={handleBackup}
                            className="w-full flex items-center gap-3 p-4 bg-[#252525] rounded-xl border border-[#333] hover:bg-[#2a2a2a] hover:border-[#444] transition-all group mb-3"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <Download size={20} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-white">백업하기</span>
                                <span className="text-xs text-gray-500">내 포트폴리오와 거래내역을 PC에 저장합니다</span>
                            </div>
                            {backupStatus === 'success' && (
                                <CheckCircle size={18} className="ml-auto text-green-400" />
                            )}
                        </button>

                        {/* Restore Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={restoreStatus === 'loading'}
                            className="w-full flex items-center gap-3 p-4 bg-[#252525] rounded-xl border border-[#333] hover:bg-[#2a2a2a] hover:border-[#444] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                                {restoreStatus === 'loading' ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Upload size={20} />
                                )}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-white">불러오기</span>
                                <span className="text-xs text-gray-500">백업 파일을 업로드하여 데이터를 복원합니다</span>
                            </div>
                        </button>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleRestore}
                            className="hidden"
                        />

                        {/* Status Message */}
                        {restoreMessage && (
                            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${restoreStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    restoreStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                {restoreStatus === 'success' && <CheckCircle size={16} />}
                                {restoreStatus === 'error' && <AlertCircle size={16} />}
                                {restoreStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                                {restoreMessage}
                            </div>
                        )}
                    </div>

                    {/* Warning */}
                    <p className="text-xs text-gray-500 leading-relaxed">
                        ⚠️ 불러오기 시 기존 데이터가 모두 삭제되고 백업 데이터로 교체됩니다.
                        복원 전 현재 데이터를 먼저 백업해 주세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
