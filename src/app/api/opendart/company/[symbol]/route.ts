import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;
    const supabase = await createClient();

    try {
        // 1. Find corp_code by stock_code (symbol)
        const { data: company, error: companyError } = await supabase
            .from('dart_companies')
            .select('corp_code, corp_name')
            .eq('stock_code', symbol)
            .single();

        if (companyError || !company) {
            return NextResponse.json({ error: 'Company not found in OpenDART database' }, { status: 404 });
        }

        const corpCode = company.corp_code;

        // 2. Fetch Financials (Last 4 years to calculate 3-year growth/CAGR)
        // We look for standard account names. 
        // Note: account_nm might vary. We try to match common names.
        // 매출액: "매출액", "수익(매출액)"
        // 영업이익: "영업이익", "영업이익(손실)"
        // 당기순이익: "당기순이익", "당기순이익(손실)"
        // 자본총계: "자본총계"

        const { data: financials, error: finError } = await supabase
            .from('dart_financials')
            .select('*')
            .eq('corp_code', corpCode)
            .in('fs_div', ['CFS', 'OFS']) // Prefer CFS (Consolidated), fallback to OFS (Separate)
            .order('year', { ascending: false });

        if (finError) throw finError;

        // 3. Fetch Dividends
        const { data: dividends, error: divError } = await supabase
            .from('dart_dividends')
            .select('*')
            .eq('corp_code', corpCode)
            .order('year', { ascending: false });

        if (divError) throw divError;

        // --- Process Data ---

        // Helper to find value from socials
        // Priority: CFS > OFS
        // Years available in data
        const years = Array.from(new Set(financials.map(f => f.year))).sort((a, b) => b - a);
        const latestYear = years[0]; // e.g., 2023

        const getValue = (targetYear: number, accountKeywords: string[]) => {
            // Try CFS first
            let item = financials.find(f =>
                f.year === targetYear &&
                f.fs_div === 'CFS' &&
                accountKeywords.some(k => f.account_nm.includes(k))
            );
            if (!item) {
                // Try OFS
                item = financials.find(f =>
                    f.year === targetYear &&
                    f.fs_div === 'OFS' &&
                    accountKeywords.some(k => f.account_nm.includes(k))
                );
            }
            return item ? item.amount : null;
        };

        // Calculate CAGR (3 Years): (End/Start)^(1/3) - 1
        // Start Year = Latest - 3
        const calculateCAGR = (current: number | null, past: number | null, yearsDiff: number) => {
            if (!current || !past || past <= 0 || yearsDiff <= 0) return null;
            return (Math.pow(current / past, 1 / yearsDiff) - 1) * 100;
        };

        // Calculate Growth Rate (YoY)
        const calculateYoY = (current: number | null, prev: number | null) => {
            if (!current || !prev || prev === 0) return null;
            return ((current - prev) / Math.abs(prev)) * 100;
        };

        // Data Points
        const revenue = getValue(latestYear, ['매출액', '수익']);
        const revenue_prev = getValue(latestYear - 1, ['매출액', '수익']);
        const revenue_3y = getValue(latestYear - 3, ['매출액', '수익']);

        const profit = getValue(latestYear, ['영업이익']);
        // const profit_prev = getValue(latestYear - 1, ['영업이익']);

        const netIncome = getValue(latestYear, ['당기순이익', '법인세비용차감전순이익']); // Fallback logic needed? Pure net income usually '당기순이익'
        const netIncome_prev = getValue(latestYear - 1, ['당기순이익']);
        const netIncome_3y = getValue(latestYear - 3, ['당기순이익']);

        const equity = getValue(latestYear, ['자본총계']);
        // const equity_prev = getValue(latestYear - 1, ['자본총계']);

        const grossProfit = getValue(latestYear, ['매출총이익']); // Not always available in API summary

        // Metrics
        const revenue_cagr = calculateCAGR(revenue, revenue_3y, 3); // 3-year avg growth
        const net_income_cagr = calculateCAGR(netIncome, netIncome_3y, 3); // 3-year avg growth

        // Gross Margin (매출총이익률) = (매출총이익 / 매출액) * 100
        // If Gross Profit not found, try (Revenue - CostOfSales) ? API might not give CostOfSales in summary.
        // Let's rely on '매출총이익' existing or skip.
        let gross_margin = null;
        if (grossProfit && revenue) {
            gross_margin = (grossProfit / revenue) * 100;
        }

        // ROE = Net Income / Equity * 100
        let roe = null;
        if (netIncome && equity) {
            roe = (netIncome / equity) * 100;
        }

        // Dividends
        // Payout Ratio = Total Dividend / Net Income * 100
        // We need Total Dividend Amount. 'category'='주당배당금' is per share.
        // We look for '배당금총액' or calculate (DPS * Shares)?
        // OpenDART dividend API usually gives '배당성향' directly as a category '배당성향(%)' or similar.
        // Let's check 'category' in dividends data.

        const divInfo = dividends.filter(d => d.year === latestYear);
        const payoutRatioItem = dividends.find(d => d.year === latestYear && d.category.includes('배당성향'));
        const payout_ratio = payoutRatioItem ? payoutRatioItem.value_current : null;

        const dpsItem = dividends.find(d => d.year === latestYear && d.category.includes('주당배당금') && d.stock_kind.includes('보통주'));
        const dps = dpsItem ? dpsItem.value_current : null;

        // Consecutive Dividend Years
        let consecutive_years = 0;
        for (let y = latestYear; y >= latestYear - 10; y--) {
            const d = dividends.find(item => item.year === y && item.stock_kind.includes('보통주') && item.category.includes('주당배당금'));
            if (d && d.value_current > 0) {
                consecutive_years++;
            } else {
                if (consecutive_years > 0) break; // Streak broken
                // If broken at start (latest year has no div), keep checking? No, current streak implies starting from now/last year.
                // If latest year has no div, streak is 0? Or check previous?
                // Usually means "consecutive up to now/last report".
            }
        }

        return NextResponse.json({
            corp_code: corpCode,
            base_year: latestYear,
            currency: 'KRW',
            financials: {
                revenue: revenue || 0,
                revenue_cagr_3y: revenue_cagr,
                net_income_cagr_3y: net_income_cagr,
                gross_margin_1y: gross_margin, // TTM usually, here it's last year
                roe: roe,
                net_income: netIncome || 0
            },
            dividends: {
                dps: dps,
                payout_ratio: payout_ratio,
                consecutive_years: consecutive_years
            }
        });

    } catch (error: any) {
        console.error("OpenDART API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
