import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET } from '@/lib/kis/client';
import { appendETFHoldingsHorizontal } from '@/lib/googleSheets';

/**
 * /api/cron/update-etf-holdings
 *
 * 추적 대상 ETF의 보유종목/비중을 KIS API로 수집하고
 * 전일 대비 변경을 감지하여 DB + Google Sheets에 저장합니다.
 *
 * Vercel Cron: 평일 UTC 07:30 (KST 16:30)
 */

export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface HoldingItem {
    holding_symbol: string;
    holding_name: string;
    weight_pct: number;
}

// Google Sheets 가로 누적은 googleSheets.ts의 appendETFHoldingsHorizontal() 사용

// ======== KIS API: ETF 구성종목 조회 ========
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
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            console.warn(`[ETF] ${etfSymbol}: HTTP ${res.status}`);
            return [];
        }

        const data = await res.json();
        if (data.rt_cd !== '0') {
            console.warn(`[ETF] ${etfSymbol}: ${data.msg1}`);
            return [];
        }

        const output2 = data.output2 || [];
        const holdings: HoldingItem[] = [];

        for (const item of output2) {
            const symbol = item.stck_shrn_iscd || '';
            const name = item.hts_kor_isnm || '';
            const weight = parseFloat(item.etf_cnfg_issu_rlim || '0');

            if (symbol && name && weight > 0) {
                holdings.push({ holding_symbol: symbol, holding_name: name, weight_pct: weight });
            }
        }

        holdings.sort((a, b) => b.weight_pct - a.weight_pct);

        // 상위 10개만 반환 (데이터 양 최적화)
        return holdings.slice(0, 10);
    } catch (e: any) {
        console.error(`[ETF] ${etfSymbol} fetch 실패:`, e.message);
        return [];
    }
}

// ======== 전일 대비 변경 감지 ========
function detectChanges(etfSymbol: string, etfName: string, prev: HoldingItem[], curr: HoldingItem[], dateStr: string) {
    const changes: any[] = [];
    const today = dateStr;
    const prevMap = new Map(prev.map(h => [h.holding_symbol, h]));
    const currMap = new Map(curr.map(h => [h.holding_symbol, h]));

    for (const [sym, c] of currMap) {
        if (!prevMap.has(sym)) {
            changes.push({ etf_symbol: etfSymbol, etf_name: etfName, change_date: today,
                change_type: 'added', holding_symbol: sym, holding_name: c.holding_name,
                prev_weight: null, curr_weight: c.weight_pct, weight_diff: c.weight_pct });
        }
    }
    for (const [sym, p] of prevMap) {
        if (!currMap.has(sym)) {
            changes.push({ etf_symbol: etfSymbol, etf_name: etfName, change_date: today,
                change_type: 'removed', holding_symbol: sym, holding_name: p.holding_name,
                prev_weight: p.weight_pct, curr_weight: null, weight_diff: -p.weight_pct });
        }
    }
    for (const [sym, c] of currMap) {
        const p = prevMap.get(sym);
        if (p) {
            const diff = c.weight_pct - p.weight_pct;
            if (Math.abs(diff) >= 1.0) {
                changes.push({ etf_symbol: etfSymbol, etf_name: etfName, change_date: today,
                    change_type: 'weight_changed', holding_symbol: sym, holding_name: c.holding_name,
                    prev_weight: p.weight_pct, curr_weight: c.weight_pct,
                    weight_diff: parseFloat(diff.toFixed(4)) });
            }
        }
    }
    return changes;
}

