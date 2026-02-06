import { NextRequest, NextResponse } from 'next/server';
import { getDomesticIndex } from '@/lib/kis/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const symbol = (await params).symbol;

    try {
        const data = await getDomesticIndex(symbol);

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch index' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
