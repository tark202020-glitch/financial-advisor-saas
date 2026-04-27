"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Lock, Mail, Loader2, AlertCircle, Shield, ChevronRight } from 'lucide-react';
import WeeklyReportView from './WeeklyReportView';

interface PushContentPageProps {
  params: Promise<{ token: string }>;
}

export default function PushContentPage({ params }: PushContentPageProps) {
  const [token, setToken] = useState<string>('');
  const [stage, setStage] = useState<'loading' | 'auth' | 'content' | 'error' | 'expired'>('loading');
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  // 토큰 유효성 확인
  useEffect(() => {
    if (!token) return;

    fetch(`/api/push/content/${token}`)
      .then(res => {
        if (res.status === 404) {
          setStage('expired');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.error) {
          setStage('expired');
          return;
        }
        setEventInfo(data);
        setStage('auth');
      })
      .catch(() => setStage('error'));
  }, [token]);

  // 비밀번호 인증
  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const res = await fetch(`/api/push/content/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || '인증에 실패했습니다.');
        setIsAuthenticating(false);
        return;
      }

      // 인증 성공 — 컨텐츠 로드
      setSessionToken(data.sessionToken);
      const contentRes = await fetch(`/api/push/content/${token}`, {
        headers: { 'Authorization': `Bearer ${data.sessionToken}` },
      });

      const contentData = await contentRes.json();

      if (contentData.authenticated) {
        setContentData(contentData);
        setStage('content');
      } else {
        setAuthError('컨텐츠를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setAuthError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [email, password, token]);

  // === 로딩 ===
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#F7D047] mx-auto mb-4" size={40} />
          <p className="text-gray-400">링크를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // === 만료/무효 ===
  if (stage === 'expired') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">링크가 만료되었습니다</h2>
          <p className="text-gray-400 text-sm">
            이 리포트 링크는 만료되었거나 유효하지 않습니다.<br />
            JUBOT에 로그인하여 최신 리포트를 확인해주세요.
          </p>
        </div>
      </div>
    );
  }

  // === 에러 ===
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 text-center">
          <AlertCircle className="text-yellow-400 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-400 text-sm">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  // === 비밀번호 인증 ===
  if (stage === 'auth') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* JUBOT Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F7D047] to-[#F59E0B] shadow-lg shadow-yellow-900/30 mb-4">
              <Bot size={36} className="text-black" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">JUBOT</h1>
            <p className="text-gray-400 text-sm mt-1">AI 투자 전문가</p>
          </div>

          {/* Auth Card */}
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden">
            {/* Event Info */}
            <div className="p-6 border-b border-[#333] bg-[#252525]">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-[#F7D047]" />
                <span className="text-xs text-[#F7D047] font-bold uppercase tracking-wider">보안 인증 필요</span>
              </div>
              <h2 className="text-lg font-bold text-white">{eventInfo?.event_title || '리포트 열람'}</h2>
              <p className="text-sm text-gray-400 mt-1">
                보안을 위해 JUBOT 계정 비밀번호를 입력해주세요.
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuth} className="p-6 space-y-4">
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">이메일</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#252525] border border-[#444] rounded-xl text-white outline-none focus:border-[#F7D047] transition-colors placeholder:text-gray-500"
                    placeholder="JUBOT 계정 이메일"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">비밀번호</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#252525] border border-[#444] rounded-xl text-white outline-none focus:border-[#F7D047] transition-colors placeholder:text-gray-500"
                    placeholder="비밀번호 입력"
                    required
                  />
                  <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 bg-gradient-to-r from-[#F7D047] to-[#F59E0B] text-black font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    리포트 열기
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            이 링크는 보안을 위해 30일 후 만료됩니다.
          </p>
        </div>
      </div>
    );
  }

  // === 컨텐츠 렌더링 ===
  if (stage === 'content' && contentData) {
    const content = contentData.content;

    // content_type에 따라 적절한 뷰 렌더링
    switch (content?.content_type) {
      case 'monthly_report':
      case 'weekly_report':
        return <WeeklyReportView content={content} />;

      case 'daily_briefing':
        return (
          <div className="min-h-screen bg-[#121212] p-4 lg:p-8">
            <div className="max-w-[1200px] mx-auto">
              <header className="mb-8 text-center">
                <h1 className="text-2xl font-black text-white">{content.title}</h1>
              </header>
              <pre className="text-gray-300 whitespace-pre-wrap">{JSON.stringify(content.payload, null, 2)}</pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="min-h-screen bg-[#121212] p-4 lg:p-8">
            <div className="max-w-[1200px] mx-auto">
              <header className="mb-8 text-center">
                <h1 className="text-2xl font-black text-white">{contentData.event_title}</h1>
                <p className="text-gray-400 mt-2">{contentData.event_body}</p>
              </header>
            </div>
          </div>
        );
    }
  }

  return null;
}
