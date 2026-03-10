"use client";

import { useState, useCallback, useEffect } from 'react';
import { Brain, RefreshCw, ArrowUpRight, ArrowDownRight, Eye, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import JubotStockCard from './JubotStockCard';

interface StockInsight {
    symbol: string;
    name: string;
    signal: 'buy' | 'hold' | 'sell' | 'watch';
    reason: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    trade_review?: string | null;
    financial_highlight?: string | null;
    upcoming_events?: string | null;
    dividend_info?: string | null;
    related_news?: string | null;
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
    const { assets, getKrData, getUsData, goldData, krLoading, usLoading } = usePortfolio();
    const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
    const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [debugPriceMap, setDebugPriceMap] = useState<Record<string, number>>({});

    // Progress state
    const [progressStep, setProgressStep] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressDetail, setProgressDetail] = useState('');

    // Helper: get price & change from context
    const getContextData = useCallback((asset: { symbol: string; category: string }) => {
        if (asset.category === 'GOLD') return { price: goldData?.price > 0 ? goldData.price : 0, changePercent: 0 };
        const cleanSymbol = asset.symbol.replace('.KS', '');
        const data = asset.category === 'KR' ? getKrData(cleanSymbol) : getUsData(asset.symbol);
        return { price: data?.price || 0, changePercent: data?.changePercent || 0 };
    }, [getKrData, getUsData, goldData]);

    const fetchAnalysis = useCallback(async () => {
        if (!assets || assets.length === 0) return;

        setLoading(true);
        setError(false);
        setProgressStep('시세 데이터 준비');
        setProgressPercent(0);
        setProgressDetail('');

        try {
            const activeList = assets.filter(a => (a.quantity || 0) > 0 && a.symbol);

            if (activeList.length === 0) {
                setError(true);
                setLoading(false);
                return;
            }

            const totalSteps = 2; // prices (from context) + AI (서버에서 뉴스+공시+재무 통합 수집)
            let completedSteps = 0;

            // ── STEP 0: 가격 데이터 로딩 완료 대기 ──
            // PortfolioContext의 배치 가격 조회가 아직 진행 중이면 최대 15초 대기
            if (krLoading || usLoading) {
                setProgressStep('시세 데이터 로딩 대기...');
                setProgressDetail('가격 데이터를 불러오는 중입니다');
                setProgressPercent(5);

                const maxWait = 15000; // 15초
                const checkInterval = 500; // 0.5초마다 체크
                let waited = 0;

                await new Promise<void>((resolve) => {
                    const timer = setInterval(() => {
                        waited += checkInterval;
                        setProgressPercent(Math.min(8, Math.round((waited / maxWait) * 10)));
                        // 컴포넌트 리렌더시 krLoading/usLoading이 업데이트되지 않으므로
                        // 타이머 기반으로 대기 후 진행
                        if (waited >= maxWait) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, checkInterval);
                });

                console.log(`[Jubot] 가격 로딩 대기 ${waited / 1000}초 후 진행`);
            }

            // ── STEP 1: Context에서 현재가 + 등락률 즉시 조회 ──
            setProgressStep('시세 데이터 확인 중...');
            setProgressPercent(10);

            const priceMap: Record<string, number> = {};
            const changeRateMap: Record<string, number> = {};
            for (const a of activeList) {
                const { price, changePercent } = getContextData(a);
                if (price > 0) {
                    priceMap[a.symbol] = price;
                    changeRateMap[a.symbol] = changePercent;
                }
            }

            const zeroCount = activeList.length - Object.keys(priceMap).length;
            if (zeroCount > 0) {
                console.warn(`[Jubot] Context에서 ${zeroCount}개 종목 시세 미확인: ${activeList.filter(a => !priceMap[a.symbol]).map(s => s.name).join(', ')}`);
            } else {
                console.log(`[Jubot] ✅ Context에서 모든 ${activeList.length}종목 시세 확인 완료!`);
            }

            setDebugPriceMap({ ...priceMap });
            completedSteps++;

            // ── STEP 2: AI 분석 호출 (서버에서 뉴스+공시+재무 통합 수집) ──
            setProgressStep('AI 분석 요청 중...');
            setProgressDetail('뉴스 수집 + 공시 조회 + AI 분석을 서버에서 진행합니다');
            setProgressPercent(Math.round((completedSteps / totalSteps) * 100));

            const portfolioData = activeList.map(a => ({
                name: a.name,
                symbol: a.symbol,
                category: a.category,
                sector: a.sector || '',
                secondary_category: a.secondary_category || '',
                currentPrice: priceMap[a.symbol] || 0,
                avgPrice: a.pricePerShare || 0,
                quantity: a.quantity || 0,
                changeRate: changeRateMap[a.symbol] || 0,
                targetPriceUpper: a.targetPriceUpper || 0,
                targetPriceLower: a.targetPriceLower || 0,
                trades: (a as any).trades || [],
            }));

            // ── 평가금액 순 정렬 (높은 것부터) ──
            const sortedPortfolio = [...portfolioData].sort((a, b) => {
                const evalA = a.currentPrice * a.quantity;
                const evalB = b.currentPrice * b.quantity;
                return evalB - evalA;
            });

            console.log(`[Jubot] 전체 ${sortedPortfolio.length}종목 → 평가금액 순 정렬 완료`);

            // AI에 전달: 전체 종목 (평가금액 순)
            const res = await fetch('/api/jubot/analyze/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assets: sortedPortfolio,
                    allAssetsSummary: {
                        totalCount: sortedPortfolio.length,
                        totalCategories: [...new Set(sortedPortfolio.map(s => s.category))],
                        zeroPrice: sortedPortfolio.filter(s => s.currentPrice === 0).map(s => s.name),
                    },
                }),
            });
            completedSteps++;

            setProgressStep('분석 결과 처리 중...');
            setProgressPercent(Math.round((completedSteps / totalSteps) * 100));

            const data = await res.json();
            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
                setLastAnalysisTime(new Date().toLocaleString('ko-KR', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }));

                // SessionStorage에 저장
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('jubot_portfolio_analysis', JSON.stringify({
                        analysis: data.analysis,
                        timestamp: Date.now()
                    }));
                }

                // 히스토리 자동 저장
                try {
                    await fetch('/api/jubot/history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            analysis_type: 'portfolio_insight',
                            content: data.analysis,
                        }),
                    });
                } catch (saveErr) {
                    console.warn('[Jubot] History save failed:', saveErr);
                }
            } else {
                setError(true);
            }

            setProgressPercent(100);
        } catch (e) {
            console.error('[JubotPortfolio] Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [assets, getContextData]);

    // Check cache on mount
    const checkCache = useCallback(async () => {
        if (!assets || assets.length === 0) return;

        // 이미 분석 결과가 있으면 스킵 (or could refresh)
        if (analysis) return;

        setLoading(true);
        try {
            const res = await fetch('/api/jubot/history?type=portfolio_insight&limit=1');
            const data = await res.json();
            if (data.success && data.history && data.history.length > 0) {
                const latest = data.history[0];
                // You might want to check if it's "too old", but user requirement is just "previous analysis"
                setAnalysis(latest.content);
                setLastAnalysisTime(new Date(latest.created_at).toLocaleString('ko-KR', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }));
            }
        } catch (e) {
            console.warn('[JubotPortfolio] Cache check failed', e);
        } finally {
            setLoading(false);
        }
    }, [assets, analysis]);

    // Initial load
    useState(() => {
        // assets might be empty initially, so we might need useEffect
    });

    // Use useEffect for initial check
    // Use useEffect for initial check
    useEffect(() => {
        const check = async () => {
            if (!assets || assets.length === 0) return;
            if (analysis) return;

            // 1. SessionStorage 확인
            if (typeof window !== 'undefined') {
                const cached = sessionStorage.getItem('jubot_portfolio_analysis');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        // 1시간 이내 데이터만 유효하다고 가정? 아니면 그냥 보여줌?
                        // 사용자 요청은 "페이지 이동시 바로 정보 불러옴"
                        setAnalysis(parsed.analysis);
                        const date = new Date(parsed.timestamp);
                        setLastAnalysisTime(date.toLocaleString('ko-KR', {
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }));
                        return;
                    } catch (e) {
                        // ignore
                    }
                }
            }

            // 2. 서버 히스토리 확인 (기존 checkCache)
            // checkCache 함수 내용 인라인 또는 호출
            await checkCache();
        };

        check();
    }, [assets, analysis, checkCache]);

    const activeAssets = assets?.filter(a => (a.quantity || 0) > 0) || [];

    return (
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-4 sm:px-6 border-b border-[#333] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Brain size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">🔍 JUBOT의 내 주식 분석</h2>
                        <p className="text-sm text-gray-500">
                            보유 {activeAssets.length}개 종목에 대한 전문가 분석
                            {lastAnalysisTime && <span className="ml-2 text-purple-400">• 분석 시간: {lastAnalysisTime}</span>}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAnalysis}
                    disabled={loading || activeAssets.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold text-base hover:bg-purple-500 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? '분석 중...' : analysis ? '재분석' : '분석 시작'}
                </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
                {/* ── Loading with Progress Bar ── */}
                {loading && !analysis && (
                    <div className="flex flex-col items-center justify-center py-16 gap-5">
                        {/* Animated moon icon */}
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                                <svg width="64" height="64" viewBox="0 0 64 64">
                                    <path
                                        d="M32 8 A24 24 0 0 1 56 32"
                                        fill="none"
                                        stroke="#F7D047"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>

                        <p className="text-white text-xl font-bold">포트폴리오 분석 중...</p>
                        <p className="text-gray-400 text-sm">{progressDetail || progressStep}</p>

                        {/* Progress Bar */}
                        <div className="w-80 max-w-full">
                            <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-end mt-1">
                                <span className="text-xs text-gray-500">{progressPercent}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading overlay when re-analyzing */}
                {loading && analysis && (
                    <div className="mb-4 p-3 rounded-xl bg-purple-900/20 border border-purple-900/30">
                        <div className="flex items-center gap-3 mb-2">
                            <RefreshCw size={14} className="animate-spin text-purple-400" />
                            <span className="text-sm text-purple-300 font-medium">{progressStep}</span>
                            <span className="text-xs text-gray-500">{progressDetail}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {error && !analysis && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <ShieldAlert size={32} className="text-yellow-500" />
                        <p className="text-gray-400">분석에 실패했습니다</p>
                        <button onClick={fetchAnalysis} className="text-purple-400 text-base hover:underline">
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && !analysis && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <Sparkles size={40} className="text-purple-400" />
                        <div>
                            <p className="text-gray-300 font-bold text-xl">
                                {activeAssets.length > 0
                                    ? '보유 종목을 분석할 준비가 되었습니다'
                                    : '분석할 종목이 없습니다'}
                            </p>
                            <p className="text-gray-500 text-base mt-1">
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
                                <span className="text-base font-bold text-purple-300">포트폴리오 종합 평가</span>
                                {analysis.risk_level && (
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-[#333] ${RISK_CONFIG[analysis.risk_level]?.color || 'text-gray-400'}`}>
                                        리스크: {RISK_CONFIG[analysis.risk_level]?.label || analysis.risk_level}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-300 text-base leading-relaxed">{analysis.portfolio_summary}</p>
                        </div>

                        {/* Stock Insights — 중요 이슈 종목만 */}
                        {analysis.stock_insights && analysis.stock_insights.length > 0 && (
                            <div>
                                <h4 className="text-base font-bold text-gray-400 mb-3">📊 종목별 AI 시그널 (주요 이슈)</h4>
                                <div className="space-y-2">
                                    {analysis.stock_insights.map((insight, i) => {
                                        const config = SIGNAL_CONFIG[insight.signal] || SIGNAL_CONFIG.hold;
                                        const Icon = config.icon;
                                        const price = debugPriceMap[insight.symbol] || 0;
                                        const asset = activeAssets.find(a => a.symbol === insight.symbol);
                                        const isUS = asset?.category === 'US';

                                        return (
                                            <div key={i} className={`p-4 rounded-xl border ${config.bg} cursor-pointer hover:brightness-110 transition-all`}
                                                onClick={() => {
                                                    if (asset) {
                                                        setSelectedStock({
                                                            symbol: asset.symbol,
                                                            name: asset.name,
                                                            category: asset.category,
                                                            currentPrice: asset.pricePerShare,
                                                            avgPrice: asset.pricePerShare,
                                                            quantity: asset.quantity,
                                                            targetPriceUpper: asset.targetPriceUpper,
                                                            targetPriceLower: asset.targetPriceLower,
                                                        });
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Icon size={18} className={config.color} />
                                                        <span className="font-bold text-white text-base">{insight.name}</span>
                                                        <span className="text-sm text-gray-500">({insight.symbol})</span>
                                                        {/* 현재가 */}
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${price > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                            {isUS ? '$' : '₩'}{price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {insight.priority === 'high' && (
                                                            <span className="text-sm px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-bold">긴급</span>
                                                        )}
                                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-[#333] ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                        <ChevronRight size={14} className="text-gray-600" />
                                                    </div>
                                                </div>
                                                {/* 주요 요약 (Reason) */}
                                                <div className="mt-3 mb-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#2a2a2a]">
                                                    <p className="text-gray-300 text-sm leading-relaxed">{insight.reason}</p>
                                                </div>

                                                {/* 상세 정보 그리드 */}
                                                {(insight.financial_highlight || insight.upcoming_events || insight.dividend_info) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                        {insight.financial_highlight && (
                                                            <div className="flex items-start gap-2 bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2a2a2a]">
                                                                <span className="text-gray-500 shrink-0">📊</span>
                                                                <p className="text-gray-400 text-xs leading-snug">{insight.financial_highlight}</p>
                                                            </div>
                                                        )}
                                                        {insight.upcoming_events && (
                                                            <div className="flex items-start gap-2 bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2a2a2a]">
                                                                <span className="text-gray-500 shrink-0">📅</span>
                                                                <p className="text-gray-400 text-xs leading-snug">{insight.upcoming_events}</p>
                                                            </div>
                                                        )}
                                                        {insight.dividend_info && (
                                                            <div className="flex items-start gap-2 bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2a2a2a]">
                                                                <span className="text-gray-500 shrink-0">💰</span>
                                                                <p className="text-gray-400 text-xs leading-snug">{insight.dividend_info}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 추가 정보 (뉴스 / 트레이드 리뷰) */}
                                                {(insight.trade_review || insight.related_news) && (
                                                    <div className="flex flex-col gap-1.5 mb-3 px-1">
                                                        {insight.trade_review && (
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-gray-500 shrink-0 text-xs mt-0.5">📈</span>
                                                                <p className="text-gray-400 text-xs">{insight.trade_review}</p>
                                                            </div>
                                                        )}
                                                        {insight.related_news && (
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-gray-500 shrink-0 text-xs mt-0.5">📰</span>
                                                                <p className="text-gray-400 text-xs">{insight.related_news}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 액션 플랜 (Action) */}
                                                <div className="mt-3 pt-3 border-t border-[#333] flex items-start gap-2">
                                                    <span className="text-[#F7D047] shrink-0">💡</span>
                                                    <p className="text-gray-200 text-sm font-medium leading-snug">{insight.action}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sector Analysis */}
                        {analysis.sector_analysis && (
                            <div className="text-base text-gray-400 bg-[#252525] p-3 rounded-xl border border-[#333]">
                                <span className="font-bold text-gray-300">📈 업종 분석: </span>
                                {analysis.sector_analysis}
                            </div>
                        )}

                        {/* Overall Recommendation */}
                        {analysis.overall_recommendation && (
                            <div className="bg-gradient-to-r from-[#2a2a1e] to-[#1e1e1e] p-4 rounded-xl border border-[#F7D047]/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base font-bold text-[#F7D047]">🤖 주봇 종합 권고</span>
                                </div>
                                <p className="text-gray-300 text-base leading-relaxed">{analysis.overall_recommendation}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stock Detail Modal */}
            {selectedStock && (
                <JubotStockCard
                    key={selectedStock.symbol}
                    isOpen={!!selectedStock}
                    onClose={() => setSelectedStock(null)}
                    stock={selectedStock}
                />
            )}
        </div>
    );
}
