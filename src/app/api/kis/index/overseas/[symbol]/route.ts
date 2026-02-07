
import { NextRequest, NextResponse } from 'next/server';
import { getOverseasIndex } from '@/lib/kis/client';

export async function GET(request: NextRequest, { params }: { params: { symbol: string } }) {
    try {
        const { symbol } = await params; // Await params in Next.js 15+
        const data = await getOverseasIndex(symbol);

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch overseas index' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
