"use client";

import { useEffect, useState } from 'react';

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
    // Remove any existing suffixes and clean up
    const cleaned = val.replace(/[%배억]/g, '').trim();
    if (!cleaned || cleaned === '-') return '-';
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

export default function FinancialGrid({ symbol }: FinancialGridProps) {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // Primary: KIS API (always available)
                const kisRes = await fetch(`/api/kis/company/${symbol}`);
                const kisJson = await kisRes.json();

                if (!isMounted) return;

                const stats = kisJson.stats || {};
                const fin = kisJson.financials || {};

                // Optional: OpenDART API (may not be available)
                let dartData: any = null;
                try {
                    const dartRes = await fetch(`/api/opendart/company/${symbol}`);
                    if (dartRes.ok) {
                        dartData = await dartRes.json();
                    }
                } catch {
                    // OpenDART not available, silently ignore
                }

                const dartFin = dartData?.financials || {};
                const dartDiv = dartData?.dividends || {};

                setData({
                    // KIS Stats
                    market_cap: stats.market_cap ? `${stats.market_cap}억` : '-',
                    per: stats.per ? `${stats.per}배` : '-',
                    pbr: stats.pbr ? `${stats.pbr}배` : '-',

                    // KIS Ratio (primary) / OpenDART (fallback)
                    roe: formatValue(fin.roe, '%') !== '-'
                        ? formatValue(fin.roe, '%')
                        : (dartFin.roe ? `${dartFin.roe.toFixed(1)}%` : '-'),

                    gross_margin: formatValue(fin.gross_margin, '%') !== '-'
                        ? formatValue(fin.gross_margin, '%')
                        : (dartFin.gross_margin_1y ? `${dartFin.gross_margin_1y.toFixed(1)}%` : '-'),

                    operating_margin: formatValue(fin.operating_margin, '%'),

                    // KIS Growth (primary) / OpenDART (fallback)
                    revenue_growth: formatValue(fin.growth_revenue, '%') !== '-'
                        ? formatValue(fin.growth_revenue, '%')
                        : (dartFin.revenue_cagr_3y ? `${dartFin.revenue_cagr_3y.toFixed(1)}%` : '-'),

                    profit_growth: formatValue(fin.growth_profit, '%') !== '-'
                        ? formatValue(fin.growth_profit, '%')
                        : (dartFin.net_income_cagr_3y ? `${dartFin.net_income_cagr_3y.toFixed(1)}%` : '-'),

                    // KIS Ratio
                    debt_ratio: formatValue(fin.debt_ratio, '%'),

                    // KIS Consensus
                    consensus: fin.consensus_price && fin.consensus_price !== '-'
                        ? `${Number(fin.consensus_price).toLocaleString()}원`
                        : '-'
                });

            } catch (error) {
                console.error("Failed to fetch financial data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [symbol]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F7D047]"></div>
            </div>
        );
    }

    if (!data) return <div className="text-center text-gray-500 py-4">데이터를 불러올 수 없습니다.</div>;

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
    );
}
