
import { NextRequest, NextResponse } from 'next/server';
import { getInvestorOpinion } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!symbol || !startDate || !endDate) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const data = await getInvestorOpinion(symbol, startDate, endDate);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching investment opinion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
