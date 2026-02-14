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
        const prevClose = meta.previousClose;
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

async function fetchInterestRates() {
    // Interest rates are semi-static, using FRED/Static as backup
    // Yahoo Finance Symbols: ^TNX (10 Year Treasury), but for base rates we stick to static or specific API if available.
    // Keeping static/FRED logic for now as base rates don't fluctuate daily like market prices.
    try {
        // Korea base rate: Static for stability (2.75% as of early 2026)
        // US Fed Rate: Static or FRED
        return {
            korea: { rate: 2.75, date: '2026-01-16' },
            us: { rate: 4.25, date: '2026-01-29' }
        };
    } catch (e) {
        return {
            korea: { rate: 2.75, date: '2026-01-16' },
            us: { rate: 4.25, date: '2026-01-29' }
        };
    }
}

export async function GET() {
    try {
        // Parallel Fetch
        // symbols: KRW=X (USD/KRW), JPYKRW=X, CNYKRW=X, GC=F (Gold Futures)
        const [usd, jpy, cny, gold, rates, kospi, kosdaq, sp500, nasdaq] = await Promise.all([
            fetchYahooData('KRW=X'),
            fetchYahooData('JPYKRW=X'),
            fetchYahooData('CNYKRW=X'),
            fetchYahooData('GC=F'),
            fetchInterestRates(),
            fetchYahooData('^KS11'), // KOSPI
            fetchYahooData('^KQ11'), // KOSDAQ
            fetchYahooData('^GSPC'), // S&P 500
            fetchYahooData('^IXIC')  // NASDAQ
        ]);

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
            gold: gold, // price in USD
            interestRates: rates,
            fetchedAt: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
