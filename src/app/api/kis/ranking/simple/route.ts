
import { NextRequest, NextResponse } from 'next/server';
import {
    getAccessToken,
    fetchGenericFinance,
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

    // We use Promise.all for parallelism within single stock
    // Using limited depth to avoid recursion issues

    const headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "appkey": APP_KEY!,
        "appsecret": APP_SECRET!,
        "custtype": "P"
    };

    const fetchAPI = async (tr_id: string, path: string) => {
        return kisRateLimiter.add(() => fetch(`${BASE_URL}${path}?FID_COND_MRKT_DIV_CODE=J&FID_DIV_CLS_CODE=0&fid_input_iscd=${symbol}`, {
            headers: { ...headers, tr_id }
        }).then(res => res.json()));
    };

    try {
        const [growthRes, profitRes, stabilityRes, incomeRes] = await Promise.all([
            fetchAPI("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio"),
            fetchAPI("FHKST66430400", "/uapi/domestic-stock/v1/finance/profit-ratio"),
            fetchAPI("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio"),
            fetchAPI("FHKST66430200", "/uapi/domestic-stock/v1/finance/income-statement")
        ]);

        // Helper to get latest year value
        const getLatest = (res: any, key: string) => {
            if (!res.output || !Array.isArray(res.output) || res.output.length === 0) return 0;
            // Usually index 0 is latest? Or sorted? KIS returns e.g. 2023, 2022...
            // Let's assume index 0 is most recent.
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
    const limit = parseInt(searchParams.get('limit') || '30'); // Default Top 30

    // Thresholds
    const minOpMargin = parseFloat(searchParams.get('minOpMargin') || '-999');
    const minOpGrowth = parseFloat(searchParams.get('minOpGrowth') || '-999');
    const maxDebt = parseFloat(searchParams.get('maxDebt') || '9999');
    const maxPER = parseFloat(searchParams.get('maxPER') || '9999');
    const minDividend = parseFloat(searchParams.get('minDividend') || '-999');

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
                "tr_id": "FHPST01740000", // Check exact TR_ID for Market Cap Ranking
                "custtype": "P"
            }
        }));

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
            // Fallback if ranking fails: default list
            candidates = [
                { symbol: '005930', name: '삼성전자', price: 0, per: 0, pbr: 0, dividend_yield: 0, market_cap: 0 },
                { symbol: '000660', name: 'SK하이닉스', price: 0, per: 0, pbr: 0, dividend_yield: 0, market_cap: 0 }
            ];
        }

        const results: ConditionStock[] = [];

        // 2. Fetch Details for each candidate
        // We do this in chunks to avoid hitting rate rate limits too hard even with limiter
        for (const stock of candidates) {
            // Basic Price Info (PER, Dividend) - if not in ranking
            // Market Cap ranking API typically returns minimal info.
            // Let's assume we need to re-fetch price to get accurate PER/Dividend if needed.

            // Fetch Financials
            const financials = await fetchFinancials(stock.symbol, token);
            if (!financials) continue;

            const finalStock: ConditionStock = {
                ...stock,
                ...financials,
                // We use ranking PER if available, otherwise 0
                dividend_yield: 0 // Need inquiry-price for accurate dividend if not in ranking
            };

            // 3. Apply Filter
            if (finalStock.operating_profit_margin < minOpMargin) continue;
            if (finalStock.operating_profit_growth < minOpGrowth) continue;
            if (finalStock.debt_ratio > maxDebt) continue;
            if (finalStock.per > maxPER) continue;
            // if (finalStock.dividend_yield < minDividend) continue; // Dividend data missing for now

            results.push(finalStock);
        }

        return NextResponse.json(results);

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
