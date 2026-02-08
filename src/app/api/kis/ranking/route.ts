import { NextRequest, NextResponse } from 'next/server';
import { getMarketCapRanking } from '@/lib/kis/client';

export const dynamic = 'force-dynamic'; // Prevent static generation 404s

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'market-cap';

        let ranking = [];

        if (type === 'market-cap') {
            ranking = await getMarketCapRanking();
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        if (!ranking || ranking.length === 0) {
            // Note: KIS ranking might be empty if market is closed or API limit?
            // But 404 is reserved for "Route Not Found". 
            // If data empty, return 200 with empty array or 404 with message?
            // Let's return 200 with empty to treat it as "No Data" rather than "Error".
            return NextResponse.json([]);
        }

        return NextResponse.json(ranking);

    } catch (e: any) {
        console.error("Ranking API Error:", e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
