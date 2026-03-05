"use client";

import { useEffect, useState, useCallback } from 'react';
import StockLoadError from '@/components/ui/StockLoadError';
import { RefreshCw } from 'lucide-react';

interface FinancialGridProps {
    symbol: string;
}

interface FinancialData {
    market_cap: string;
    revenue_growth: string;
    profit_growth: string;
    gross_margin: string;
    per: string;
    pbr: string;
    roe: string;
    operating_margin: string;
    debt_ratio: string;
    consensus: string;
}

function formatValue(val: string | undefined | null, suffix: string = ''): string {
    if (!val || val === '-' || val === '' || val === 'null' || val === 'undefined') return '-';
    const cleaned = val.replace(/[%배억원,]/g, '').trim();
    if (!cleaned || cleaned === '-') return '-';
    // Treat 0 or 0.00 as missing data
    const num = parseFloat(cleaned);
    if (isNaN(num) || num === 0) return '-';
    return `${cleaned}${suffix}`;
}

function getColorClass(val: string | undefined | null): string {
    if (!val || val === '-') return 'text-white';
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return 'text-white';
    if (num > 0) return 'text-red-400';
    if (num < 0) return 'text-blue-400';
    return 'text-white';
}

// 핵심 지표 키: 이 중 절반 이상이 유효해야 데이터를 '성공'으로 판정
const CORE_KEYS: (keyof FinancialData)[] = ['market_cap', 'per', 'pbr', 'roe', 'operating_margin', 'debt_ratio'];
const MIN_CORE_COUNT = 3; // 최소 3개 이상의 핵심 지표가 유효해야 함

export default function FinancialGrid({ symbol }: FinancialGridProps) {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [partialData, setPartialData] = useState(false); // 일부 데이터만 있는 상태
    const [retryTrigger, setRetryTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(false);
        setPartialData(false);

        const maxRetries = 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (attempt > 0) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                // Primary: KIS API
                const kisRes = await fetch(`/api/kis/company/${symbol}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const kisJson = await kisRes.json();
                const stats = kisJson.stats || {};
                const fin = kisJson.financials || {};

                // Optional: OpenDART API (parallel, non-blocking)
                let dartData: any = null;
                try {
                    const dartController = new AbortController();
                    const dartTimeoutId = setTimeout(() => dartController.abort(), 8000);
                    const dartRes = await fetch(`/api/opendart/company/${symbol}`, {
                        signal: dartController.signal
                    });
                    clearTimeout(dartTimeoutId);
                    if (dartRes.ok) {
                        dartData = await dartRes.json();
                    }
                } catch {
                    // OpenDART not available, silently ignore
                }

                const dartFin = dartData?.financials || {};

                const result: FinancialData = {
                    market_cap: stats.market_cap && stats.market_cap !== '-'
                        ? `${Number(stats.market_cap).toLocaleString()}억` : '-',
                    per: stats.per && stats.per !== '-' ? `${stats.per}배` : '-',
                    pbr: stats.pbr && stats.pbr !== '-' ? `${stats.pbr}배` : '-',
                    roe: formatValue(fin.roe, '%') !== '-'
                        ? formatValue(fin.roe, '%')
                        : (dartFin.roe ? `${dartFin.roe.toFixed(1)}%` : '-'),
                    gross_margin: formatValue(fin.gross_margin, '%'),
                    operating_margin: formatValue(fin.operating_margin, '%') !== '-'
                        ? formatValue(fin.operating_margin, '%')
                        : (dartFin.operating_margin ? `${dartFin.operating_margin.toFixed(1)}%` : '-'),
                    revenue_growth: formatValue(fin.growth_revenue, '%') !== '-'
                        ? formatValue(fin.growth_revenue, '%')
                        : (dartFin.revenue_cagr_3y ? `${dartFin.revenue_cagr_3y.toFixed(1)}%` : '-'),
                    profit_growth: formatValue(fin.growth_profit, '%') !== '-'
                        ? formatValue(fin.growth_profit, '%')
                        : (dartFin.operating_profit_cagr_3y ? `${dartFin.operating_profit_cagr_3y.toFixed(1)}%` : '-'),
                    debt_ratio: formatValue(fin.debt_ratio, '%') !== '-'
                        ? formatValue(fin.debt_ratio, '%')
                        : (dartFin.debt_ratio ? `${dartFin.debt_ratio.toFixed(1)}%` : '-'),
                    consensus: fin.consensus_price && fin.consensus_price !== '-'
                        ? `${Number(fin.consensus_price).toLocaleString()}원`
                        : '-'
                };

                // 품질 검사: 핵심 지표 중 유효 값 개수 카운트
                const coreValidCount = CORE_KEYS.filter(k => result[k] !== '-').length;
                const hasAnyData = Object.values(result).some(v => v !== '-');

                if (coreValidCount >= MIN_CORE_COUNT) {
                    // 충분한 데이터 → 성공
                    setData(result);
                    setLoading(false);
                    setPartialData(false);
                    return;
                } else if (hasAnyData && attempt === maxRetries) {
                    // 마지막 시도인데 일부 데이터만 있음 → 일단 보여주되 리프레시 가능
                    setData(result);
                    setLoading(false);
                    setPartialData(true);
                    return;
                }
                // 데이터 부족 → 다음 시도로 넘어감
                console.warn(`[FinancialGrid] Attempt ${attempt + 1}: only ${coreValidCount}/${CORE_KEYS.length} core metrics valid, retrying...`);
            } catch (e) {
                console.warn(`[FinancialGrid] Attempt ${attempt + 1} failed:`, e);
            }
        }

        // All retries failed
        setLoading(false);
        setError(true);
    }, [symbol]);

    useEffect(() => {
        fetchData();
    }, [symbol, retryTrigger]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F7D047]"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <StockLoadError
                message="기업 재무 데이터를 불러올 수 없습니다"
                onRetry={() => setRetryTrigger(prev => prev + 1)}
                variant="section"
                retrying={loading}
            />
        );
    }

    const items = [
        { label: "시가총액", value: data.market_cap },
        { label: "매출 성장률", value: data.revenue_growth, color: getColorClass(data.revenue_growth) },
        { label: "영업이익 성장률", value: data.profit_growth, color: getColorClass(data.profit_growth) },
        { label: "매출총이익률", value: data.gross_margin },
        { label: "PER", value: data.per },
        { label: "PBR", value: data.pbr },
        { label: "ROE", value: data.roe },
        { label: "영업이익률", value: data.operating_margin },
        { label: "부채비율", value: data.debt_ratio },
        { label: "목표가(컨센서스)", value: data.consensus }
    ];

    return (
        <div className="relative">
            {/* 부분 데이터 경고 + 리프레시 버튼 */}
            {partialData && (
                <div className="flex items-center justify-end mb-2">
                    <button
                        onClick={() => setRetryTrigger(prev => prev + 1)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[11px] font-medium transition"
                        title="일부 데이터가 누락되었습니다. 다시 불러오기"
                    >
                        <RefreshCw size={12} />
                        <span>일부 누락 · 다시 불러오기</span>
                    </button>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-[#1e1e1e] p-4 rounded-xl border border-[#333] hover:border-[#555] transition-colors">
                        <div className="text-[11px] text-gray-400 mb-1.5">{item.label}</div>
                        <div className={`text-lg font-bold ${item.color || 'text-white'}`}>
                            {item.value || '-'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
