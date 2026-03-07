"use client";

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles } from 'lucide-react';

interface BriefingData {
    top_stories?: Array<{ title: string; summary: string; impact: string; related_stocks?: string[] }>;
    watchpoints?: string[];
    jubot_opinion?: string;
}

// 간단한 마크다운 볼드 파서
const formatMarkdownBold = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // 볼드체이면서 약간 더 밝은 색으로 강조
            return <strong key={index} className="text-[#FFE57F] font-black">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

export default function JubotBriefing() {
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchBriefing = useCallback(async (force = false) => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`/api/jubot/analyze/daily${force ? '?force=true' : ''}`);
            const data = await res.json();
            if (data.success && data.briefing) {
                setBriefing(data.briefing);
                // generated_at이 있으면 그것을 사용, 없으면 현재 시간
                const genDate = data.generated_at ? new Date(data.generated_at) : new Date();
                setLastUpdated(genDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

                // SessionStorage에 저장 (페이지 이동 시 재사용)
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('jubot_daily_briefing', JSON.stringify({
                        briefing: data.briefing,
                        generated_at: data.generated_at,
                        timestamp: Date.now()
                    }));
                }
            } else {
                setError(true);
            }
        } catch (e) {
            console.error('[JubotBriefing] Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load & Cache Check
    useEffect(() => {
        // 1. SessionStorage 확인
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('jubot_daily_briefing');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // 하루(24시간) 지났는지 간단 체크 (혹은 날짜 비교)
                    const cachedDate = new Date(parsed.generated_at || parsed.timestamp);
                    const isToday = cachedDate.toDateString() === new Date().toDateString();

                    if (isToday) {
                        setBriefing(parsed.briefing);
                        setLastUpdated(cachedDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
                        return; // 캐시 사용 시 fetch 생략
                    }
                } catch (e) {
                    // Ignore parsing error
                }
            }
        }

        // 2. 캐시 없으면 API 호출
        fetchBriefing();
    }, [fetchBriefing]);

    const getImpactIcon = (impact: string) => {
        switch (impact) {
            case 'positive': return <TrendingUp size={18} className="text-red-400" />;
            case 'negative': return <TrendingDown size={18} className="text-blue-400" />;
            default: return <Minus size={18} className="text-gray-400" />;
        }
    };

    const getImpactBg = (impact: string) => {
        switch (impact) {
            case 'positive': return 'border-red-900/30 bg-red-900/10';
            case 'negative': return 'border-blue-900/30 bg-blue-900/10';
            default: return 'border-[#333] bg-[#1a1a1a]';
        }
    };

    return (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-4 sm:px-6 border-b border-[#333] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F7D047] to-[#F59E0B] flex items-center justify-center flex-shrink-0">
                        <Newspaper size={24} className="text-black" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            📰 JUBOT의 오늘 시장 브리핑
                            {lastUpdated && <span className="text-sm font-normal text-gray-500 bg-[#333] px-2.5 py-0.5 rounded-full">업데이트 {lastUpdated}</span>}
                        </h2>
                        <p className="text-base text-gray-400 mt-1">
                            시장의 큰 흐름과 핵심 뉴스를 AI가 입체적으로 분석합니다
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fetchBriefing(true)}
                    disabled={loading}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#252525] border border-[#333] text-gray-400 hover:text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                    title="브리핑 새로고침"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
                {loading && !briefing && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#333] border-t-[#F7D047]"></div>
                        <p className="text-gray-400 text-base">뉴스를 수집하고 AI가 분석 중입니다...</p>
                        <p className="text-gray-500 text-sm">약 10~20초 소요됩니다</p>
                    </div>
                )}

                {error && !briefing && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <AlertTriangle size={32} className="text-yellow-500" />
                        <p className="text-gray-400">브리핑 생성에 실패했습니다</p>
                        <button
                            onClick={() => fetchBriefing(true)}
                            className="text-[#F7D047] text-base hover:underline"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && !briefing && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <Sparkles size={40} className="text-[#F7D047]" />
                        <div>
                            <p className="text-gray-300 font-bold text-xl">주봇이 시장을 분석할 준비가 되었습니다</p>
                            <p className="text-gray-500 text-base mt-1">상단의 "브리핑 생성" 버튼을 눌러 오늘의 시장을 확인하세요</p>
                        </div>
                    </div>
                )}

                {briefing && (
                    <div className="space-y-6">
                        {/* Jubot Opinion (통합 요약) */}
                        {briefing.jubot_opinion && (
                            <div className="bg-gradient-to-r from-[#2a2a1e] to-[#1e1e1e] p-6 rounded-2xl border border-[#F7D047]/30 shadow-lg mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={24} className="text-[#F7D047]" />
                                    <h3 className="text-xl font-black text-[#F7D047]">🤖 주봇 종합 의견</h3>
                                </div>
                                <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                                    {formatMarkdownBold(briefing.jubot_opinion)}
                                </div>
                            </div>
                        )}

                        {/* Top Stories (3단 분리 그리드) */}
                        {briefing.top_stories && briefing.top_stories.length > 0 && (
                            <div className="mb-8">
                                <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-5">
                                    📰 핵심 뉴스 요약
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    {/* 1. 불안 뉴스 (Negative) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#333]">
                                            <TrendingDown size={18} className="text-blue-400" />
                                            <span className="font-bold text-blue-400 text-base">불안 뉴스</span>
                                        </div>
                                        {briefing.top_stories.filter(s => s.impact === 'negative').map((story, i) => (
                                            <div key={i} className="p-5 rounded-xl border border-blue-900/30 bg-blue-900/10">
                                                <div className="font-bold text-white text-lg leading-tight mb-2">{story.title}</div>
                                                <div className="text-gray-400 text-base leading-snug">{story.summary}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 2. 일반 뉴스 (Neutral) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#333]">
                                            <Minus size={18} className="text-gray-400" />
                                            <span className="font-bold text-gray-400 text-base">일반 뉴스</span>
                                        </div>
                                        {briefing.top_stories.filter(s => s.impact === 'neutral').map((story, i) => (
                                            <div key={i} className="p-5 rounded-xl border border-[#333] bg-[#252525]">
                                                <div className="font-bold text-white text-lg leading-tight mb-2">{story.title}</div>
                                                <div className="text-gray-400 text-base leading-snug">{story.summary}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 3. 좋은 소식 (Positive) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#333]">
                                            <TrendingUp size={18} className="text-red-400" />
                                            <span className="font-bold text-red-400 text-base">좋은 소식</span>
                                        </div>
                                        {briefing.top_stories.filter(s => s.impact === 'positive').map((story, i) => (
                                            <div key={i} className="p-5 rounded-xl border border-red-900/30 bg-red-900/10">
                                                <div className="font-bold text-white text-lg leading-tight mb-2">{story.title}</div>
                                                <div className="text-gray-400 text-base leading-snug">{story.summary}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Watchpoints */}
                        {briefing.watchpoints && briefing.watchpoints.length > 0 && (
                            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333]">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-300 mb-4">
                                    <AlertTriangle size={18} className="text-yellow-500" />
                                    오늘의 주목 포인트
                                </h4>
                                <ul className="space-y-3">
                                    {briefing.watchpoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2 text-base text-gray-300">
                                            <span className="text-[#F7D047] font-bold mt-0.5">•</span>
                                            <span className="leading-snug">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
