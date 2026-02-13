"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Activity, Percent } from 'lucide-react';

interface FinancialGridProps {
    symbol: string;
}

interface FinancialData {
    market_cap: string;        // KIS
    revenue_cagr: string;      // OpenDART
    net_income_cagr: string;   // OpenDART
    gross_margin: string;      // OpenDART
    per: string;               // KIS
    pbr: string;               // KIS
    roe: string;               // OpenDART
    dividend_yield: string;    // KIS
    payout_ratio: string;      // OpenDART
    consecutive_div: string;   // OpenDART
}

export default function FinancialGrid({ symbol }: FinancialGridProps) {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // Parallel Fetch
                const [kisRes, dartRes] = await Promise.all([
                    fetch(`/api/kis/company/${symbol}`),
                    fetch(`/api/opendart/company/${symbol}`)
                ]);

                const kisJson = await kisRes.json();
                const dartJson = await dartRes.json();

                if (isMounted) {
                    // Process KIS Data
                    const kisStats = kisJson.stats || {};
                    // Process OpenDART Data
                    const dartExec = dartJson.financials || {};
                    const dartDiv = dartJson.dividends || {};

                    setData({
                        market_cap: kisStats.market_cap ? `${kisStats.market_cap}억` : '-',
                        per: kisStats.per ? `${kisStats.per}배` : '-',
                        pbr: kisStats.pbr ? `${kisStats.pbr}배` : '-',
                        dividend_yield: kisStats.dividend_yield ? `${kisStats.dividend_yield}%` : '-', // API might not have this, check client.ts

                        revenue_cagr: dartExec.revenue_cagr_3y ? `${dartExec.revenue_cagr_3y.toFixed(1)}%` : '-',
                        net_income_cagr: dartExec.net_income_cagr_3y ? `${dartExec.net_income_cagr_3y.toFixed(1)}%` : '-',
                        gross_margin: dartExec.gross_margin_1y ? `${dartExec.gross_margin_1y.toFixed(1)}%` : '-',
                        roe: dartExec.roe ? `${dartExec.roe.toFixed(1)}%` : '-',
                        payout_ratio: dartDiv.payout_ratio ? `${dartDiv.payout_ratio}%` : '-',
                        consecutive_div: dartDiv.consecutive_years > 0 ? `${dartDiv.consecutive_years}년 이상` : '-'
                    });
                }
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!data) return <div className="text-center text-gray-500 py-4">데이터를 불러올 수 없습니다.</div>;

    const items = [
        { label: "시가총액", value: data.market_cap },
        { label: "매출액 증감률 (3년)", value: data.revenue_cagr, color: parseFloat(data.revenue_cagr) > 0 ? 'text-red-400' : (parseFloat(data.revenue_cagr) < 0 ? 'text-blue-400' : 'text-white') },
        { label: "순수익 증감률 (3년)", value: data.net_income_cagr, color: parseFloat(data.net_income_cagr) > 0 ? 'text-red-400' : (parseFloat(data.net_income_cagr) < 0 ? 'text-blue-400' : 'text-white') },
        { label: "매출총이익률 (1년)", value: data.gross_margin },
        { label: "PER", value: data.per },
        { label: "PBR", value: data.pbr },
        { label: "ROE (1년)", value: data.roe },
        { label: "배당수익률", value: data.dividend_yield }, // KIS data usually relies on prev close
        { label: "배당성향", value: data.payout_ratio },
        { label: "배당연속지급", value: data.consecutive_div }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {items.map((item, idx) => (
                <div key={idx} className="bg-[#1e1e1e] p-4 rounded-xl border border-[#333]">
                    <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                    <div className={`text-lg font-bold ${item.color || 'text-white'}`}>
                        {item.value || '-'}
                    </div>
                </div>
            ))}
        </div>
    );
}
