
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
        const [growthRes, profitRes, stabilityRes] = await Promise.all([
            fetchAPI("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio"),
            fetchAPI("FHKST66430400", "/uapi/domestic-stock/v1/finance/profit-ratio"),
            fetchAPI("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio"),
        ]);

        const getLatest = (res: any, key: string) => {
            if (!res || !res.output || !Array.isArray(res.output) || res.output.length === 0) return 0;
            return parseFloat(res.output[0][key] || '0');
        };

        const roe = getLatest(stabilityRes, 'roe_val') || getLatest(profitRes, 'self_cptl_ntin_inrt');

        return {
            operating_profit_growth: getLatest(growthRes, 'bsop_prfi_inrt'),
            revenue_growth: getLatest(growthRes, 'grs'),
            operating_profit_margin: getLatest(profitRes, 'sale_totl_rate'),
            debt_ratio: getLatest(stabilityRes, 'lblt_rate'),
            roe,
        };
    } catch (e) {
        console.error(`[fetchFinancials] Exception for ${symbol}`, e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

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

    const inRange = (val: number, range: { min: number; max: number }) =>
        val >= range.min && val <= range.max;

    // Check which filters require financial API data
    const needsFinancialData =
        filters.revenueGrowth.min > -999999 || filters.revenueGrowth.max < 999999 ||
        filters.opGrowth.min > -999999 || filters.opGrowth.max < 999999 ||
        filters.roe.min > -999999 || filters.roe.max < 999999 ||
        filters.peg.min > -999999 || filters.peg.max < 999999 ||
        filters.debt.min > -999999 || filters.debt.max < 999999 ||
        true; // Always fetch financials since we want to display them

    try {
        // Step 1: Get all KOSPI candidates (up to 200 in fallback, all in live)
        const rankingData = await getMarketCapRanking(200);

        if (!rankingData || rankingData.length === 0) {
            console.warn("[SimpleSearch] No ranking data returned");
            return NextResponse.json([]);
        }

        console.log(`[SimpleSearch] Got ${rankingData.length} total candidates`);

        // Step 2: Map and apply STAGE 1 filters (price-data based — no extra API calls)
        const candidates = rankingData.map((item: any) => ({
            symbol: item.mksc_shrn_iscd || item.mksc_shra || '',
            name: item.hts_kor_isnm || '',
            price: parseInt(item.stck_prpr || '0'),
            per: parseFloat(item.per || '0'),
            pbr: parseFloat(item.pbr || '0'),
            volume: parseInt(item.acml_vol || '0'),
            market_cap: parseInt(item.stck_avls || item.lstn_stcn || '0')
        })).filter((c: any) => {
            if (!c.symbol) return false;

            // STAGE 1: Filter by fields available from ranking/price data
            if (!inRange(c.per, filters.per)) return false;
            if (!inRange(c.pbr, filters.pbr)) return false;
            if (!inRange(c.market_cap, filters.marketCap)) return false;
            if (!inRange(c.volume, filters.volume)) return false;

            return true;
        });

        console.log(`[SimpleSearch] After Stage 1 filter: ${candidates.length} candidates (from ${rankingData.length})`);

        // Step 3: Get access token for financial data APIs
        const token = await getAccessToken();

        // Step 4: STAGE 2 — Fetch financials for pre-filtered candidates and apply remaining filters
        // Process in parallel batches for speed
        const BATCH_SIZE = 5;
        const results: ConditionStock[] = [];
        const MAX_FINANCIAL_FETCHES = 100; // Safety limit to prevent excessive API calls
        const toProcess = candidates.slice(0, MAX_FINANCIAL_FETCHES);

        for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
            const batch = toProcess.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(batch.map(async (stock) => {
                try {
                    const financials = await fetchFinancials(stock.symbol, token);
                    if (!financials) return null;

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
                        dividend_yield: 0,
                        market_cap: stock.market_cap,
                        volume: stock.volume,
                        operating_profit_margin: financials.operating_profit_margin,
                        operating_profit_growth: financials.operating_profit_growth,
                        revenue_growth: financials.revenue_growth,
                        debt_ratio: financials.debt_ratio,
                        revenue: 0,
                    };

                    // STAGE 2: Apply financial-data filters
                    if (!inRange(finalStock.revenue_growth, filters.revenueGrowth)) return null;
                    if (!inRange(finalStock.operating_profit_growth, filters.opGrowth)) return null;
                    if (!inRange(finalStock.roe, filters.roe)) return null;
                    if (finalStock.peg > 0 && !inRange(finalStock.peg, filters.peg)) return null;
                    if (!inRange(finalStock.debt_ratio, filters.debt)) return null;
                    if (!inRange(finalStock.dividend_yield, filters.dividend)) return null;

                    return finalStock;
                } catch (innerErr) {
                    console.error(`[SimpleSearch] Error processing ${stock.symbol}`, innerErr);
                    return null;
                }
            }));

            batchResults.forEach(r => { if (r) results.push(r); });
        }

        const skipped = candidates.length - toProcess.length;
        console.log(`[SimpleSearch] Returning ${results.length} results (processed ${toProcess.length}, skipped ${skipped})`);

        return NextResponse.json({
            results,
            meta: {
                totalCandidates: rankingData.length,
                afterStage1: candidates.length,
                processed: toProcess.length,
                matched: results.length,
                skipped,
            }
        });

    } catch (e: any) {
        console.error("[SimpleSearch] Global Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
