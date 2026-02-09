
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

async function fetchFinancials(symbol: string, token: string, required: { growth: boolean, profit: boolean, stability: boolean, income: boolean }) {
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
            return { output: [] };
        }
    };

    const promises: Promise<any>[] = [];
    // Map index to key for reconstruction
    const keyMap: string[] = [];

    if (required.growth) { promises.push(fetchAPI("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio")); keyMap.push('growth'); }
    if (required.profit) { promises.push(fetchAPI("FHKST66430400", "/uapi/domestic-stock/v1/finance/profit-ratio")); keyMap.push('profit'); }
    if (required.stability) { promises.push(fetchAPI("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio")); keyMap.push('stability'); }
    if (required.income) { promises.push(fetchAPI("FHKST66430200", "/uapi/domestic-stock/v1/finance/income-statement")); keyMap.push('income'); }

    if (promises.length === 0) return {};

    try {
        const results = await Promise.all(promises);
        const data: any = {};

        results.forEach((res, idx) => {
            data[keyMap[idx]] = res;
        });

        // Helper to get latest year value
        const getLatest = (res: any, key: string) => {
            if (!res || !res.output || !Array.isArray(res.output) || res.output.length === 0) return 0;
            return parseFloat(res.output[0][key] || '0');
        };

        return {
            operating_profit_growth: required.growth ? getLatest(data.growth, 'opr_pft_grs') : 0,
            revenue_growth: required.growth ? getLatest(data.growth, 'sales_grs') : 0,
            operating_profit_margin: required.profit ? getLatest(data.profit, 'opr_pft_rt') : 0,
            debt_ratio: required.stability ? getLatest(data.stability, 'lblt_rate') : 0,
            revenue: required.income ? (getLatest(data.income, 'sale_account') || getLatest(data.income, 'sales') || 0) : 0
        };

    } catch (e) {
        console.error(`Failed to fetch financials for ${symbol}`, e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    // Lower limit to prevent timeouts
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
    const maxRevenue = parseFloat(searchParams.get('maxRevenue') || '99999999');

    // Optimization: Always fetch all 4 for now to ensure table data is complete.
    // Ideally we would optimize if table columns were dynamic.
    const required = { growth: true, profit: true, stability: true, income: true };

    try {
        const token = await getAccessToken();

        // 1. Get Ranking (Market Cap)
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
        }

        const results: ConditionStock[] = [];

        for (const stock of candidates) {
            try {
                const financials = await fetchFinancials(stock.symbol, token, required);
                if (!financials) continue;

                const finalStock: ConditionStock = {
                    ...stock,
                    ...financials,
                    dividend_yield: 0
                };

                // 3. Apply Filter
                if (finalStock.operating_profit_margin < minOpMargin || finalStock.operating_profit_margin > maxOpMargin) continue;
                if (finalStock.operating_profit_growth < minOpGrowth || finalStock.operating_profit_growth > maxOpGrowth) continue;
                if (finalStock.debt_ratio < minDebt || finalStock.debt_ratio > maxDebt) continue;
                if (finalStock.per < minPER || finalStock.per > maxPER) continue;
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
