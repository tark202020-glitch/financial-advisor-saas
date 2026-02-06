import { NextRequest, NextResponse } from 'next/server';
import { getInvestorTrend, getMarketInvestorTrend } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    // User requested KOSPI (0001).
    // Allowing query param 'symbol' for future extensibility, default to '0001'.
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || '0001';

    try {
        let data;
        // Check if KOSPI or Stock
        if (symbol === '0001' || symbol === 'U001') {
            data = await getMarketInvestorTrend('0001');
        } else {
            data = await getInvestorTrend(symbol);
        }

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch investor trends' }, { status: 500 });
        }

        // Transform KIS data to Chart format
        // KIS Output2:
        // stck_bsop_date: Date
        // prsn_ntby_qty: Personal Net Buy Quantity (or Price depending on params, usually Qty)
        // frgn_ntby_qty: Foreign Net Buy
        // orgn_ntby_qty: Institution Net Buy
        // We want AMOUNT (Price), but this TR often gives QTY.
        // Let's check keys. usually ending in _qty or _vol.
        // To get AMOUNT (Won), we might need to multiply by price or use a different TR.
        // Actually, let's just use the raw numbers for "Trend" (Positive/Negative) or verify if they are Volume or Amount.
        // Usually, dashboard shows "Net Buy Amount" in 100M KRW.
        // Let's inspect the data first via Debug log in component.

        // We will return the raw daily list, and let Frontend parse it.
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
    }
}
