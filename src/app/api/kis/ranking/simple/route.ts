
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
    roe: number;
    peg: number;
    dividend_yield: number;
    market_cap: number;
    volume: number;
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
                const res = await fetch(`${BASE_URL}${path}?FID_COND_MRKT_DIV_CODE=J&FID_DIV_CLS_CODE=1&FID_INPUT_ISCD=${symbol}`, {
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

        // Field mappings based on actual KIS API responses:
        // growth-ratio: grs (매출증가율), bsop_prfi_inrt (영업이익증가율)
        // profit-ratio: sale_totl_rate (매출총이익률), self_cptl_ntin_inrt (ROE)
        // financial-ratio: lblt_rate (부채비율), roe_val (ROE)
        // income-statement: sale_account (매출액)

        const roe = getLatest(stabilityRes, 'roe_val') || getLatest(profitRes, 'self_cptl_ntin_inrt');

        return {
            operating_profit_growth: getLatest(growthRes, 'bsop_prfi_inrt'),
            revenue_growth: getLatest(growthRes, 'grs'),
            operating_profit_margin: getLatest(profitRes, 'sale_totl_rate'),
            debt_ratio: getLatest(stabilityRes, 'lblt_rate'),
            revenue: getLatest(incomeRes, 'sale_account') || getLatest(incomeRes, 'sales') || 0,
            roe,
        };
    } catch (e) {
        console.error(`[fetchFinancials] Exception for ${symbol}`, e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // === All range filter parameters ===
    const getRange = (name: string, defaultMin: number = -999999, defaultMax: number = 999999) => ({
        min: parseFloat(searchParams.get(`min${name}`) ?? String(defaultMin)),
        max: parseFloat(searchParams.get(`max${name}`) ?? String(defaultMax)),
    });

    const filters = {
        revenueGrowth: getRange('RevenueGrowth'),
        opGrowth: getRange('OpGrowth'),
        roe: getRange('ROE'),
        peg: getRange('PEG'),
        per: getRange('PER'),
        pbr: getRange('PBR'),
        debt: getRange('Debt'),
        dividend: getRange('Dividend'),
        marketCap: getRange('MarketCap'),
        volume: getRange('Volume'),
    };

    // Legacy support
    if (searchParams.has('minOpMargin')) {
        // old params are still supported
    }

    try {
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
            volume: parseInt(item.acml_vol || '0'),
            market_cap: parseInt(item.stck_avls || item.lstn_stcn || '0')
        })).filter((c: any) => c.symbol);

        console.log(`[SimpleSearch] Got ${candidates.length} candidates from ranking`);

        const token = await getAccessToken();
        const results: ConditionStock[] = [];

        for (const stock of candidates) {
            try {
                const financials = await fetchFinancials(stock.symbol, token);
                if (!financials) continue;

                // Calculate PEG = PER / EPS Growth Rate
                // Use revenue_growth as proxy (EPS growth often unavailable)
                const epsGrowth = financials.revenue_growth;
                const peg = (stock.per > 0 && epsGrowth > 0.01)
                    ? Math.round((stock.per / epsGrowth) * 100) / 100
                    : 0;

                const finalStock: ConditionStock = {
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.price,
                    per: stock.per,
                    pbr: stock.pbr,
                    roe: financials.roe,
                    peg,
                    dividend_yield: 0, // TODO: integrate dividend API
                    market_cap: stock.market_cap,
                    volume: stock.volume,
                    operating_profit_margin: financials.operating_profit_margin,
                    operating_profit_growth: financials.operating_profit_growth,
                    revenue_growth: financials.revenue_growth,
                    debt_ratio: financials.debt_ratio,
                    revenue: financials.revenue,
                };

                // === Apply all range filters ===
                const inRange = (val: number, range: { min: number; max: number }) =>
                    val >= range.min && val <= range.max;

                if (!inRange(finalStock.revenue_growth, filters.revenueGrowth)) continue;
                if (!inRange(finalStock.operating_profit_growth, filters.opGrowth)) continue;
                if (!inRange(finalStock.roe, filters.roe)) continue;
                if (finalStock.peg > 0 && !inRange(finalStock.peg, filters.peg)) continue; // Skip PEG filter if PEG=0 (unavailable)
                if (!inRange(finalStock.per, filters.per)) continue;
                if (!inRange(finalStock.pbr, filters.pbr)) continue;
                if (!inRange(finalStock.debt_ratio, filters.debt)) continue;
                if (!inRange(finalStock.dividend_yield, filters.dividend)) continue;
                if (!inRange(finalStock.market_cap, filters.marketCap)) continue;
                if (!inRange(finalStock.volume, filters.volume)) continue;

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
