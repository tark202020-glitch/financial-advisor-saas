"use client";

import { useState, useCallback } from 'react';
import { Brain, RefreshCw, ArrowUpRight, ArrowDownRight, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

interface StockInsight {
    symbol: string;
    name: string;
    signal: 'buy' | 'hold' | 'sell' | 'watch';
    reason: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
}

interface PortfolioAnalysis {
    portfolio_summary: string;
    risk_level: string;
    stock_insights: StockInsight[];
    sector_analysis: string;
    overall_recommendation: string;
}

const SIGNAL_CONFIG = {
    buy: { label: '매수', color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/30', icon: ArrowUpRight },
    hold: { label: '보유', color: 'text-gray-300', bg: 'bg-[#252525] border-[#333]', icon: Eye },
    sell: { label: '매도', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-900/30', icon: ArrowDownRight },
    watch: { label: '관망', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-900/30', icon: ShieldAlert },
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: '안정', color: 'text-green-400' },
    medium: { label: '보통', color: 'text-yellow-400' },
    high: { label: '위험', color: 'text-red-400' },
};

export default function JubotPortfolioInsight() {
    const { assets } = usePortfolio();
    const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const fetchAnalysis = useCallback(async () => {
        if (!assets || assets.length === 0) return;

        setLoading(true);
        setError(false);

        try {
            // Prepare portfolio data with current prices
            const portfolioData = assets
                .filter(a => (a.quantity || 0) > 0)
                .map(a => {
                    return {
                        name: a.name,
                        symbol: a.symbol,
                        category: a.category,
                        sector: a.sector || '',
                        currentPrice: a.pricePerShare || 0,
                        avgPrice: a.pricePerShare || 0,
                        quantity: a.quantity || 0,
                        changeRate: 0,
                        targetPriceUpper: a.targetPriceUpper || 0,
                        targetPriceLower: a.targetPriceLower || 0,
                    };
                });

            if (portfolioData.length === 0) {
                setError(true);
                setLoading(false);
                return;
            }

            const res = await fetch('/api/jubot/analyze/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: portfolioData }),
            });

            const data = await res.json();
            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error('[JubotPortfolio] Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [assets]);

    const activeAssets = assets?.filter(a => (a.quantity || 0) > 0) || [];

    return (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Brain size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">🔍 내 종목 AI 분석</h2>
                        <p className="text-xs text-gray-500">
                            보유 {activeAssets.length}개 종목에 대한 전문가 분석
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAnalysis}
                    disabled={loading || activeAssets.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? '분석 중...' : analysis ? '재분석' : '분석 시작'}
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && !analysis && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#333] border-t-purple-500"></div>
                        <p className="text-gray-400 text-sm">포트폴리오를 분석 중입니다...</p>
                        <p className="text-gray-500 text-xs">약 10~15초 소요됩니다</p>
                    </div>
                )}

                {error && !analysis && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <ShieldAlert size={32} className="text-yellow-500" />
                        <p className="text-gray-400">분석에 실패했습니다</p>
                        <button onClick={fetchAnalysis} className="text-purple-400 text-sm hover:underline">
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && !analysis && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <Sparkles size={40} className="text-purple-400" />
                        <div>
                            <p className="text-gray-300 font-bold text-lg">
                                {activeAssets.length > 0
                                    ? '보유 종목을 분석할 준비가 되었습니다'
                                    : '분석할 종목이 없습니다'}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {activeAssets.length > 0
                                    ? '"분석 시작" 버튼을 눌러 AI 인사이트를 받아보세요'
                                    : '내 주식일지에 종목을 추가해주세요'}
                            </p>
                        </div>
                    </div>
                )}

                {analysis && (
                    <div className="space-y-6">
                        {/* Portfolio Summary */}
                        <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-4 rounded-xl border border-purple-900/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-purple-300">포트폴리오 종합 평가</span>
                                {analysis.risk_level && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-[#333] ${RISK_CONFIG[analysis.risk_level]?.color || 'text-gray-400'}`}>
                                        리스크: {RISK_CONFIG[analysis.risk_level]?.label || analysis.risk_level}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{analysis.portfolio_summary}</p>
                        </div>

                        {/* Stock Insights */}
                        {analysis.stock_insights && analysis.stock_insights.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3">📊 종목별 AI 시그널</h4>
                                <div className="space-y-2">
                                    {analysis.stock_insights.map((insight, i) => {
                                        const config = SIGNAL_CONFIG[insight.signal] || SIGNAL_CONFIG.hold;
                                        const Icon = config.icon;
                                        return (
                                            <div key={i} className={`p-4 rounded-xl border ${config.bg}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Icon size={16} className={config.color} />
                                                        <span className="font-bold text-white text-sm">{insight.name}</span>
                                                        <span className="text-xs text-gray-500">({insight.symbol})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {insight.priority === 'high' && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-bold">긴급</span>
                                                        )}
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-[#333] ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-xs mt-1">{insight.reason}</p>
                                                <p className="text-gray-300 text-xs mt-1 font-medium">💡 {insight.action}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sector Analysis */}
                        {analysis.sector_analysis && (
                            <div className="text-sm text-gray-400 bg-[#252525] p-3 rounded-xl border border-[#333]">
                                <span className="font-bold text-gray-300">📈 업종 분석: </span>
                                {analysis.sector_analysis}
                            </div>
                        )}

                        {/* Overall Recommendation */}
                        {analysis.overall_recommendation && (
                            <div className="bg-gradient-to-r from-[#2a2a1e] to-[#1e1e1e] p-4 rounded-xl border border-[#F7D047]/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-[#F7D047]">🤖 주봇 종합 권고</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{analysis.overall_recommendation}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
