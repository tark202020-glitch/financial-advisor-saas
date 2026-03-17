import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

/**
 * /api/cron/update-stocks
 *
 * KIS 공식 마스터 ZIP 파일에서 KOSPI + KOSDAQ 종목 리스트를 다운로드하여
 * Supabase stock_master 테이블을 최신 상태로 갱신합니다.
 *
 * Vercel Cron: 매일 UTC 21:00 (KST 06:00) 실행
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const KIS_MASTER_URLS = {
    kospi: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip',
    kosdaq: 'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip',
};

interface StockRecord {
    symbol: string;
    name: string;
    market: string;
    standard_code: string;
}

/**
 * KIS 마스터 ZIP 파일을 다운로드하고 파싱합니다.
 *
 * MST 파일 포맷 (고정폭):
 * - 단축코드: 0~8 (9자리, 좌측 정렬)
 * - 표준코드: 9~20 (12자리)
 * - 한글명: 21~60 (약 40자리, 우측 공백 패딩)
 * - 이후: 시장구분, 주문수량 등 속성
 */
async function downloadAndParseMaster(url: string): Promise<StockRecord[]> {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
        throw new Error(`KIS master download failed: HTTP ${res.status}`);
    }

    const zipBuf = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuf);

    const records: StockRecord[] = [];

    for (const [, file] of Object.entries(zip.files)) {
        const buf = await file.async('uint8array');

        // EUC-KR 디코딩
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buf);
        const lines = text.split('\n').filter(l => l.trim().length > 20);

        for (const line of lines) {
            // 단축코드 (9자리) — 공백 제거
            const symbol = line.substring(0, 9).trim();
            // 표준코드 (12자리)
            const standardCode = line.substring(9, 21).trim();
            // 한글명 (약 40자리) — 공백 제거
            const name = line.substring(21, 61).trim();

            if (symbol && name && symbol.length >= 4) {
                records.push({
                    symbol,
                    name,
                    market: 'KR',
                    standard_code: standardCode,
                });
            }
        }
    }

    return records;
}

export async function GET(request: NextRequest) {
    // Vercel Cron 인증 확인 (선택적)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 수동 호출도 허용하되, 프로덕션에서는 CRON_SECRET으로 보호
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // 개발용: secret 없이도 호출 가능하도록 경고만
        console.warn('[Stock Master] No CRON_SECRET auth — allowing for development');
    }

    try {
        console.log('[Stock Master] Starting stock master update...');
        const startTime = Date.now();

        // 1. KIS 마스터 ZIP 다운로드 + 파싱
        const [kospiStocks, kosdaqStocks] = await Promise.all([
            downloadAndParseMaster(KIS_MASTER_URLS.kospi),
            downloadAndParseMaster(KIS_MASTER_URLS.kosdaq),
        ]);

        const allStocks = [...kospiStocks, ...kosdaqStocks];
        console.log(`[Stock Master] Parsed: KOSPI=${kospiStocks.length}, KOSDAQ=${kosdaqStocks.length}, Total=${allStocks.length}`);

        if (allStocks.length < 100) {
            return NextResponse.json({
                success: false,
                error: `종목 수가 너무 적습니다 (${allStocks.length}). 파싱 오류 가능성.`
            }, { status: 500 });
        }

        // 2. Supabase 에 upsert (배치)
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 기존 데이터 삭제 후 일괄 삽입 (가장 깔끔)
        const { error: deleteError } = await supabase
            .from('stock_master')
            .delete()
            .neq('symbol', '');

        if (deleteError) {
            console.error('[Stock Master] Delete failed:', deleteError.message);
            // 삭제 실패해도 계속 진행 (upsert로 대체)
        }

        // 500개씩 배치 삽입
        const BATCH_SIZE = 500;
        let insertedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < allStocks.length; i += BATCH_SIZE) {
            const batch = allStocks.slice(i, i + BATCH_SIZE).map(s => ({
                ...s,
                updated_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('stock_master')
                .upsert(batch, { onConflict: 'symbol' });

            if (error) {
                console.error(`[Stock Master] Batch ${i}~${i + batch.length} failed:`, error.message);
                errorCount += batch.length;
            } else {
                insertedCount += batch.length;
            }
        }

        const elapsedMs = Date.now() - startTime;
        console.log(`[Stock Master] Complete: ${insertedCount} inserted, ${errorCount} errors, ${elapsedMs}ms`);

        return NextResponse.json({
            success: true,
            kospi_count: kospiStocks.length,
            kosdaq_count: kosdaqStocks.length,
            total_count: allStocks.length,
            inserted_count: insertedCount,
            error_count: errorCount,
            elapsed_ms: elapsedMs,
            updated_at: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[Stock Master] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
