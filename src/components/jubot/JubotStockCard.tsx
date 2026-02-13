"use client";

import { useState, useCallback } from 'react';
import { X, Brain, TrendingUp, TrendingDown, Shield, AlertTriangle, Lightbulb, Target, BarChart3, Newspaper, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface StockAnalysis {
    overall_signal: 'buy' | 'hold' | 'sell' | 'watch';
    confidence: 'high' | 'medium' | 'low';
    summary: string;
    financial_analysis?: {
        revenue_trend: string;
        profitability: string;
        financial_health: string;
    };
    news_impact: string;
    risk_factors: string[];
    opportunity_factors: string[];
    target_price_opinion: string;
    action_plan: string;
}

interface FinancialRow {
    year: number;
    revenue_억: number | null;
    operating_profit_억: number | null;
    net_income_억: number | null;
    equity_억: number | null;
}

interface JubotStockCardProps {
    isOpen: boolean;
    onClose: () => void;
    stock: {
        symbol: string;
        name: string;
        category: string;
        currentPrice?: number;
        avgPrice?: number;
        quantity?: number;
        targetPriceUpper?: number;
        targetPriceLower?: number;
    };
}

const SIGNAL_CONFIG = {
    buy: { label: '매수', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-900/40', icon: TrendingUp },
    hold: { label: '보유', color: 'text-gray-300', bg: 'bg-[#252525]', border: 'border-[#444]', icon: Shield },
    sell: { label: '매도', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-900/40', icon: TrendingDown },
    watch: { label: '관망', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40', icon: AlertTriangle },
};

const CONFIDENCE_LABEL: Record<string, string> = {
    high: '높음',
    medium: '보통',
    low: '낮음',
};

export default function JubotStockCard({ isOpen, onClose, stock }: JubotStockCardProps) {
    const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
    const [financials, setFinancials] = useState<FinancialRow[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [realPrice, setRealPrice] = useState<number>(0);

    const fetchAnalysis = useCallback(async () => {
        setLoading(true);
        setError(false);

        try {
            const res = await fetch('/api/jubot/analyze/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    category: stock.category,
                    currentPrice: 0, // force API to fetch real price from KIS
                    avgPrice: stock.avgPrice,
                    quantity: stock.quantity,
                    targetPriceUpper: stock.targetPriceUpper,
                    targetPriceLower: stock.targetPriceLower,
                }),
            });

            const data = await res.json();
            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
                setFinancials(data.raw_financials || null);
                if (data.current_price) setRealPrice(data.current_price);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error('[JubotStockCard] Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [stock]);

    // Auto-fetch on open
    const [hasFetched, setHasFetched] = useState(false);
    if (isOpen && !hasFetched && !loading && !analysis) {
        setHasFetched(true);
        fetchAnalysis();
    }

    if (!isOpen) return null;

    const signalConfig = analysis ? (SIGNAL_CONFIG[analysis.overall_signal] || SIGNAL_CONFIG.hold) : null;
    const SignalIcon = signalConfig?.icon || Shield;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#1e1e1e] rounded-2xl border border-[#333] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#1e1e1e] px-6 py-4 border-b border-[#333] flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{stock.name}</h2>
                            <p className="text-sm text-gray-500">{stock.symbol} · {stock.category === 'US' ? '미국' : '한국'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {analysis && (
                            <button onClick={fetchAnalysis} disabled={loading}
                                className="p-2 rounded-lg hover:bg-[#333] transition-colors">
                                <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#333] transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#333] border-t-purple-500"></div>
                            <p className="text-gray-400 text-base">{stock.name} 심층 분석 중...</p>
                            <p className="text-gray-500 text-sm">재무 데이터 + 뉴스를 종합 분석하고 있습니다</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="flex flex-col items-center py-12 gap-3">
                            <AlertTriangle size={32} className="text-yellow-500" />
                            <p className="text-gray-400">분석에 실패했습니다</p>
                            <button onClick={fetchAnalysis} className="text-purple-400 text-base hover:underline">다시 시도</button>
                        </div>
                    )}

                    {/* Analysis Result */}
                    {analysis && !loading && (
                        <>
                            {/* Signal Badge */}
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${signalConfig?.bg} ${signalConfig?.border}`}>
                                <div className="flex items-center gap-3">
                                    <SignalIcon size={24} className={signalConfig?.color} />
                                    <div>
                                        <span className={`text-2xl font-black ${signalConfig?.color}`}>
                                            {signalConfig?.label}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            신뢰도: {CONFIDENCE_LABEL[analysis.confidence] || analysis.confidence}
                                        </span>
                                    </div>
                                </div>
                                {realPrice > 0 && (
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">
                                            {stock.category === 'US' ? formatCurrency(realPrice, 'USD') : `${formatCurrency(realPrice, 'KRW')}원`}
                                        </div>
                                        {stock.avgPrice && stock.avgPrice > 0 && (
                                            <div className={`text-sm font-bold ${realPrice >= stock.avgPrice ? 'text-red-400' : 'text-blue-400'
                                                }`}>
                                                {((realPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-4 rounded-xl border border-purple-900/30">
                                <p className="text-gray-200 text-base leading-relaxed">{analysis.summary}</p>
                            </div>

                            {/* Financial Analysis */}
                            {analysis.financial_analysis && (
                                <div>
                                    <h4 className="text-base font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <BarChart3 size={18} className="text-purple-400" /> 재무 분석
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="bg-[#252525] p-3 rounded-xl border border-[#333]">
                                            <span className="text-sm font-bold text-gray-400">매출 추이</span>
                                            <p className="text-gray-200 text-base mt-1">{analysis.financial_analysis.revenue_trend}</p>
                                        </div>
                                        <div className="bg-[#252525] p-3 rounded-xl border border-[#333]">
                                            <span className="text-sm font-bold text-gray-400">수익성</span>
                                            <p className="text-gray-200 text-base mt-1">{analysis.financial_analysis.profitability}</p>
                                        </div>
                                        <div className="bg-[#252525] p-3 rounded-xl border border-[#333]">
                                            <span className="text-sm font-bold text-gray-400">재무 건전성</span>
                                            <p className="text-gray-200 text-base mt-1">{analysis.financial_analysis.financial_health}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financial Data Table */}
                            {financials && financials.length > 0 && (
                                <div>
                                    <h4 className="text-base font-bold text-gray-400 mb-3">📊 재무 데이터 (억원)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[#333]">
                                                    <th className="text-left text-gray-500 py-2 px-2">연도</th>
                                                    <th className="text-right text-gray-500 py-2 px-2">매출</th>
                                                    <th className="text-right text-gray-500 py-2 px-2">영업이익</th>
                                                    <th className="text-right text-gray-500 py-2 px-2">순이익</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financials.map((f, i) => (
                                                    <tr key={i} className="border-b border-[#222]">
                                                        <td className="py-2 px-2 font-bold text-gray-300">{f.year}</td>
                                                        <td className="py-2 px-2 text-right text-gray-200 font-mono">{f.revenue_억?.toLocaleString() || '-'}</td>
                                                        <td className={`py-2 px-2 text-right font-mono ${(f.operating_profit_억 || 0) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                            {f.operating_profit_억?.toLocaleString() || '-'}
                                                        </td>
                                                        <td className={`py-2 px-2 text-right font-mono ${(f.net_income_억 || 0) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                            {f.net_income_억?.toLocaleString() || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* News Impact */}
                            <div className="bg-[#252525] p-4 rounded-xl border border-[#333]">
                                <h4 className="text-base font-bold text-gray-400 mb-2 flex items-center gap-2">
                                    <Newspaper size={18} className="text-[#F7D047]" /> 뉴스 영향
                                </h4>
                                <p className="text-gray-200 text-base">{analysis.news_impact}</p>
                            </div>

                            {/* Risk & Opportunity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Risks */}
                                <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30">
                                    <h4 className="text-base font-bold text-blue-400 mb-2">⚠️ 리스크 요인</h4>
                                    <ul className="space-y-1.5">
                                        {analysis.risk_factors?.map((r, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="text-blue-400 font-bold mt-0.5">•</span>
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Opportunities */}
                                <div className="bg-red-900/10 p-4 rounded-xl border border-red-900/30">
                                    <h4 className="text-base font-bold text-red-400 mb-2">💡 기회 요인</h4>
                                    <ul className="space-y-1.5">
                                        {analysis.opportunity_factors?.map((o, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="text-red-400 font-bold mt-0.5">•</span>
                                                <span>{o}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Target Price Opinion */}
                            <div className="bg-[#252525] p-4 rounded-xl border border-[#333]">
                                <h4 className="text-base font-bold text-gray-400 mb-2 flex items-center gap-2">
                                    <Target size={18} className="text-[#F7D047]" /> 목표가 의견
                                </h4>
                                <p className="text-gray-200 text-base">{analysis.target_price_opinion}</p>
                            </div>

                            {/* Action Plan */}
                            <div className="bg-gradient-to-r from-[#2a2a1e] to-[#1e1e1e] p-4 rounded-xl border border-[#F7D047]/20">
                                <h4 className="text-base font-bold text-[#F7D047] mb-2 flex items-center gap-2">
                                    <Lightbulb size={18} /> 행동 가이드
                                </h4>
                                <p className="text-gray-200 text-base leading-relaxed">{analysis.action_plan}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
