import { NextRequest, NextResponse } from 'next/server';
import { getDailyPriceHistory } from '@/lib/kis/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    // Sanitize symbol: Remove .KS suffix for Domestic KIS API
    const rawSymbol = (await params).symbol;
    const symbol = rawSymbol.split('.')[0];

    try {
        const data = await getDailyPriceHistory(symbol);

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
