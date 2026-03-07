import { NextResponse } from 'next/server';

// Yahoo Finance Chart API (Unofficial but reliable for free metadata)
// Fetches current price and previous close to calculate change
async function fetchYahooData(symbol: string) {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) return null;

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;

        if (!meta) return null;

        const price = meta.regularMarketPrice;
        // chartPreviousClose is often more accurate for "yesterday's close" than previousClose in some contexts,
        // but regularMarketPreviousClose is standard. 
        // However, yahoo chart often has 'chartPreviousClose'.
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return {
            price,
            change,
            changePercent,
            updated: new Date((meta.regularMarketTime || Date.now() / 1000) * 1000).toISOString()
        };
    } catch (e) {
        console.error(`[Market Extra] Failed to fetch ${symbol}:`, e);
        return null;
    }
}

// Fetch 1-month daily history and return recent week's data points
async function fetchYahooHistory(symbol: string) {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`, {
            next: { revalidate: 300 } // Cache for 5 mins
        });
        if (!res.ok) return null;

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result || !result.timestamp || !result.indicators.quote[0].close) return null;

        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;
        const opens = result.indicators.quote[0].open;

        // Combine and map valid prices
        const history = timestamps.map((t: number, i: number) => ({
            date: new Date(t * 1000).toISOString().slice(0, 10),
            close: closes[i],
            open: opens[i]
        })).filter((item: any) => item.close !== null);

        // Return latest 7 trading days
        return history.slice(-7);

    } catch (e) {
        console.error(`[Market Extra History] Failed to fetch ${symbol}:`, e);
        return null;
    }
}

async function fetchInterestRates() {
    // Interest rates are semi-static, using FRED/Static as backup
    // Yahoo Finance Symbols: ^TNX (10 Year Treasury), but for base rates we stick to static or specific API if available.
    // Keeping static/FRED logic for now as base rates don't fluctuate daily like market prices.
    try {
        // Korea base rate: Static for stability (2.75% as of early 2026)
        // US Fed Rate: Static or FRED. Updated to range 3.50 ~ 3.75 as requested.
        return {
            korea: { rate: 2.75, date: '2026-01-16' },
            us: { rate: "3.50 ~ 3.75", date: '2026-01-29' }
        };
    } catch (e) {
        return {
            korea: { rate: 2.75, date: '2026-01-16' },
            us: { rate: "3.50 ~ 3.75", date: '2026-01-29' }
        };
    }
}

export async function GET() {
    try {
        // Parallel Fetch
        // symbols: KRW=X (USD/KRW), JPYKRW=X, CNYKRW=X, GC=F (Gold Futures)
        // futures: NQ=F (Nasdaq 100 Futures), ES=F (S&P 500 Futures)
        const [usd, jpy, cny, gold, rates, kospi, kosdaq, sp500, nasdaq, us10y, us10yHistory, nq_future, es_future] = await Promise.all([
            fetchYahooData('KRW=X'),
            fetchYahooData('JPYKRW=X'),
            fetchYahooData('CNYKRW=X'),
            fetchYahooData('GC=F'),
            fetchInterestRates(),
            fetchYahooData('^KS11'), // KOSPI
            fetchYahooData('^KQ11'), // KOSDAQ
            fetchYahooData('^GSPC'), // S&P 500
            fetchYahooData('^IXIC'), // NASDAQ
            fetchYahooData('^TNX'),  // US 10-Year Treasury Yield
            fetchYahooHistory('^TNX'), // US 10-Year Treasury Yield 1W history
            fetchYahooData('NQ=F'),  // NASDAQ 100 Futures
            fetchYahooData('ES=F')   // S&P 500 Futures
        ]);

        // Process Gold to KRW/g
        // 1 Troy Ounce = 31.1034768 Grams
        let goldKRW = null;
        if (gold && usd) {
            const priceKRWperOz = gold.price * usd.price;
            const priceKRWperG = priceKRWperOz / 31.1034768;

            // Calculate previous close in KRW/g to get correct change
            const prevGoldUSD = gold.price - gold.change;
            const prevUsdKRW = usd.price - usd.change; // Approx prev close for USD
            const prevPriceKRWperOz = prevGoldUSD * prevUsdKRW;
            const prevPriceKRWperG = prevPriceKRWperOz / 31.1034768;

            const changeKRW = priceKRWperG - prevPriceKRWperG;
            const changePercent = (changeKRW / prevPriceKRWperG) * 100;

            goldKRW = {
                ...gold,
                price: priceKRWperG,
                change: changeKRW,
                changePercent: changePercent
            };
        }

        return NextResponse.json({
            exchangeRates: {
                usd_krw: usd,
                jpy_krw: jpy,
                cny_krw: cny,
            },
            indices: {
                kospi: kospi,
                kosdaq: kosdaq,
                sp500: sp500,
                nasdaq: nasdaq
            },
            gold: goldKRW || gold, // Return converted gold if available
            interestRates: rates,
            us10yTreasury: us10y, // US 10-Year Treasury Yield
            us10yHistory: us10yHistory, // 1W history array
            futures: {
                nasdaq: nq_future,
                sp500: es_future
            },
            fetchedAt: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
