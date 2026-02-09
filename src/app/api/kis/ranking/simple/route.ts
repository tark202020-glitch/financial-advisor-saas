
import { NextRequest, NextResponse } from 'next/server';
import {
    getAccessToken,
    getMarketCapRanking,
    BASE_URL,
    APP_KEY,
    APP_SECRET,
    kisRateLimiter
} from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

interface ConditionStock {
    symbol: string;
    name: string;
    price: number;
    per: number;
    pbr: number;
    dividend_yield: number;
    market_cap: number;
    operating_profit_margin: number;
    operating_profit_growth: number;
    revenue_growth: number;
    debt_ratio: number;
    revenue: number;
}

async function fetchFinancials(symbol: string, token: string) {
    const headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "appkey": APP_KEY!,
        "appsecret": APP_SECRET!,
        "custtype": "P"
    };

    const fetchAPI = async (tr_id: string, path: string) => {
        try {
            return await kisRateLimiter.add(async () => {
                const res = await fetch(`${BASE_URL}${path}?FID_COND_MRKT_DIV_CODE=J&FID_DIV_CLS_CODE=0&fid_input_iscd=${symbol}`, {
                    headers: { ...headers, tr_id }
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            });
        } catch (e) {
            console.warn(`[fetchFinancials] Failed ${symbol} tr_id=${tr_id}`, e);
            return { output: [] };
        }
    };

    try {
        const [growthRes, profitRes, stabilityRes, incomeRes] = await Promise.all([
            fetchAPI("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio"),
            fetchAPI("FHKST66430400", "/uapi/domestic-stock/v1/finance/profit-ratio"),
            fetchAPI("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio"),
            fetchAPI("FHKST66430200", "/uapi/domestic-stock/v1/finance/income-statement")
        ]);

        const getLatest = (res: any, key: string) => {
            if (!res || !res.output || !Array.isArray(res.output) || res.output.length === 0) return 0;
            return parseFloat(res.output[0][key] || '0');
        };

        return {
            operating_profit_growth: getLatest(growthRes, 'opr_pft_grs'),
            revenue_growth: getLatest(growthRes, 'sales_grs'),
            operating_profit_margin: getLatest(profitRes, 'opr_pft_rt'),
            debt_ratio: getLatest(stabilityRes, 'lblt_rate'),
            revenue: getLatest(incomeRes, 'sale_account') || getLatest(incomeRes, 'sales') || 0
        };
    } catch (e) {
        console.error(`[fetchFinancials] Exception for ${symbol}`, e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Range filters
    const minOpMargin = parseFloat(searchParams.get('minOpMargin') || '-9999');
    const maxOpMargin = parseFloat(searchParams.get('maxOpMargin') || '9999');
    const minOpGrowth = parseFloat(searchParams.get('minOpGrowth') || '-9999');
    const maxOpGrowth = parseFloat(searchParams.get('maxOpGrowth') || '9999');
    const minDebt = parseFloat(searchParams.get('minDebt') || '-9999');
    const maxDebt = parseFloat(searchParams.get('maxDebt') || '9999');
    const minPER = parseFloat(searchParams.get('minPER') || '0');
    const maxPER = parseFloat(searchParams.get('maxPER') || '9999');
    const minRevenue = parseFloat(searchParams.get('minRevenue') || '0');
    const maxRevenue = parseFloat(searchParams.get('maxRevenue') || '99999999');

    try {
        // Step 1: Use the PROVEN getMarketCapRanking() function
        // This uses TR_ID: FHPST01730000, URL: /ranking/market-cap
        const rankingData = await getMarketCapRanking(limit);

        if (!rankingData || rankingData.length === 0) {
            console.warn("[SimpleSearch] No ranking data returned");
            return NextResponse.json([]);
        }

        // Map ranking data to candidates
        const candidates = rankingData.map((item: any) => ({
            symbol: item.mksc_shrn_iscd || item.mksc_shra || '',
            name: item.hts_kor_isnm || '',
            price: parseInt(item.stck_prpr || '0'),
            per: parseFloat(item.per || '0'),
            pbr: parseFloat(item.pbr || '0'),
            dividend_yield: 0,
            market_cap: parseInt(item.stck_avls || item.lstn_stcn || '0')
        })).filter((c: any) => c.symbol);

        console.log(`[SimpleSearch] Got ${candidates.length} candidates from ranking`);

        // Step 2: Get access token for financial data APIs
        const token = await getAccessToken();

        // Step 3: Fetch financials and apply filters
        const results: ConditionStock[] = [];

        for (const stock of candidates) {
            try {
                const financials = await fetchFinancials(stock.symbol, token);
                if (!financials) continue;

                const finalStock: ConditionStock = {
                    ...stock,
                    ...financials,
                    dividend_yield: 0
                };

                // Apply range filters
                if (finalStock.operating_profit_margin < minOpMargin || finalStock.operating_profit_margin > maxOpMargin) continue;
                if (finalStock.operating_profit_growth < minOpGrowth || finalStock.operating_profit_growth > maxOpGrowth) continue;
                if (finalStock.debt_ratio < minDebt || finalStock.debt_ratio > maxDebt) continue;
                if (finalStock.per < minPER || finalStock.per > maxPER) continue;
                if (finalStock.revenue < minRevenue || finalStock.revenue > maxRevenue) continue;

                results.push(finalStock);
            } catch (innerErr) {
                console.error(`[SimpleSearch] Error processing ${stock.symbol}`, innerErr);
                continue;
            }
        }

        console.log(`[SimpleSearch] Returning ${results.length} results (filtered from ${candidates.length})`);
        return NextResponse.json(results);

    } catch (e: any) {
        console.error("[SimpleSearch] Global Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
