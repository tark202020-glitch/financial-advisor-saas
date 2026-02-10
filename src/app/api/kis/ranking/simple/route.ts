
import { NextRequest } from 'next/server';
import {
    getAccessToken,
    getMarketCapRanking,
    BASE_URL,
    APP_KEY,
    APP_SECRET,
    kisRateLimiter
} from '@/lib/kis/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for full scan

// Fetch dividend yield from Naver Finance (KIS API doesn't provide this)
async function fetchDividendYield(symbol: string): Promise<number> {
    try {
        const res = await fetch(
            `https://m.stock.naver.com/api/stock/${symbol}/integration`,
            {
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(5000),
            }
        );
        if (!res.ok) return 0;
        const data = await res.json();

        if (Array.isArray(data.totalInfos)) {
            const dividendInfo = data.totalInfos.find(
                (info: any) => info.code === 'dividendYieldRatio'
            );
            if (dividendInfo && dividendInfo.value) {
                return parseFloat(dividendInfo.value.replace('%', '')) || 0;
            }
        }
        return 0;
    } catch {
        return 0;
    }
}

// Fetch KIS financial data (growth, profit, stability ratios)
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
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

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

    // Use Server-Sent Events for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Step 1: Get all KOSPI candidates
                send({ type: 'status', message: 'KOSPI 종목 리스트 수집 중...' });
                const rankingData = await getMarketCapRanking(200);

                if (!rankingData || rankingData.length === 0) {
                    send({ type: 'done', results: [], meta: { totalCandidates: 0, afterStage1: 0, processed: 0, matched: 0 } });
                    controller.close();
                    return;
                }

                send({ type: 'status', message: `${rankingData.length}개 종목 수집 완료. 1차 필터링 중...` });

                // Step 2: Stage 1 filter (price-data based: PER, PBR, market cap, volume)
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
                    if (!inRange(c.per, filters.per)) return false;
                    if (!inRange(c.pbr, filters.pbr)) return false;
                    if (!inRange(c.market_cap, filters.marketCap)) return false;
                    if (!inRange(c.volume, filters.volume)) return false;
                    return true;
                });

                send({
                    type: 'status',
                    message: `1차 필터 통과: ${candidates.length}개 (전체 ${rankingData.length}개 중). 재무+배당 데이터 분석 시작...`,
                    progress: { total: candidates.length, current: 0 }
                });

                // Step 3: Fetch financials + dividend for ALL pre-filtered candidates
                const token = await getAccessToken();
                const results: any[] = [];
                const BATCH_SIZE = 5;

                for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
                    const batch = candidates.slice(i, i + BATCH_SIZE);

                    const batchResults = await Promise.all(batch.map(async (stock) => {
                        try {
                            // Fetch KIS financials and Naver dividend in parallel
                            const [financials, dividendYield] = await Promise.all([
                                fetchFinancials(stock.symbol, token),
                                fetchDividendYield(stock.symbol),
                            ]);

                            if (!financials) return null;

                            const epsGrowth = financials.revenue_growth;
                            const peg = (stock.per > 0 && epsGrowth > 0.01)
                                ? Math.round((stock.per / epsGrowth) * 100) / 100
                                : 0;

                            const finalStock = {
                                symbol: stock.symbol,
                                name: stock.name,
                                price: stock.price,
                                per: stock.per,
                                pbr: stock.pbr,
                                roe: financials.roe,
                                peg,
                                dividend_yield: dividendYield,
                                market_cap: stock.market_cap,
                                volume: stock.volume,
                                operating_profit_margin: financials.operating_profit_margin,
                                operating_profit_growth: financials.operating_profit_growth,
                                revenue_growth: financials.revenue_growth,
                                debt_ratio: financials.debt_ratio,
                                revenue: 0,
                            };

                            // Stage 2 filters
                            if (!inRange(finalStock.revenue_growth, filters.revenueGrowth)) return null;
                            if (!inRange(finalStock.operating_profit_growth, filters.opGrowth)) return null;
                            if (!inRange(finalStock.roe, filters.roe)) return null;
                            if (finalStock.peg > 0 && !inRange(finalStock.peg, filters.peg)) return null;
                            if (!inRange(finalStock.debt_ratio, filters.debt)) return null;
                            if (!inRange(finalStock.dividend_yield, filters.dividend)) return null;

                            return finalStock;
                        } catch {
                            return null;
                        }
                    }));

                    batchResults.forEach(r => { if (r) results.push(r); });

                    const processed = Math.min(i + BATCH_SIZE, candidates.length);
                    send({
                        type: 'progress',
                        message: `재무+배당 분석 중... ${processed}/${candidates.length} (${results.length}건 발견)`,
                        progress: { total: candidates.length, current: processed, matched: results.length }
                    });
                }

                send({
                    type: 'done',
                    results,
                    meta: {
                        totalCandidates: rankingData.length,
                        afterStage1: candidates.length,
                        processed: candidates.length,
                        matched: results.length,
                    }
                });

            } catch (e: any) {
                send({ type: 'error', message: e.message || 'Internal Server Error' });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
