// KIS 마스터 ZIP → Supabase stock_master 첫 데이터 로딩
const JSZip = require('jszip');
const { TextDecoder } = require('util');

const SUPABASE_URL = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

const KIS_URLS = {
    kospi: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip',
    kosdaq: 'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip',
};

async function downloadAndParse(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const zipBuf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBuf);
    const records = [];

    for (const [, file] of Object.entries(zip.files)) {
        const buf = await file.async('uint8array');
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buf);
        const lines = text.split('\n').filter(l => l.trim().length > 20);

        for (const line of lines) {
            const symbol = line.substring(0, 9).trim();
            const standardCode = line.substring(9, 21).trim();
            const name = line.substring(21, 61).trim();

            if (symbol && name && symbol.length >= 4) {
                records.push({ symbol, name, market: 'KR', standard_code: standardCode });
            }
        }
    }
    return records;
}

async function main() {
    console.log('=== KIS 마스터 → Supabase 첫 로딩 ===\n');

    const [kospi, kosdaq] = await Promise.all([
        downloadAndParse(KIS_URLS.kospi),
        downloadAndParse(KIS_URLS.kosdaq),
    ]);

    const all = [...kospi, ...kosdaq];
    console.log(`파싱 완료: KOSPI=${kospi.length}, KOSDAQ=${kosdaq.length}, 합계=${all.length}`);

    // KoAct 검색
    const koact = all.filter(s => s.name.includes('KoAct') || s.name.includes('코스닥') && s.name.includes('액티브'));
    console.log(`\n🔍 KoAct 관련: ${koact.length}개`);
    koact.slice(0, 5).forEach(s => console.log(`  ${s.symbol} ${s.name}`));

    // Supabase에 배치 삽입
    console.log('\n--- Supabase 배치 삽입 ---');
    const BATCH_SIZE = 500;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < all.length; i += BATCH_SIZE) {
        const batch = all.slice(i, i + BATCH_SIZE).map(s => ({
            ...s, updated_at: new Date().toISOString()
        }));

        const res = await fetch(`${SUPABASE_URL}/rest/v1/stock_master`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify(batch),
        });

        if (res.ok || res.status === 201) {
            inserted += batch.length;
            process.stdout.write(`  ${inserted}/${all.length}\r`);
        } else {
            const err = await res.text();
            console.log(`\n  ❌ 배치 ${i} 실패: ${err.slice(0, 100)}`);
            errors += batch.length;
        }
    }

    console.log(`\n✅ 완료: ${inserted} 삽입, ${errors} 에러`);

    // 검증
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_master?select=count`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact',
        }
    });
    console.log(`DB 총 행: ${verifyRes.headers.get('content-range')}`);
}

main().catch(console.error);
