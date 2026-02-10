import { NextRequest, NextResponse } from 'next/server';
import { getDailyPriceHistory, getOverseasDailyPriceHistory } from '@/lib/kis/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    // Sanitize symbol: Remove .KS suffix for Domestic KIS API
    const rawSymbol = (await params).symbol;
    const symbol = rawSymbol.split('.')[0];

    // Check Market type from Query Param
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market'); // 'KR' or 'US'

    try {
        let data;
        if (market === 'US') {
            data = await getOverseasDailyPriceHistory(symbol);
        } else {
            data = await getDailyPriceHistory(symbol);
        }

        // Return empty array instead of 500 for no data
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return NextResponse.json([]);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
