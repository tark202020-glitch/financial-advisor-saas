'use server'

import { createClient } from '@/utils/supabase/server'
import { getDomesticStockHistory, getOverseasStockHistory } from '@/lib/kis/client'

// YYYY-MM-DD to YYYYMMDD
function formatAsKisDate(dateStr: string) {
    return dateStr.replace(/-/g, '');
}

// YYYYMMDD to YYYY-MM-DD
function formatAsStandardDate(kisDateStr: string) {
    if (kisDateStr.length !== 8) return kisDateStr;
    return `${kisDateStr.substring(0, 4)}-${kisDateStr.substring(4, 6)}-${kisDateStr.substring(6, 8)}`;
}

function getDaysArray(start: Date, end: Date) {
    for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
        arr.push(new Date(dt));
    }
    return arr;
}

export async function getDynamicValuationHistory(startDateStr: string, endDateStr: string, currentExchangeRate: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Fetch ALL trade logs up to endDate to compute accurate holdings
    const { data: trades, error } = await supabase
        .from('trade_logs')
        .select(`
            id, trade_date, type, price, quantity, 
            portfolios (symbol, category, name)
        `)
        .eq('user_id', user.id)
        .lte('trade_date', endDateStr)
        .order('trade_date', { ascending: true })

    if (error) throw error;

    // 2. Compute Unique Symbols and their categories
    const symbolsMap: Record<string, 'US' | '국내'> = {};
    const tradesData = trades || [];
    
    tradesData.forEach(t => {
        if (t.portfolios && t.portfolios.symbol) {
            symbolsMap[t.portfolios.symbol] = t.portfolios.category;
        }
    });

    const uniqueSymbols = Object.keys(symbolsMap);

    // 3. Fetch History Date for each symbol for the requested period 
    // (startDate to endDate)
    const kisStartDate = formatAsKisDate(startDateStr);
    const kisEndDate = formatAsKisDate(endDateStr);

    const historicalPrices: Record<string, Record<string, number>> = {}; // symbol -> { 'YYYYMMDD': price }
    
    await Promise.all(uniqueSymbols.map(async (symbol) => {
        historicalPrices[symbol] = {};
        const category = symbolsMap[symbol];
        
        try {
            let historyData = [];
            if (category === 'US') {
                historyData = await getOverseasStockHistory(symbol, kisStartDate, kisEndDate);
                if (historyData) {
                    historyData.forEach((day: any) => {
                        const dateCode = day.stck_bsop_date;
                        const closePrice = parseFloat(day.ovrs_nmix_prpr || '0');
                        if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                    });
                }
            } else {
                historyData = await getDomesticStockHistory(symbol, kisStartDate, kisEndDate);
                if (historyData) {
                    historyData.forEach((day: any) => {
                        const dateCode = day.stck_bsop_date;
                        const closePrice = parseFloat(day.stck_clpr || '0');
                        if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                    });
                }
            }
        } catch (e) {
            console.error(`Error fetching history for ${symbol}:`, e);
        }
    }));

    // 4. Generate daily timeline from startDate to endDate
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dateArray = getDaysArray(start, end).map(d => d.toISOString().split('T')[0]);

    // 5. Walk through time day by day
    let currentTradesIndex = 0;
    
    // State of holdings: symbol -> { quantity, totalCost }
    const holdings: Record<string, { quantity: number; totalCost: number }> = {};
    
    // Pre-process trades before startDate
    while (currentTradesIndex < tradesData.length && tradesData[currentTradesIndex].trade_date < startDateStr) {
        const t = tradesData[currentTradesIndex];
        const sym = t.portfolios?.symbol;
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

    const reportData = [];
    
    // Track Last Known Price for weekends/holidays
    const lastKnownPrice: Record<string, number> = {};

    for (const dt of dateArray) {
        // Process trades that happened exactly on this 'dt'
        while (currentTradesIndex < tradesData.length && tradesData[currentTradesIndex].trade_date === dt) {
            const t = tradesData[currentTradesIndex];
            const sym = t.portfolios?.symbol;
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
                
                // Get Price from KIS or Fallback to last known price
                const priceToday = historicalPrices[sym]?.[kisDateCode];
                if (priceToday) {
                    lastKnownPrice[sym] = priceToday;
                }
                
                // Usually there is no price on weekends, so we use the last known price.
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

    return reportData;
}
