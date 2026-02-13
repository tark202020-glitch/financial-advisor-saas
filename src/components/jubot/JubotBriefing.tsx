"use client";

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles } from 'lucide-react';

interface BriefingData {
    headline: string;
    market_overview: string;
    key_indices?: Array<{ name: string; value: string; change: string; comment: string }>;
    top_stories?: Array<{ title: string; summary: string; impact: string; related_stocks?: string[] }>;
    watchpoints?: string[];
    jubot_opinion?: string;
}

export default function JubotBriefing() {
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchBriefing = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/jubot/analyze/daily');
            const data = await res.json();
            if (data.success && data.briefing) {
                setBriefing(data.briefing);
                setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
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

    const getImpactIcon = (impact: string) => {
        switch (impact) {
            case 'positive': return <TrendingUp size={14} className="text-red-400" />;
            case 'negative': return <TrendingDown size={14} className="text-blue-400" />;
            default: return <Minus size={14} className="text-gray-400" />;
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
            <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7D047] to-[#F59E0B] flex items-center justify-center">
                        <Newspaper size={20} className="text-black" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">📰 오늘의 시장 브리핑</h2>
                        <p className="text-xs text-gray-500">
                            {lastUpdated ? `마지막 업데이트: ${lastUpdated}` : '뉴스를 수집하여 AI가 분석합니다'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchBriefing}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7D047] text-black font-bold text-sm hover:bg-[#f5c518] transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? '분석 중...' : briefing ? '새로고침' : '브리핑 생성'}
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !briefing && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#333] border-t-[#F7D047]"></div>
                        <p className="text-gray-400 text-sm">뉴스를 수집하고 AI가 분석 중입니다...</p>
                        <p className="text-gray-500 text-xs">약 10~20초 소요됩니다</p>
                    </div>
                )}

                {error && !briefing && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <AlertTriangle size={32} className="text-yellow-500" />
                        <p className="text-gray-400">브리핑 생성에 실패했습니다</p>
                        <button
                            onClick={fetchBriefing}
                            className="text-[#F7D047] text-sm hover:underline"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && !briefing && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <Sparkles size={40} className="text-[#F7D047]" />
                        <div>
                            <p className="text-gray-300 font-bold text-lg">주봇이 시장을 분석할 준비가 되었습니다</p>
                            <p className="text-gray-500 text-sm mt-1">상단의 "브리핑 생성" 버튼을 눌러 오늘의 시장을 확인하세요</p>
                        </div>
                    </div>
                )}

                {briefing && (
                    <div className="space-y-6">
                        {/* Headline */}
                        <div className="bg-gradient-to-r from-[#F7D047]/10 to-transparent p-4 rounded-xl border border-[#F7D047]/20">
                            <h3 className="text-xl font-black text-[#F7D047]">{briefing.headline}</h3>
                            <p className="text-gray-300 mt-2 leading-relaxed">{briefing.market_overview}</p>
                        </div>

                        {/* Key Indices */}
                        {briefing.key_indices && briefing.key_indices.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3">📊 주요 지수</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {briefing.key_indices.map((idx, i) => {
                                        const isUp = idx.change?.includes('+');
                                        const isDown = idx.change?.includes('-');
                                        return (
                                            <div key={i} className="bg-[#252525] p-3 rounded-xl border border-[#333]">
                                                <div className="text-xs text-gray-500">{idx.name}</div>
                                                <div className="text-lg font-bold text-white">{idx.value || '-'}</div>
                                                <div className={`text-sm font-bold ${isUp ? 'text-red-400' : isDown ? 'text-blue-400' : 'text-gray-400'}`}>
                                                    {idx.change || '-'}
                                                </div>
                                                {idx.comment && (
                                                    <div className="text-xs text-gray-500 mt-1 truncate">{idx.comment}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Top Stories */}
                        {briefing.top_stories && briefing.top_stories.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3">📰 핵심 뉴스</h4>
                                <div className="space-y-2">
                                    {briefing.top_stories.map((story, i) => (
                                        <div key={i} className={`p-4 rounded-xl border ${getImpactBg(story.impact)}`}>
                                            <div className="flex items-start gap-2">
                                                {getImpactIcon(story.impact)}
                                                <div className="flex-1">
                                                    <div className="font-bold text-white text-sm">{story.title}</div>
                                                    <div className="text-gray-400 text-xs mt-1">{story.summary}</div>
                                                    {story.related_stocks && story.related_stocks.length > 0 && (
                                                        <div className="flex gap-1 mt-2 flex-wrap">
                                                            {story.related_stocks.map((s, j) => (
                                                                <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-300">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Watchpoints */}
                        {briefing.watchpoints && briefing.watchpoints.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3">⚡ 오늘의 주목 포인트</h4>
                                <ul className="space-y-1.5">
                                    {briefing.watchpoints.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-[#F7D047] font-bold mt-0.5">•</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Jubot Opinion */}
                        {briefing.jubot_opinion && (
                            <div className="bg-gradient-to-r from-[#2a2a1e] to-[#1e1e1e] p-4 rounded-xl border border-[#F7D047]/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-[#F7D047]">🤖 주봇 의견</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{briefing.jubot_opinion}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
