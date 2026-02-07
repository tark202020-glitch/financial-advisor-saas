import { NextRequest, NextResponse } from 'next/server';
import { getInvestorTrend, getMarketInvestorTrend } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    // User requested FHKST01010900 (Stock Investor Trend).
    // This TR requires a Stock Code (not Index).
    // Defaulting to Samsung Electronics (005930) as a representative proxy for "Market Flow" 
    // if the frontend requests '0001' (Market) or no symbol.
    const { searchParams } = new URL(request.url);
    const rawSymbol = searchParams.get('symbol');

    // If no symbol or '0001' (Index) is requested, use '005930' (Samsung) to satisfy FHKST01010900
    const symbol = (!rawSymbol || rawSymbol === '0001') ? '005930' : rawSymbol;

    try {
        // Always use getInvestorTrend (FHKST01010900) as requested
        const data = await getInvestorTrend(symbol);

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