// ======== 메인 핸들러 ========
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resetSheets = searchParams.get('reset') === 'true';

        console.log(`[ETF Cron] Starting...${resetSheets ? ' (RESET SHEETS)' : ''}`);
        const startTime = Date.now();
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // KST 기준 날짜 (UTC+9)
        const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
        const today = kstNow.toISOString().slice(0, 10);

        // 1. 추적 대상 ETF 로드
        const { data: trackedETFs, error: listError } = await supabase
            .from('etf_tracked_list')
            .select('symbol, name, category')
            .eq('is_active', true);

        if (listError || !trackedETFs || trackedETFs.length === 0) {
            return NextResponse.json({
                success: false,
                error: listError?.message || 'No tracked ETFs. Run /api/etf/select-active first.'
            });
        }

        console.log(`[ETF Cron] ${trackedETFs.length} ETFs`);

        // 2. KIS 토큰
        let token: string;
        try {
            token = await getAccessToken();
        } catch (tokenError: any) {
            const errorMsg = tokenError.message || '';
            const isBlocked = errorMsg.includes('EGW00103') || errorMsg.includes('유효하지 않은');
            console.error(`[ETF Cron] 토큰 발급 실패: ${errorMsg}`);
            return NextResponse.json({
                success: false,
                error: errorMsg,
                diagnosis: isBlocked 
                    ? 'KIS AppKey/IP가 일시 차단된 것으로 보입니다. KIS Developers에서 확인 후 Vercel 환경변수를 점검해주세요.'
                    : '토큰 발급에 실패했습니다. KIS API 키 설정을 확인해주세요.',
                recommendation: isBlocked
                    ? '1) KIS Developers 포털에서 AppKey 상태 확인, 2) 차단 해제 후 Vercel 환경변수 업데이트, 3) 재배포'
                    : '1) Vercel 환경변수 KIS_APP_KEY/KIS_APP_SECRET 확인, 2) 재배포',
            });
        }

        let totalHoldings = 0, totalChanges = 0, processedCount = 0, errorCount = 0;

        // Google Sheets 가로 누적을 위해 ETF별 데이터를 수집
        const sheetsDataList: Array<{
            etfName: string;
            etfSymbol: string;
            category: string;
            holdings: HoldingItem[];
        }> = [];

        // 3. 각 ETF 수집 (500ms 간격 — 속도 최적화)
        for (const etf of trackedETFs) {
            try {
                if (processedCount > 0) {
                    await new Promise(r => setTimeout(r, 500));
                }

                const holdings = await fetchETFHoldings(etf.symbol, token);
                processedCount++;

                if (holdings.length === 0) {
                    errorCount++;
                    continue;
                }

                // DB 저장
                const records = holdings.map(h => ({
                    etf_symbol: etf.symbol, snapshot_date: today,
                    holding_symbol: h.holding_symbol, holding_name: h.holding_name, weight_pct: h.weight_pct,
                }));

                const { error: dbErr } = await supabase
                    .from('etf_holdings')
                    .upsert(records, { onConflict: 'etf_symbol,snapshot_date,holding_symbol' });

                if (dbErr) {
                    console.error(`  [${etf.symbol}] DB:`, dbErr.message);
                    errorCount++;
                } else {
                    totalHoldings += holdings.length;
                }

                // Sheets 데이터 수집 (나중에 일괄 저장)
                sheetsDataList.push({
                    etfName: etf.name.trim(),
                    etfSymbol: etf.symbol,
                    category: etf.category,
                    holdings,
                });

                // 변경 감지: "가장 최근 이전 스냅샷"과 비교 (주말/공휴일 대응)
                const { data: prevSnapshot } = await supabase
                    .from('etf_holdings')
                    .select('snapshot_date')
                    .eq('etf_symbol', etf.symbol)
                    .lt('snapshot_date', today)
                    .order('snapshot_date', { ascending: false })
                    .limit(1)
                    .single();

                if (prevSnapshot?.snapshot_date) {
                    const { data: prevHoldings } = await supabase
                        .from('etf_holdings')
                        .select('holding_symbol, holding_name, weight_pct')
                        .eq('etf_symbol', etf.symbol)
                        .eq('snapshot_date', prevSnapshot.snapshot_date);

                    if (prevHoldings && prevHoldings.length > 0) {
                        const changes = detectChanges(etf.symbol, etf.name, prevHoldings, holdings, today);
                        if (changes.length > 0) {
                            const { error: chErr } = await supabase.from('etf_changes').insert(changes);
                            if (!chErr) {
                                totalChanges += changes.length;
                                console.log(`  [${etf.symbol}] 변경 감지 ${changes.length}건 (vs ${prevSnapshot.snapshot_date})`);
                            }
                        }
                    }
                }

                console.log(`  [${processedCount}/${trackedETFs.length}] ${etf.symbol} ${etf.name.trim()}: ${holdings.length}개`);

            } catch (e: any) {
                console.error(`  [${etf.symbol}] Error:`, e.message);
                errorCount++;
                processedCount++;
            }
        }

        // 4. Google Sheets 가로 누적 저장 (수집 완료 후 일괄)
        let sheetsResult = { success: false, updatedCells: 0, error: 'skipped' };
        if (sheetsDataList.length > 0) {
            try {
                const result = await appendETFHoldingsHorizontal(sheetsDataList, today, resetSheets);
                sheetsResult = {
                    success: result.success,
                    updatedCells: result.updatedCells || 0,
                    error: result.error || '',
                };
                if (result.success) {
                    console.log(`[ETF Cron] Sheets 가로 누적 완료: ${result.updatedCells}셀`);
                } else {
                    console.warn(`[ETF Cron] Sheets 실패: ${result.error}`);
                }
            } catch (e: any) {
                console.error('[ETF Cron] Sheets error:', e.message);
                sheetsResult = { success: false, updatedCells: 0, error: e.message };
            }
        }

        const ms = Date.now() - startTime;
        console.log(`[ETF Cron] Done: ${processedCount}/${trackedETFs.length}, db:${totalHoldings}, sheets:${sheetsResult.updatedCells}cells, chg:${totalChanges}, err:${errorCount}, ${ms}ms`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            errors: errorCount,
            total_holdings: totalHoldings,
            total_changes: totalChanges,
            google_sheets: sheetsResult,
            elapsed_ms: ms,
        });

    } catch (error: any) {
        console.error('[ETF Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
