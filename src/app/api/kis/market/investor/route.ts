import { NextRequest, NextResponse } from 'next/server';
import { getInvestorTrend, getMarketInvestorTrendDaily, getMarketInvestorTrendRealTime } from '@/lib/kis/client';

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
        let dailyData = [];
        let realTimeData = [];

        // Check if symbol is a Market Index
        if (symbol === '0001' || symbol === '1001') { // KOSPI, KOSDAQ
            // 1. Daily History (For Chart) - Uses getMarketInvestorTrendDaily (Renamed)
            // We need to import the renamed function or update import in route.ts
            // Let's assume we import * from client or specific names.
            // Actually I need to update import list first. 
            // But since I can't update import in this single block smoothly without line numbers shifting...
            // Let's assume I imported getMarketInvestorTrendDaily and getMarketInvestorTrendRealTime.

            // Wait, I replaced getMarketInvestorTrend with getMarketInvestorTrendDaily in client.ts
            // So I need to update the function calls here.

            // Parallel Fetch
            const [daily, realtime] = await Promise.all([
                getMarketInvestorTrendDaily(symbol),
                getMarketInvestorTrendRealTime(symbol)
            ]);

            dailyData = daily || [];
            realTimeData = realtime || [];
        } else {
            // Specific Stock (Keep existing logic?)
            // getInvestorTrend returns daily history for stock.
            dailyData = await getInvestorTrend(symbol) || [];
            // Stock RealTime? We don't have it implemented yet.
        }

        return NextResponse.json({
            daily: dailyData,
            realtime: realTimeData
        });
    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error.message || 'Unknown Error' }, { status: 500 });
    }
}
