import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDomesticPrice, getOverseasPrice, getGoldSpotPrice, getDomesticStockHistory, getOverseasStockHistory } from '@/lib/kis/client';
import { getMarketType } from '@/utils/market';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 일회성 수정 API: 4월 8, 9, 10일의 portfolio_daily_history를 
 * 현재 스냅샷 로직과 동일한 방식으로 재계산하여 DB를 업데이트합니다.
 * 
 * 호출 방법: GET /api/fix-snapshot?dates=2026-04-08,2026-04-09,2026-04-10
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const datesParam = searchParams.get('dates') || '2026-04-08,2026-04-09,2026-04-10';
    const targetDates = datesParam.split(',').map(d => d.trim());

    try {
        console.log(`[FixSnapshot] Starting recalculation for dates: ${targetDates.join(', ')}`);

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        // 1. 기존 스냅샷 조회 (수정 대상 날짜)
        const { data: existingSnapshots, error: fetchErr } = await supabase
            .from('portfolio_daily_history')
            .select('*')
            .in('record_date', targetDates);

        if (fetchErr) throw fetchErr;

        if (!existingSnapshots || existingSnapshots.length === 0) {
            return NextResponse.json({ message: 'No existing snapshots found for the target dates', targetDates });
        }

        console.log(`[FixSnapshot] Found ${existingSnapshots.length} existing snapshots to recalculate.`);

        // 2. 전체 기간에 대한 KIS 과거 종가를 수집
        // 기존 스냅샷의 assets_snapshot에서 심볼 목록 추출
        const allSymbols = new Set<string>();
        existingSnapshots.forEach(snap => {
            if (snap.assets_snapshot) {
                snap.assets_snapshot.forEach((asset: any) => {
                    allSymbols.add(asset.symbol);
                });
            }
        });

        const sortedDates = [...targetDates].sort();
        const kisStartDate = sortedDates[0].replace(/-/g, '');
        const kisEndDate = sortedDates[sortedDates.length - 1].replace(/-/g, '');

        console.log(`[FixSnapshot] Fetching KIS history for ${allSymbols.size} symbols, ${kisStartDate}~${kisEndDate}`);

        // symbol -> { 'YYYYMMDD': price }
        const historicalPrices: Record<string, Record<string, number>> = {};

        for (const symbol of allSymbols) {
            historicalPrices[symbol] = {};
            const category = getMarketType(symbol);

            try {
                if (category === 'US') {
                    const historyData = await getOverseasStockHistory(symbol, kisStartDate, kisEndDate);
                    console.log(`[FixSnapshot] US ${symbol}: ${historyData ? historyData.length : 'null'} records`);
                    if (historyData) {
                        historyData.forEach((day: any) => {
                            const dateCode = day.stck_bsop_date;
                            const closePrice = parseFloat(day.ovrs_nmix_prpr || day.clos || '0');
                            if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                        });
                    }
                } else if (category === 'KR') {
                    const cleanSymbol = symbol.replace('.KS', '');
                    const historyData = await getDomesticStockHistory(cleanSymbol, kisStartDate, kisEndDate);
                    console.log(`[FixSnapshot] DOM ${symbol}: ${historyData ? historyData.length : 'null'} records`);
                    if (historyData) {
                        historyData.forEach((day: any) => {
                            const dateCode = day.stck_bsop_date;
                            const closePrice = parseFloat(day.stck_clpr || '0');
                            if (dateCode && closePrice) historicalPrices[symbol][dateCode] = closePrice;
                        });
                    }
                }
            } catch (e: any) {
                console.error(`[FixSnapshot] Error fetching history for ${symbol}:`, e.message);
            }
        }

        // 3. 환율 조회
        let exchangeRate = 1350;
        try {
            const origin = request.nextUrl.origin;
            const exRes = await fetch(`${origin}/api/market-extra`, { cache: 'no-store' });
            if (exRes.ok) {
                const exData = await exRes.json();
                exchangeRate = exData.exchangeRates?.usd_krw?.price || 1350;
            }
        } catch {}
        console.log(`[FixSnapshot] Exchange rate: ${exchangeRate}`);

        // 4. 각 스냅샷을 재계산
        const results: any[] = [];

        for (const snap of existingSnapshots) {
            const dateKis = snap.record_date.replace(/-/g, '');
            const assetsSnapshot = snap.assets_snapshot || [];
            
            let totalInvested = 0;
            let totalValuation = 0;
            const newAssetsSnapshot: any[] = [];

            for (const asset of assetsSnapshot) {
                const category = getMarketType(asset.symbol);
                const exRateMultiplier = (category === 'US') ? exchangeRate : 1;

                const qty = Number(asset.quantity);
                const buyPrice = Number(asset.buy_price);

                // KIS 과거 종가로 현재가 교체
                const cleanSymbol = asset.symbol.replace('.KS', '');
                const kisPrice = historicalPrices[asset.symbol]?.[dateKis] 
                    || historicalPrices[cleanSymbol]?.[dateKis]
                    || 0;
                
                const currentPrice = kisPrice > 0 ? kisPrice : Number(asset.current_price);

                const investedKrw = buyPrice * qty * exRateMultiplier;
                const valuationKrw = currentPrice * qty * exRateMultiplier;

                totalInvested += investedKrw;
                totalValuation += valuationKrw;

                newAssetsSnapshot.push({
                    ...asset,
                    current_price: currentPrice,
                    invested_krw: investedKrw,
                    valuation_krw: valuationKrw,
                    is_failed: false,
                    _kis_price_used: kisPrice > 0
                });
            }

            // 5. DB 업데이트
            const { error: updateErr } = await supabase
                .from('portfolio_daily_history')
                .update({
                    total_investment: totalInvested,
                    total_valuation: totalValuation,
                    assets_snapshot: newAssetsSnapshot
                })
                .eq('id', snap.id);

            if (updateErr) {
                console.error(`[FixSnapshot] Update failed for ${snap.record_date}:`, updateErr);
                results.push({ date: snap.record_date, status: 'error', error: updateErr.message });
            } else {
                console.log(`[FixSnapshot] Updated ${snap.record_date}: investment=${totalInvested.toFixed(0)}, valuation=${totalValuation.toFixed(0)}`);
                results.push({ 
                    date: snap.record_date, 
                    status: 'updated',
                    total_investment: totalInvested,
                    total_valuation: totalValuation,
                    assets: newAssetsSnapshot.map(a => ({
                        symbol: a.symbol,
                        qty: a.quantity,
                        buy: a.buy_price,
                        current: a.current_price,
                        kisUsed: a._kis_price_used
                    }))
                });
            }
        }

        return NextResponse.json({ success: true, exchangeRate, results });

    } catch (error: any) {
        console.error('[FixSnapshot] Critical Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
