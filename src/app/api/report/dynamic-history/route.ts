import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDomesticStockHistory, getOverseasStockHistory } from '@/lib/kis/client';

function formatAsKisDate(dateStr: string) {
    return dateStr.replace(/-/g, '');
}

function getDaysArray(start: Date, end: Date) {
    const arr = [];
    for (let dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt));
    }
    return arr;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const currentExchangeRate = parseFloat(searchParams.get('exchangeRate') || '1350');

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`[DynamicHistory] START: ${startDateStr} ~ ${endDateStr}, ExRate: ${currentExchangeRate}`);

        // 1. Fetch ALL trade logs up to endDate
        const { data: trades, error } = await supabase
            .from('trade_logs')
            .select(`
                id, trade_date, type, price, quantity, 
                portfolios (symbol, category, name)
            `)
            .eq('user_id', user.id)
            .lte('trade_date', endDateStr)
            .order('trade_date', { ascending: true });

        if (error) {
            console.error('[DynamicHistory] Trade logs query error:', error);
            return NextResponse.json({ error: 'Failed to fetch trade logs' }, { status: 500 });
        }

        const tradesData: any[] = trades || [];
        console.log(`[DynamicHistory] Loaded ${tradesData.length} trade logs`);

        // 2. Compute Unique Symbols
        const symbolsMap: Record<string, 'US' | '국내'> = {};
        tradesData.forEach(t => {
            const port = Array.isArray(t.portfolios) ? t.portfolios[0] : t.portfolios;
            if (port && port.symbol) {
                symbolsMap[port.symbol] = port.category;
            }
        });

        const uniqueSymbols = Object.keys(symbolsMap);
        console.log(`[DynamicHistory] Unique symbols: ${uniqueSymbols.join(', ')}`);

        // 3. Fetch KIS Historical Prices
        const kisStartDate = formatAsKisDate(startDateStr);
        const kisEndDate = formatAsKisDate(endDateStr);
        const historicalPrices: Record<string, Record<string, number>> = {};

        // 순차 처리 (Rate Limit 방지)
        for (const symbol of uniqueSymbols) {
            historicalPrices[symbol] = {};
            const category = symbolsMap[symbol];

            try {
                if (category === 'US') {
                    const historyData = await getOverseasStockHistory(symbol, kisStartDate, kisEndDate);
                    console.log(`[DynamicHistory] US ${symbol}: ${historyData ? historyData.length : 'null'} records`);
                    if (historyData) {
                        historyData.forEach((day: any) => {
                            const dateCode = day.stck_bsop_date;
                            const closePrice = parseFloat(day.ovrs_nmix_prpr || day.clos || '0');
                            if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                        });
                    }
                } else {
                    const historyData = await getDomesticStockHistory(symbol, kisStartDate, kisEndDate);
                    console.log(`[DynamicHistory] DOM ${symbol}: ${historyData ? historyData.length : 'null'} records`);
                    if (historyData) {
                        historyData.forEach((day: any) => {
                            const dateCode = day.stck_bsop_date;
                            const closePrice = parseFloat(day.stck_clpr || '0');
                            if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                        });
                    }
                }
            } catch (e: any) {
                console.error(`[DynamicHistory] Error fetching history for ${symbol}:`, e.message);
            }
        }

        // 4. Generate daily timeline
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const dateArray = getDaysArray(start, end).map(d => d.toISOString().split('T')[0]);

        // 5. Walk through time day by day
        let currentTradesIndex = 0;
        const holdings: Record<string, { quantity: number; totalCost: number }> = {};

        // Pre-process trades before startDate
        while (currentTradesIndex < tradesData.length && tradesData[currentTradesIndex].trade_date < startDateStr) {
            const t = tradesData[currentTradesIndex];
            const port = Array.isArray(t.portfolios) ? t.portfolios[0] : t.portfolios;
            const sym = port?.symbol;
            if (sym) {
                if (!holdings[sym]) holdings[sym] = { quantity: 0, totalCost: 0 };
                const exRate = symbolsMap[sym] === 'US' ? currentExchangeRate : 1;
                const cost = t.price * t.quantity * exRate;

                if (t.type === 'BUY') {
                    holdings[sym].quantity += t.quantity;
                    holdings[sym].totalCost += cost;
                } else if (t.type === 'SELL') {
                    if (holdings[sym].quantity > 0) {
                        const avgPrice = holdings[sym].totalCost / holdings[sym].quantity;
                        holdings[sym].totalCost -= avgPrice * t.quantity;
                        holdings[sym].quantity -= t.quantity;
                    }
                }
            }
            currentTradesIndex++;
        }

        console.log(`[DynamicHistory] Holdings at startDate:`, JSON.stringify(holdings));

        const reportData = [];
        const lastKnownPrice: Record<string, number> = {};

        for (const dt of dateArray) {
            // Process trades on this date
            while (currentTradesIndex < tradesData.length && tradesData[currentTradesIndex].trade_date === dt) {
                const t = tradesData[currentTradesIndex];
                const port = Array.isArray(t.portfolios) ? t.portfolios[0] : t.portfolios;
                const sym = port?.symbol;
                if (sym) {
                    if (!holdings[sym]) holdings[sym] = { quantity: 0, totalCost: 0 };
                    const exRate = symbolsMap[sym] === 'US' ? currentExchangeRate : 1;
                    const cost = t.price * t.quantity * exRate;

                    if (t.type === 'BUY') {
                        holdings[sym].quantity += t.quantity;
                        holdings[sym].totalCost += cost;
                    } else if (t.type === 'SELL') {
                        if (holdings[sym].quantity > 0) {
                            const avgPrice = holdings[sym].totalCost / holdings[sym].quantity;
                            holdings[sym].totalCost -= avgPrice * t.quantity;
                            holdings[sym].quantity -= t.quantity;
                        }
                    }
                }
                currentTradesIndex++;
            }

            const kisDateCode = formatAsKisDate(dt);
            let dailyValuation = 0;
            let dailyInvestment = 0;

            for (const [sym, holding] of Object.entries(holdings)) {
                if (holding.quantity > 0) {
                    const exRate = symbolsMap[sym] === 'US' ? currentExchangeRate : 1;
                    dailyInvestment += holding.totalCost;

                    const priceToday = historicalPrices[sym]?.[kisDateCode];
                    if (priceToday) {
                        lastKnownPrice[sym] = priceToday;
                    }

                    const priceToUse = lastKnownPrice[sym] || 0;
                    dailyValuation += priceToUse * holding.quantity * exRate;
                }
            }

            reportData.push({
                date: dt,
                total_investment: dailyInvestment,
                total_valuation: dailyValuation
            });
        }

        console.log(`[DynamicHistory] Generated ${reportData.length} data points`);
        return NextResponse.json(reportData);

    } catch (err: any) {
        console.error('[DynamicHistory] Unhandled error:', err.message, err.stack);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
