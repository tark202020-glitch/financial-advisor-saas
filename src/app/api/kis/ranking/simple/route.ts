
import { NextRequest, NextResponse } from 'next/server';
import {
    getAccessToken,
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

    // Financials
    operating_profit_margin: number; // 영업이익률
    operating_profit_growth: number; // 영업이익증가율
    revenue_growth: number; // 매출액증가율
    debt_ratio: number; // 부채비율
    revenue: number; // 매출액
}

async function fetchFinancials(symbol: string, token: string) {
    // 1. Growth (FHKST66430800)
    // 2. Profit (FHKST66430400)
    // 3. Stability (FHKST66430300)
    // 4. Income (Income Statement) for Revenue

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
                if (!res.ok) {
                    throw new Error(`API ${tr_id} Failed: ${res.status}`);
                }
                return res.json();
            });
        } catch (e) {
            console.warn(`Fetch failed for ${symbol} / ${tr_id}`, e);
            return { output: [] }; // Return empty output structure on fail
        }
    };

    try {
        const [growthRes, profitRes, stabilityRes, incomeRes] = await Promise.all([
            fetchAPI("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio"), // Growth
            fetchAPI("FHKST66430400", "/uapi/domestic-stock/v1/finance/profit-ratio"), // Profit
            fetchAPI("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio"), // Stability
            fetchAPI("FHKST66430200", "/uapi/domestic-stock/v1/finance/income-statement") // Income
        ]);

        // Helper to get latest year value
        const getLatest = (res: any, key: string) => {
            if (!res || !res.output || !Array.isArray(res.output) || res.output.length === 0) return 0;
            // KIS returns sorted by date usually, 0 is latest
            return parseFloat(res.output[0][key] || '0');
        };

        return {
            operating_profit_growth: getLatest(growthRes, 'opr_pft_grs'), // 영업이익증가율
            revenue_growth: getLatest(growthRes, 'sales_grs'), // 매출액증가율
            operating_profit_margin: getLatest(profitRes, 'opr_pft_rt'), // 영업이익률
            debt_ratio: getLatest(stabilityRes, 'lblt_rate'), // 부채비율
            revenue: getLatest(incomeRes, 'sale_account') || getLatest(incomeRes, 'sales') || 0 // 매출액
        };

    } catch (e) {
        console.error(`Failed to fetch financials for ${symbol}`, e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    // Lower default limit to prevent timeouts if user doesn't specify
    const limit = parseInt(searchParams.get('limit') || '20');

    // Thresholds (Ranges)
    const minOpMargin = parseFloat(searchParams.get('minOpMargin') || '-9999');
    const maxOpMargin = parseFloat(searchParams.get('maxOpMargin') || '9999');

    const minOpGrowth = parseFloat(searchParams.get('minOpGrowth') || '-9999');
    const maxOpGrowth = parseFloat(searchParams.get('maxOpGrowth') || '9999');

    const minDebt = parseFloat(searchParams.get('minDebt') || '-9999');
    const maxDebt = parseFloat(searchParams.get('maxDebt') || '9999');

    const minPER = parseFloat(searchParams.get('minPER') || '0');
    const maxPER = parseFloat(searchParams.get('maxPER') || '9999');

    const minRevenue = parseFloat(searchParams.get('minRevenue') || '0');
    const maxRevenue = parseFloat(searchParams.get('maxRevenue') || '99999999'); // Default huge

    try {
        const token = await getAccessToken();

        // 1. Get Ranking (Market Cap) to create candidate list
        // TR_ID: FHPST01740000 (Market Cap Ranking)
        const rankingRes = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/market-cap?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=20174&FID_INPUT_ISCD=0000&FID_DIV_CLS_CODE=0&FID_INPUT_PRICE_1=&FID_INPUT_PRICE_2=&FID_VOL_CLS_CODE=&FID_INPUT_OPTION=`, {
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "FHPST01740000",
                "custtype": "P"
            }
        }));

        if (!rankingRes.ok) {
            console.error("Ranking API Failed", await rankingRes.text());
            return NextResponse.json({ error: "Ranking API Failed" }, { status: 500 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let candidates: any[] = [];
        const rankingData = await rankingRes.json();

        if (rankingData.output && Array.isArray(rankingData.output)) {
            // Limit candidates
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            candidates = rankingData.output.slice(0, limit).map((item: any) => ({
                symbol: item.mksc_shrn_iscd,
                name: item.hts_kor_isnm,
                price: parseInt(item.stck_prpr),
                per: parseFloat(item.per),
                pbr: parseFloat(item.pbr),
                dividend_yield: 0,
                market_cap: parseInt(item.stck_avls || item.lstn_stcn)
            }));
        } else {
            console.warn("No output from Ranking API");
            candidates = [];
        }

        const results: ConditionStock[] = [];

        // 2. Fetch Details for each candidate
        for (const stock of candidates) {
            try {
                // Fetch Financials
                const financials = await fetchFinancials(stock.symbol, token);
                // If financials fail, we skip validation for now or skip stock? 
                // Let's skip stock to be safe (strict mode)
                if (!financials) continue;

                const finalStock: ConditionStock = {
                    ...stock,
                    ...financials,
                    dividend_yield: 0
                };

                // 3. Apply Filter (Ranges)
                if (finalStock.operating_profit_margin < minOpMargin || finalStock.operating_profit_margin > maxOpMargin) continue;
                if (finalStock.operating_profit_growth < minOpGrowth || finalStock.operating_profit_growth > maxOpGrowth) continue;
                if (finalStock.debt_ratio < minDebt || finalStock.debt_ratio > maxDebt) continue;

                // PER Check (handle 0 or invalid)
                if (finalStock.per < minPER || finalStock.per > maxPER) continue;

                // Revenue Check
                if (finalStock.revenue < minRevenue || finalStock.revenue > maxRevenue) continue;

                results.push(finalStock);
            } catch (innerErr) {
                console.error(`Error processing stock ${stock.symbol}`, innerErr);
                continue;
            }
        }

        return NextResponse.json(results);

    } catch (e: any) {
        console.error("Global Error in Simple Search:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
