// SK스퀘어 KRX vs NXT 가격 비교 테스트 (장외 시간)
const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
const KIS_APP_KEY = 'PSyZeUkvAMKC84bH1mpFaaIvCfedjCwhw4bM';
const KIS_APP_SECRET = 'y+EMhHskkeLYHIHISKpVO8LaUlsKw+wuaoXMwXwsmOB5rmwcC8ZQqzbTAoPM9dVrijOS3/HvSovOwa6XRW5C3sirKjmxJ+K62jquZQmEp09P2olT1jK2zgcSNc0AcdC6MBLgb/sxRJNiTsUnSyDRXetV2zzwOGMOm6MjfdGAwalyetzwtqM=';

const SUPABASE_URL = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

async function getToken() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens?select=token,expires_at&order=created_at.desc&limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const tokens = await res.json();
    return tokens[0]?.token;
}

async function fetchPrice(token, symbol, marketCode) {
    const res = await fetch(`${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=${marketCode}&FID_INPUT_ISCD=${symbol}`, {
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${token}`,
            'appkey': KIS_APP_KEY,
            'appsecret': KIS_APP_SECRET,
            'tr_id': 'FHKST01010100',
        }
    });
    const data = await res.json();
    return data;
}

async function main() {
    const token = await getToken();
    if (!token) { console.log('토큰 없음!'); return; }

    const symbols = [
        { code: '402340', name: 'SK스퀘어' },
        { code: '005930', name: '삼성전자' },
        { code: '069500', name: 'KODEX200(ETF)' },
    ];

    console.log(`=== 장외 시간 KRX vs NXT 가격 비교 ===`);
    console.log(`시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`);

    for (const { code, name } of symbols) {
        console.log(`--- ${name} (${code}) ---`);

        // KRX(J)
        const krx = await fetchPrice(token, code, 'J');
        const krxPrice = krx.rt_cd === '0' ? krx.output.stck_prpr : 'ERROR: ' + krx.msg1;

        // NXT(NX)
        await new Promise(r => setTimeout(r, 300));
        const nxt = await fetchPrice(token, code, 'NX');
        const nxtPrice = nxt.rt_cd === '0' ? nxt.output.stck_prpr : 'ERROR: ' + nxt.msg1;

        console.log(`  KRX(J): ${Number(krxPrice).toLocaleString()}원`);
        console.log(`  NXT(NX): ${Number(nxtPrice).toLocaleString()}원`);

        if (krx.rt_cd === '0' && nxt.rt_cd === '0') {
            const diff = Number(nxtPrice) - Number(krxPrice);
            if (diff !== 0) {
                console.log(`  ⚠️  차이: ${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 (${(diff / Number(krxPrice) * 100).toFixed(2)}%)`);
            } else {
                console.log(`  ✅ 동일`);
            }
        }
        console.log('');
        await new Promise(r => setTimeout(r, 300));
    }
}

main().catch(console.error);
