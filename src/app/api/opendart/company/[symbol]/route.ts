import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/opendart/company/[symbol]
 * 
 * OpenDART API 직접 호출로 재무 데이터 조회
 * - 기업 재무 요약 (매출, 영업이익, 순이익, ROE, CAGR)
 * - 배당 정보 (DPS, 배당성향, 연속 배당 연수)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;

    try {
        const { fetchFinancials, fetchDividends } = await import('@/lib/opendart');

        // 1. 재무 데이터 (최근 2개년 비교)
        const currentYear = new Date().getFullYear();
        const fin = await fetchFinancials(symbol, currentYear - 1);
        const finPrev = await fetchFinancials(symbol, currentYear - 2);
        const fin3y = await fetchFinancials(symbol, currentYear - 4);

        if (!fin) {
            return NextResponse.json({ error: 'Company not found in OpenDART' }, { status: 404 });
        }

        // CAGR (3년 평균 성장률)
        const calculateCAGR = (current: number | null, past: number | null, yearsDiff: number) => {
            if (!current || !past || past <= 0 || yearsDiff <= 0) return null;
            return (Math.pow(current / past, 1 / yearsDiff) - 1) * 100;
        };

        const revenue_cagr = calculateCAGR(fin.revenue, fin3y?.revenue || null, 3);
        const net_income_cagr = calculateCAGR(fin.netIncome, fin3y?.netIncome || null, 3);

        // Gross Margin (매출총이익률 없이: 영업이익률 대체)
        let operating_margin = null;
        if (fin.operatingProfit && fin.revenue) {
            operating_margin = (fin.operatingProfit / fin.revenue) * 100;
        }

        // ROE
        let roe = null;
        if (fin.netIncome && fin.equity) {
            roe = (fin.netIncome / fin.equity) * 100;
        }

        // 2. 배당 정보
        const div = await fetchDividends(symbol, currentYear - 1);
        const divPrev = await fetchDividends(symbol, currentYear - 2);

        // 연속 배당 연수 (최근 5년 检查)
        let consecutive_years = 0;
        for (let i = 1; i <= 5; i++) {
            const d = await fetchDividends(symbol, currentYear - i);
            if (d && d.dps && d.dps > 0) {
                consecutive_years++;
            } else {
                break;
            }
        }

        return NextResponse.json({
            corp_code: null, // filled internally
            base_year: fin.year,
            currency: 'KRW',
            financials: {
                revenue: fin.revenue || 0,
                revenue_cagr_3y: revenue_cagr,
                net_income_cagr_3y: net_income_cagr,
                gross_margin_1y: operating_margin,
                roe: roe,
                net_income: fin.netIncome || 0
            },
            dividends: {
                dps: div?.dps || null,
                payout_ratio: div?.payoutRatio || null,
                consecutive_years: consecutive_years
            }
        });

    } catch (error: any) {
        console.error("OpenDART API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
