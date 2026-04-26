import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDomesticStockHistory, getOverseasStockHistory } from '@/lib/kis/client';
import { getMarketType } from '@/utils/market';

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
    const currentExchangeRate = parseFloat(searchParams.get('exchangeRate') || '1450');

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // 1. Validation for 100 days
        if (diffDays > 100) {
            return NextResponse.json({ error: 'Date range cannot exceed 100 days' }, { status: 400 });
        }

        console.log(`[DynamicHistory] START: ${startDateStr} ~ ${endDateStr}, Diff: ${diffDays} days`);

        // 2. Fetch ALL trade logs up to endDate
        const { data: trades, error } = await supabase
            .from('trade_logs')
            .select(`
                id, trade_date, type, price, quantity, 
                portfolios(symbol, name)
            `)
            .eq('user_id', user.id)
            .lte('trade_date', endDateStr)
            .order('trade_date', { ascending: true });

        if (error) {
            console.error('[DynamicHistory] Trade logs query error:', JSON.stringify(error));
            return NextResponse.json({ error: 'Failed to fetch trade logs', detail: error.message }, { status: 500 });
        }

        const tradesData: any[] = trades || [];
        console.log(`[DynamicHistory] Trade logs found: ${tradesData.length}`);

        // 거래 내역이 없으면 빈 데이터를 반환
        if (tradesData.length === 0) {
            console.log('[DynamicHistory] No trade logs found. Returning empty data.');
            const dateArray = getDaysArray(start, end).map(d => d.toISOString().split('T')[0]);
            return NextResponse.json({
                data: dateArray.map(dt => ({ date: dt, total_investment: 0, total_valuation: 0 })),
                failedSymbols: []
            });
        }

        // 3. Compute Unique Symbols
        const symbolsMap: Record<string, string> = {};
        tradesData.forEach(t => {
            const port = Array.isArray(t.portfolios) ? t.portfolios[0] : t.portfolios;
            if (port && port.symbol) {
                symbolsMap[port.symbol] = getMarketType(port.symbol);
            }
        });

        const uniqueSymbols = Object.keys(symbolsMap);

        // 4. Check DB Cache (portfolio_daily_history)
        // 만약 이미 해당 기간에 대한 캐시가 DB에 있다면 KIS API를 우회하여 반환
        const { data: cachedData } = await supabase
            .from('portfolio_daily_history')
            .select('record_date, total_investment, total_valuation')
            .eq('user_id', user.id)
            .gte('record_date', startDateStr)
            .lte('record_date', endDateStr)
            .order('record_date', { ascending: true });

        // 조회하고자 하는 날짜 수(diffDays + 1)와 캐시된 데이터 수가 정확히 일치한다면 온전한 캐시로 간주
        if (cachedData && cachedData.length === diffDays + 1) {
            console.log(`[DynamicHistory] Full cache hit! Returning ${cachedData.length} records from DB.`);
            return NextResponse.json({
                data: cachedData.map(c => ({
                    date: c.record_date,
                    total_investment: c.total_investment,
                    total_valuation: c.total_valuation
                })),
                failedSymbols: []
            });
        }

        console.log(`[DynamicHistory] Cache miss or incomplete (Found ${cachedData?.length || 0} / Needed ${diffDays + 1}). Reconstructing...`);

        // 5. KIS API Fetching (with 15 days buffer for initial price & 3 Retries)
        const kisStart = new Date(start);
        kisStart.setDate(kisStart.getDate() - 15);
        const kisStartDateCode = formatAsKisDate(kisStart.toISOString().split('T')[0]);
        const kisEndDateCode = formatAsKisDate(endDateStr);

        const historicalPrices: Record<string, Record<string, number>> = {};
        const failedSymbols: string[] = [];

        const fetchWithRetry = async (symbol: string, category: string, retries = 3): Promise<any[]> => {
            if (category === 'GOLD') return []; // 금현물은 과거 이력 API 미지원, fallback(스냅샷 현재가)으로 처리

            // KR 종목은 .KS/.KQ 접미사 제거 (KIS API는 순수 6자리 코드 필요)
            const cleanSymbol = category === 'KR' ? symbol.replace(/\.(KS|KQ)$/i, '') : symbol;

            for (let i = 0; i < retries; i++) {
                try {
                    const data = category === 'US'
                        ? await getOverseasStockHistory(cleanSymbol, kisStartDateCode, kisEndDateCode)
                        : await getDomesticStockHistory(cleanSymbol, kisStartDateCode, kisEndDateCode);
                    if (data && data.length > 0) return data;
                } catch (e: any) {
                    console.error(`[DynamicHistory] Fetch failed for ${symbol} (Attempt ${i + 1}/${retries}):`, e.message);
                }
                // 재시도 전 대기 (점진적 증가: 1초, 2초, 3초)
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
            return []; // Failed after retries
        };

        // 순차 실행: 초당 거래건수 제한 방지를 위해 한 종목씩 요청 + 딜레이
        console.log(`[DynamicHistory] Fetching ${uniqueSymbols.length} symbols sequentially...`);
        for (let idx = 0; idx < uniqueSymbols.length; idx++) {
            const symbol = uniqueSymbols[idx];
            const category = symbolsMap[symbol];

            // 요청 간 500ms 딜레이 (첫 번째 요청 제외)
            if (idx > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`[DynamicHistory] Fetching [${idx + 1}/${uniqueSymbols.length}] ${symbol} (${category})...`);
            const data = await fetchWithRetry(symbol, category);
            historicalPrices[symbol] = {};

            if (data && data.length > 0) {
                data.forEach((day: any) => {
                    const dateCode = day.stck_bsop_date;
                    const closePrice = parseFloat(category === 'US' ? (day.ovrs_nmix_prpr || day.clos || '0') : (day.stck_clpr || '0'));
                    if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                });
            } else if (category !== 'GOLD') {
                console.warn(`[DynamicHistory] Completely failed to fetch history for ${symbol}`);
                failedSymbols.push(symbol);
            }
        }
        console.log(`[DynamicHistory] Fetch complete. Failed: ${failedSymbols.length} symbols.`);

        // 6. Generate daily timeline & calculate
        const dateArray = getDaysArray(start, end).map(d => d.toISOString().split('T')[0]);
        let currentTradesIndex = 0;
        const holdings: Record<string, { quantity: number; totalCost: number }> = {};

        // Pre-process trades BEFORE startDate
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

        // 초기 가격 확보를 위해 startDate 이전 버퍼 기간(-15일)의 데이터로 lastKnownPrice 웜업
        const lastKnownPrice: Record<string, number> = {};
        for (let bDate = new Date(kisStart); bDate < start; bDate.setDate(bDate.getDate() + 1)) {
            const kCode = formatAsKisDate(bDate.toISOString().split('T')[0]);
            for (const sym of uniqueSymbols) {
                const p = historicalPrices[sym]?.[kCode];
                if (p) lastKnownPrice[sym] = p;
            }
        }

        const reportData = [];

        // 메인 루프: startDate 부터 endDate 까지 Day-by-Day 전진
        for (const dt of dateArray) {
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

                    // 매입가를 Fallback으로 쓰지 않고 직전 거래일의 종가(lastKnownPrice)를 유지함.
                    // 애초에 조회를 100% 실패(failedSymbols)했더라도 평균단가를 억지로 쓰지 않음(평가액 0으로 처리되거나 직전 가격 유지).
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

        // 7. DB Cache Upsert
        // API 한도나 에러로 인해 failedSymbols가 생긴 날은 부정확할 수 있으므로 캐시하지 않음
        if (reportData.length > 0 && failedSymbols.length === 0) {
            const upsertPayload = reportData.map(d => ({
                user_id: user.id,
                record_date: d.date,
                total_investment: d.total_investment,
                total_valuation: d.total_valuation,
            }));

            const { error: upsertError } = await supabase
                .from('portfolio_daily_history')
                .upsert(upsertPayload, { onConflict: 'user_id, record_date' });

            if (upsertError) {
                console.error('[DynamicHistory] Cache upsert failed:', upsertError);
            } else {
                console.log(`[DynamicHistory] Successfully cached ${reportData.length} records.`);
            }
        }

        return NextResponse.json({
            data: reportData,
            failedSymbols: failedSymbols
        });

    } catch (err: any) {
        console.error('[DynamicHistory] Unhandled error:', err.message, err.stack);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
