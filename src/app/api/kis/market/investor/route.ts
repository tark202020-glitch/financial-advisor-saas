import { NextRequest, NextResponse } from 'next/server';
import { getInvestorTrend, getMarketInvestorTrend } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const rawSymbol = searchParams.get('symbol');

    // Default to KOSPI (0001) if no symbol provided
    const symbol = rawSymbol || '0001';

    try {
        let data;

        // Check if symbol is a Market Index (0001: KOSPI, 0002: LargeCap?? Let's assume 0001 is main)
        // Actually KIS uses specific codes for Market Investor Trend.
        // If 0001, we want Market Trend.
        if (symbol === '0001' || symbol === '0002' || symbol === '1001' || symbol === '2001') {
            data = await getMarketInvestorTrend(symbol);
        } else {
            // Specific Stock
            data = await getInvestorTrend(symbol);
        }

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch investor trends' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
    }
}
