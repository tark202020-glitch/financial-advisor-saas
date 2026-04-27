"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, User, CheckCircle, AlertCircle, Loader2, Bell, Send, Mail } from 'lucide-react';
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

    // ---- 푸시 알림 설정 ----
    const [notifEmail, setNotifEmail] = useState('');
    const [monthlyReportEnabled, setMonthlyReportEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifSaved, setNotifSaved] = useState(false);
    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    // 알림 설정 로드
    useEffect(() => {
        if (!isOpen) return;
        fetch('/api/push/settings')
            .then(res => res.json())
            .then(data => {
                setNotifEmail(data.notification_email || '');
                setMonthlyReportEnabled(data.monthly_report_enabled ?? data.weekly_report_enabled ?? true);
                setEmailEnabled(data.email_enabled ?? true);
            })
            .catch(() => {});
    }, [isOpen]);

    // 알림 설정 저장
    const handleSaveNotifSettings = async () => {
        setNotifLoading(true);
        try {
            await fetch('/api/push/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notification_email: notifEmail || null,
                    email_enabled: emailEnabled,
                    monthly_report_enabled: monthlyReportEnabled,
                }),
            });
            setNotifSaved(true);
            setTimeout(() => setNotifSaved(false), 3000);
        } catch (e) {
            alert('설정 저장에 실패했습니다.');
        } finally {
            setNotifLoading(false);
        }
    };

    // 주간 리포트 테스트 발송
    const handleTestSend = async () => {
        if (!notifEmail) {
            setTestResult({ status: 'error', message: '알림 수신 이메일을 먼저 등록해주세요.' });
            return;
        }
        setTestSending(true);
        setTestResult(null);
        try {
            // 먼저 설정 저장
            await fetch('/api/push/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notification_email: notifEmail,
                    email_enabled: true,
                    monthly_report_enabled: true,
                }),
            });

            const res = await fetch('/api/push/generate-weekly-report');
            const data = await res.json();
            if (data.success) {
                // dispatch 결과까지 확인하여 실제 이메일 발송 여부 판별
                const dispatchInfo = data.dispatch;
                if (dispatchInfo && dispatchInfo.sent > 0) {
                    setTestResult({
                        status: 'success',
                        message: `✅ 이메일 발송 완료! (${data.period}, ${data.dataPoints}일 데이터, ${data.tradeCount}건 거래)`,
                    });
                } else if (dispatchInfo && dispatchInfo.failed > 0) {
                    const errMsg = dispatchInfo.errors?.join(', ') || '알 수 없는 오류';
                    setTestResult({
                        status: 'error',
                        message: `리포트는 생성되었으나 이메일 발송 실패: ${errMsg}`,
                    });
                } else {
                    setTestResult({
                        status: 'error',
                        message: '리포트는 생성되었으나 활성화된 발송 채널이 없습니다. 알림 설정을 확인해주세요.',
                    });
                }
            } else {
                setTestResult({ status: 'error', message: data.error || '발송 실패' });
            }
        } catch (e: any) {
            setTestResult({ status: 'error', message: e.message || '네트워크 오류' });
        } finally {
            setTestSending(false);
        }
    };

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

                    {/* Push Notification Settings */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-3">🔔 푸시 알림 설정</h3>

                        {/* 알림 이메일 */}
                        <div className="mb-3">
                            <label className="block text-xs text-gray-400 mb-1.5 font-medium">알림 수신 이메일</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={notifEmail}
                                    onChange={(e) => setNotifEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-[#252525] border border-[#444] rounded-xl text-white text-sm outline-none focus:border-[#F7D047] transition-colors placeholder:text-gray-500"
                                    placeholder="알림 받을 이메일 주소 입력"
                                />
                                <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">로그인 이메일과 다른 주소를 사용할 수 있습니다 (Gmail, Naver, Hanmail 등)</p>
                        </div>

                        {/* 토글 스위치들 */}
                        <div className="space-y-2 mb-3">
                            {/* 이메일 알림 */}
                            <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-blue-400" />
                                    <span className="text-sm text-gray-300">이메일 알림</span>
                                </div>
                                <button
                                    onClick={() => setEmailEnabled(!emailEnabled)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${
                                        emailEnabled ? 'bg-[#F7D047]' : 'bg-[#444]'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                                        emailEnabled ? 'left-5.5' : 'left-0.5'
                                    }`} style={{ left: emailEnabled ? '22px' : '2px' }} />
                                </button>
                            </div>

                            {/* 주간 리포트 */}
                            <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-[#333]">
                                <div className="flex items-center gap-2">
                                    <Bell size={14} className="text-[#F7D047]" />
                                    <span className="text-sm text-gray-300">월간 투자리포트</span>
                                </div>
                                <button
                                    onClick={() => setMonthlyReportEnabled(!monthlyReportEnabled)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${
                                        monthlyReportEnabled ? 'bg-[#F7D047]' : 'bg-[#444]'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all`}
                                         style={{ left: monthlyReportEnabled ? '22px' : '2px' }} />
                                </button>
                            </div>
                        </div>

                        {/* 설정 저장 */}
                        <button
                            onClick={handleSaveNotifSettings}
                            disabled={notifLoading}
                            className="w-full py-2.5 bg-[#333] hover:bg-[#444] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                        >
                            {notifLoading ? <Loader2 size={16} className="animate-spin" /> : notifSaved ? <CheckCircle size={16} className="text-green-400" /> : null}
                            {notifSaved ? '저장 완료!' : '설정 저장'}
                        </button>

                        {/* 테스트 발송 */}
                        <button
                            onClick={handleTestSend}
                            disabled={testSending}
                            className="w-full flex items-center gap-3 p-4 bg-[#252525] rounded-xl border border-[#333] hover:bg-[#2a2a2a] hover:border-[#444] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#F7D047]/10 flex items-center justify-center text-[#F7D047] group-hover:bg-[#F7D047]/20 transition-colors">
                                {testSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-white">월간 리포트 테스트 발송</span>
                                <span className="text-xs text-gray-500">현재 날짜 기준 1개월 데이터로 리포트를 생성합니다</span>
                            </div>
                        </button>

                        {testResult && (
                            <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${
                                testResult.status === 'success'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                                {testResult.status === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                <span>{testResult.message}</span>
                            </div>
                        )}
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
