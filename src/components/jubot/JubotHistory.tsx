"use client";

import { useState, useEffect, useCallback } from 'react';
import { History, Brain, TrendingUp, TrendingDown, Eye, ShieldAlert, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface HistoryItem {
    id: string;
    analysis_type: string;
    target_symbol: string | null;
    content: any;
    created_at: string;
}

const SIGNAL_ICON: Record<string, any> = {
    buy: TrendingUp,
    hold: Eye,
    sell: TrendingDown,
    watch: ShieldAlert,
};

const SIGNAL_COLOR: Record<string, string> = {
    buy: 'text-red-400',
    hold: 'text-gray-300',
    sell: 'text-blue-400',
    watch: 'text-yellow-400',
};

const SIGNAL_LABEL: Record<string, string> = {
    buy: '매수',
    hold: '보유',
    sell: '매도',
    watch: '관망',
};

const TYPE_LABEL: Record<string, string> = {
    daily_briefing: '📰 일일 브리핑',
    portfolio_insight: '🔍 포트폴리오 분석',
    stock_analysis: '🔬 종목 분석',
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const mm = String(kst.getMonth() + 1).padStart(2, '0');
    const dd = String(kst.getDate()).padStart(2, '0');
    const hh = String(kst.getHours()).padStart(2, '0');
    const mi = String(kst.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
}

function formatRelativeTime(dateStr: string) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
}

export default function JubotHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/jubot/history?limit=30');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error('[JubotHistory] Error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <History size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">📋 분석 히스토리</h2>
                        <p className="text-sm text-gray-500">과거 AI 분석 결과 타임라인</p>
                    </div>
                </div>
                <button onClick={fetchHistory} disabled={loading}
                    className="p-2 rounded-xl hover:bg-[#333] transition-colors">
                    <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && history.length === 0 && (
                    <div className="flex flex-col items-center py-8 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#333] border-t-purple-500"></div>
                        <p className="text-gray-500 text-sm">히스토리 불러오는 중...</p>
                    </div>
                )}

                {!loading && history.length === 0 && (
                    <div className="flex flex-col items-center py-12 gap-3 text-center">
                        <History size={36} className="text-gray-600" />
                        <p className="text-gray-400">아직 분석 기록이 없습니다</p>
                        <p className="text-gray-500 text-sm">"분석 시작"을 눌러 첫 분석을 실행해보세요</p>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#333]"></div>

                        <div className="space-y-4">
                            {history.map((item) => {
                                const isExpanded = expandedId === item.id;
                                const content = item.content;
                                const isPortfolio = item.analysis_type === 'portfolio_insight';
                                const isDaily = item.analysis_type === 'daily_briefing';
                                const isStock = item.analysis_type === 'stock_analysis';

                                return (
                                    <div key={item.id} className="relative pl-10">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 ${isPortfolio ? 'bg-purple-500 border-purple-400' :
                                                isDaily ? 'bg-[#F7D047] border-yellow-400' :
                                                    'bg-indigo-500 border-indigo-400'
                                            }`}></div>

                                        {/* Card */}
                                        <div
                                            className="bg-[#252525] rounded-xl border border-[#333] hover:border-[#444] transition-colors cursor-pointer"
                                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        >
                                            {/* Card Header */}
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm">{TYPE_LABEL[item.analysis_type] || '📄 분석'}</span>
                                                    {item.target_symbol && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-gray-400">
                                                            {item.target_symbol}
                                                        </span>
                                                    )}
                                                    {isPortfolio && content?.risk_level && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full bg-[#333] ${content.risk_level === 'high' ? 'text-red-400' :
                                                                content.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                                            }`}>
                                                            리스크: {content.risk_level === 'high' ? '위험' : content.risk_level === 'medium' ? '보통' : '안정'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500" title={item.created_at}>
                                                        {formatRelativeTime(item.created_at)}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                                                </div>
                                            </div>

                                            {/* Preview (collapsed) */}
                                            {!isExpanded && (
                                                <div className="px-4 pb-3">
                                                    <p className="text-sm text-gray-400 line-clamp-2">
                                                        {isPortfolio ? content?.portfolio_summary :
                                                            isDaily ? content?.market_summary :
                                                                isStock ? content?.summary :
                                                                    JSON.stringify(content).slice(0, 120) + '...'}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 space-y-3 border-t border-[#333] pt-3">
                                                    <div className="text-xs text-gray-500 mb-2">
                                                        {formatDate(item.created_at)}
                                                    </div>

                                                    {/* Portfolio Insight Detail */}
                                                    {isPortfolio && content && (
                                                        <>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{content.portfolio_summary}</p>

                                                            {content.stock_insights && (
                                                                <div className="space-y-1.5 mt-2">
                                                                    {content.stock_insights.map((s: any, i: number) => {
                                                                        const SIcon = SIGNAL_ICON[s.signal] || Eye;
                                                                        return (
                                                                            <div key={i} className="flex items-center gap-2 text-sm bg-[#1e1e1e] px-3 py-2 rounded-lg">
                                                                                <SIcon size={14} className={SIGNAL_COLOR[s.signal] || 'text-gray-400'} />
                                                                                <span className="font-bold text-gray-200">{s.name}</span>
                                                                                <span className={`text-xs font-bold ${SIGNAL_COLOR[s.signal]}`}>
                                                                                    {SIGNAL_LABEL[s.signal] || s.signal}
                                                                                </span>
                                                                                <span className="text-gray-500 text-xs flex-1 truncate ml-1">{s.reason}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {content.overall_recommendation && (
                                                                <div className="bg-[#2a2a1e] p-3 rounded-lg border border-[#F7D047]/20 mt-2">
                                                                    <p className="text-sm text-gray-300">💡 {content.overall_recommendation}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Daily Briefing Detail */}
                                                    {isDaily && content && (
                                                        <>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{content.market_summary}</p>
                                                            {content.key_topics && (
                                                                <div className="space-y-1 mt-2">
                                                                    {content.key_topics.map((t: any, i: number) => (
                                                                        <div key={i} className="text-sm bg-[#1e1e1e] px-3 py-2 rounded-lg">
                                                                            <span className={`text-xs px-1.5 py-0.5 rounded mr-2 ${t.sentiment === 'positive' ? 'bg-red-900/30 text-red-400' :
                                                                                    t.sentiment === 'negative' ? 'bg-blue-900/30 text-blue-400' :
                                                                                        'bg-[#333] text-gray-400'
                                                                                }`}>{t.sentiment === 'positive' ? '긍정' : t.sentiment === 'negative' ? '부정' : '중립'}</span>
                                                                            <span className="text-gray-200">{t.topic}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Stock Analysis Detail */}
                                                    {isStock && content && (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {content.overall_signal && (
                                                                    <span className={`font-bold text-lg ${SIGNAL_COLOR[content.overall_signal]}`}>
                                                                        {SIGNAL_LABEL[content.overall_signal] || content.overall_signal}
                                                                    </span>
                                                                )}
                                                                {content.confidence && (
                                                                    <span className="text-xs text-gray-500">
                                                                        신뢰도: {content.confidence === 'high' ? '높음' : content.confidence === 'medium' ? '보통' : '낮음'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{content.summary}</p>
                                                            {content.action_plan && (
                                                                <div className="bg-[#2a2a1e] p-3 rounded-lg border border-[#F7D047]/20 mt-2">
                                                                    <p className="text-sm text-gray-300">💡 {content.action_plan}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
