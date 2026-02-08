import { NextRequest, NextResponse } from 'next/server';
import { getMarketCapRanking, getDomesticPrice } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    try {
        // 1. Get Top 100 stocks by Market Cap
        // getMarketCapRanking usually returns Top 30 by default if no params, but standard output is fixed list?
        // KIS Ranking API usually returns 0-N items.
        // We will assume it returns a list.
        const ranking = await getMarketCapRanking(); // Let's check the implementation, it fetches default params.

        if (!ranking || ranking.length === 0) {
            return NextResponse.json({ error: 'No ranking data found' }, { status: 404 });
        }

        // 2. Enhance with PER/ROE (EPS/BPS)
        // Since Ranking API typically doesn't include PER/ROE, we might need to fetch `inquire-price` for top items to support filtering.
        // However, fetching 30-100 items is heavy.
        // Option: If user filters by PER/ROE, we MUST fetch details.
        // Optimization:
        // - Return basic list first.
        // - Frontend calls 'batch' price API to get details?
        // - OR Server does it?
        // Let's do it on server for simplicity of "Condition Search" endpoint.
        // But limited to Top 30 for now to be safe.
        // Or Top 20? 
        // User wants "Condition Search". If I only search Top 20, it's useless.
        // I need to fetch MORE. 
        // Can I page the ranking? `getMarketCapRanking` implementation uses fixed URL.
        // I'll stick to what I get (likely 30).
        // Wait, KIS ranking usually returns 30.
        // To get more, I'd need to scrape or use database. 
        // I will explain this limitation or try to get more if possible (no obvious pagination in standard KIS Ranking).

        // For now, return the basic ranking list.
        // The list contains: `mksc_shra` (Code), `hts_kor_isnm` (Name), `stck_prpr` (Price), `acml_vol` (Volume), `stck_avls` (Market Cap - maybe `stck_avls_amt`? output field checking needed).

        // Let's just return the raw ranking first so I can inspect the keys in Frontend (console log).
        // Then I'll map it to standard format.

        return NextResponse.json(ranking);

    } catch (e: any) {
        console.error("Ranking API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
