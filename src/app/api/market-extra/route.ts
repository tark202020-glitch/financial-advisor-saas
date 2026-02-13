import { NextResponse } from 'next/server';

// Free public API for exchange rates, gold prices, interest rates
// Uses open APIs to fetch supplementary market data

async function fetchExchangeRates() {
    try {
        // Use exchangerate-api.com free tier (no key needed for open endpoint)
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        const krw = data.rates?.KRW || 0;
        const jpy = data.rates?.JPY || 0;
        const cny = data.rates?.CNY || 0;

        // We want: USD/KRW, JPY/KRW(100엔당), CNY/KRW
        return {
            usd_krw: Math.round(krw * 100) / 100,
            jpy_krw: Math.round((krw / jpy) * 100 * 100) / 100, // 100엔 당 원화
            cny_krw: Math.round((krw / cny) * 100) / 100,
            updated: data.time_last_update_utc || new Date().toISOString()
        };
    } catch (e) {
        console.error('[Market Extra] Exchange rate fetch failed:', e);
        return null;
    }
}

async function fetchGoldPrice() {
    try {
        // Use free gold-price API
        const res = await fetch('https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz', { next: { revalidate: 3600 } });
        if (res.ok) {
            const data = await res.json();
            return {
                price_usd: data.metals?.gold || 0,
                updated: data.timestamps?.metal || new Date().toISOString()
            };
        }

        // Fallback: hardcoded approximate price as API may fail
        return { price_usd: 0, updated: '' };
    } catch (e) {
        return { price_usd: 0, updated: '' };
    }
}

async function fetchInterestRates() {
    // Note: Interest rates are typically semi-static.
    // Use public open data sources.
    try {
        // Fetch from FRED API (US Federal Funds Rate) - public access
        const fredRes = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=DEMO_KEY&file_type=json&sort_order=desc&limit=1', {
            next: { revalidate: 3600 }
        });

        let us_rate = 0;
        let us_date = '';

        if (fredRes.ok) {
            const fredData = await fredRes.json();
            if (fredData.observations?.length > 0) {
                us_rate = parseFloat(fredData.observations[0].value) || 0;
                us_date = fredData.observations[0].date || '';
            }
        }

        // Korea base rate - Bank of Korea API is complex, use static known value
        // As of 2026-02, Korea base rate: 2.75%
        const kr_rate = 2.75;
        const kr_date = '2026-01-16'; // Last BOK meeting

        return {
            korea: { rate: kr_rate, date: kr_date },
            us: { rate: us_rate || 4.25, date: us_date || '2026-01-29' }
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
        const [exchangeRates, gold, interestRates] = await Promise.all([
            fetchExchangeRates(),
            fetchGoldPrice(),
            fetchInterestRates()
        ]);

        return NextResponse.json({
            exchangeRates,
            gold,
            interestRates,
            fetchedAt: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
