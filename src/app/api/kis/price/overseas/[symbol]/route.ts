import { NextRequest, NextResponse } from 'next/server';
import { getOverseasPrice } from '@/lib/kis/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const symbol = (await params).symbol;

    // TODO: Add exchange code handling if needed (currently defaults to NAS)
    try {
        const data = await getOverseasPrice(symbol);

        if (symbol === 'WMT') {
            console.log(`[DEBUG_API] WMT Response:`, JSON.stringify(data, null, 2));
        }

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
