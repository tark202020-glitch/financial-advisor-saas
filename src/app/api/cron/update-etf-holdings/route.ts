import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET } from '@/lib/kis/client';

/**
 * /api/cron/update-etf-holdings
 *
 * 추적 대상 ETF의 보유종목/비중을 KIS API로 수집하고
 * 전일 대비 변경을 감지하여 DB에 저장합니다.
 *
 * Vercel Cron: 매일 UTC 07:30 (KST 16:30)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface HoldingItem {
    holding_symbol: string;
    holding_name: string;
    weight_pct: number;
}

// KIS API: ETF 구성종목 조회
async function fetchETFHoldings(etfSymbol: string, token: string): Promise<HoldingItem[]> {
    const url = `${BASE_URL}/uapi/etfetn/v1/quotations/inquire-component-stock-price`;
    const params = new URLSearchParams({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: etfSymbol,
        FID_COND_SCR_DIV_CODE: '11216',
    });

    try {
        const res = await fetch(`${url}?${params}`, {
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'authorization': `Bearer ${token}`,
                'appkey': APP_KEY!,
                'appsecret': APP_SECRET!,
                'tr_id': 'FHKST121600C0',
                'custtype': 'P',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            console.warn(`[ETF Holdings] ${etfSymbol}: HTTP ${res.status}`);
            return [];
        }

        const data = await res.json();

        if (data.rt_cd !== '0') {
            console.warn(`[ETF Holdings] ${etfSymbol}: ${data.msg1}`);
            return [];
        }

        // output2에 구성종목 정보
        const output2 = data.output2 || [];
        const holdings: HoldingItem[] = [];

        for (const item of output2) {
            const symbol = item.stck_shrn_iscd || item.stk_code || '';
            const name = item.stck_hkor_iscd || item.stk_name || item.hts_kor_isnm || '';
            const weight = parseFloat(item.stck_weit || item.itm_weit || '0');

            if (symbol && name && weight > 0) {
                holdings.push({
                    holding_symbol: symbol,
                    holding_name: name,
                    weight_pct: weight,
                });
            }
        }

        return holdings;
    } catch (e: any) {
        console.error(`[ETF Holdings] ${etfSymbol} 실패:`, e.message);
        return [];
    }
}

// 전일 대비 변경 감지
function detectChanges(
    etfSymbol: string,
    etfName: string,
    prevHoldings: HoldingItem[],
    currHoldings: HoldingItem[]
): Array<{
    etf_symbol: string;
    etf_name: string;
    change_date: string;
    change_type: string;
    holding_symbol: string;
    holding_name: string;
    prev_weight: number | null;
    curr_weight: number | null;
    weight_diff: number | null;
}> {
    const changes: any[] = [];
    const today = new Date().toISOString().slice(0, 10);

    const prevMap = new Map(prevHoldings.map(h => [h.holding_symbol, h]));
    const currMap = new Map(currHoldings.map(h => [h.holding_symbol, h]));

    // 신규 편입
    for (const [sym, curr] of currMap) {
        if (!prevMap.has(sym)) {
            changes.push({
                etf_symbol: etfSymbol,
                etf_name: etfName,
                change_date: today,
                change_type: 'added',
                holding_symbol: sym,
                holding_name: curr.holding_name,
                prev_weight: null,
                curr_weight: curr.weight_pct,
                weight_diff: curr.weight_pct,
            });
        }
    }

    // 편출
    for (const [sym, prev] of prevMap) {
        if (!currMap.has(sym)) {
            changes.push({
                etf_symbol: etfSymbol,
                etf_name: etfName,
                change_date: today,
                change_type: 'removed',
                holding_symbol: sym,
                holding_name: prev.holding_name,
                prev_weight: prev.weight_pct,
                curr_weight: null,
                weight_diff: -prev.weight_pct,
            });
        }
    }

    // 비중 변경 (±1% 이상)
    for (const [sym, curr] of currMap) {
        const prev = prevMap.get(sym);
        if (prev) {
            const diff = curr.weight_pct - prev.weight_pct;
            if (Math.abs(diff) >= 1.0) {
                changes.push({
                    etf_symbol: etfSymbol,
                    etf_name: etfName,
                    change_date: today,
                    change_type: 'weight_changed',
                    holding_symbol: sym,
                    holding_name: curr.holding_name,
                    prev_weight: prev.weight_pct,
                    curr_weight: curr.weight_pct,
                    weight_diff: parseFloat(diff.toFixed(4)),
                });
            }
        }
    }

    return changes;
}

export async function GET(request: NextRequest) {
    try {
        console.log('[ETF Cron] Starting ETF holdings update...');
        const startTime = Date.now();
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const today = new Date().toISOString().slice(0, 10);

        // 1. 추적 대상 ETF 목록 로드
        const { data: trackedETFs, error: listError } = await supabase
            .from('etf_tracked_list')
            .select('symbol, name, category')
            .eq('is_active', true);

        if (listError || !trackedETFs || trackedETFs.length === 0) {
            return NextResponse.json({
                success: false,
                error: listError?.message || 'No tracked ETFs found. Run /api/etf/select-active first.'
            });
        }

        console.log(`[ETF Cron] ${trackedETFs.length} ETFs to process`);

        // 2. KIS 토큰 획득
        const token = await getAccessToken();

        let totalHoldings = 0;
        let totalChanges = 0;
        let processedCount = 0;
        let errorCount = 0;

        // 3. 각 ETF에 대해 보유종목 수집
        for (const etf of trackedETFs) {
            try {
                // Rate limit: 1초 간격
                if (processedCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                const holdings = await fetchETFHoldings(etf.symbol, token);

                if (holdings.length === 0) {
                    console.log(`  [${etf.symbol}] ${etf.name}: 보유종목 없음 (스킵)`);
                    errorCount++;
                    processedCount++;
                    continue;
                }

                // 4. etf_holdings에 오늘 스냅샷 저장
                const holdingRecords = holdings.map(h => ({
                    etf_symbol: etf.symbol,
                    snapshot_date: today,
                    holding_symbol: h.holding_symbol,
                    holding_name: h.holding_name,
                    weight_pct: h.weight_pct,
                }));

                const { error: insertError } = await supabase
                    .from('etf_holdings')
                    .upsert(holdingRecords, {
                        onConflict: 'etf_symbol,snapshot_date,holding_symbol'
                    });

                if (insertError) {
                    console.error(`  [${etf.symbol}] Insert failed:`, insertError.message);
                    errorCount++;
                } else {
                    totalHoldings += holdings.length;
                }

                // 5. 전일 데이터 조회하여 변경 감지
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);

                const { data: prevHoldings } = await supabase
                    .from('etf_holdings')
                    .select('holding_symbol, holding_name, weight_pct')
                    .eq('etf_symbol', etf.symbol)
                    .eq('snapshot_date', yesterdayStr);

                if (prevHoldings && prevHoldings.length > 0) {
                    const changes = detectChanges(etf.symbol, etf.name, prevHoldings, holdings);
                    if (changes.length > 0) {
                        const { error: changeError } = await supabase
                            .from('etf_changes')
                            .insert(changes);

                        if (!changeError) {
                            totalChanges += changes.length;
                            console.log(`  [${etf.symbol}] ${etf.name}: ${holdings.length} holdings, ${changes.length} changes`);
                        }
                    }
                }

                processedCount++;
                console.log(`  [${processedCount}/${trackedETFs.length}] ${etf.symbol} ${etf.name}: ${holdings.length}개 보유종목`);

            } catch (e: any) {
                console.error(`  [${etf.symbol}] Error:`, e.message);
                errorCount++;
                processedCount++;
            }
        }

        const elapsedMs = Date.now() - startTime;
        console.log(`[ETF Cron] Complete: ${processedCount} processed, ${errorCount} errors, ${totalHoldings} holdings, ${totalChanges} changes, ${elapsedMs}ms`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            errors: errorCount,
            total_holdings: totalHoldings,
            total_changes: totalChanges,
            elapsed_ms: elapsedMs,
        });

    } catch (error: any) {
        console.error('[ETF Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
