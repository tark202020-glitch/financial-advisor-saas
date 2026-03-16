// KIS API 직접 진단 스크립트
// 1. Supabase에 캐시된 토큰 확인
// 2. KIS API 직접 토큰 발급 시도
// 3. 기존 토큰으로 가격 조회 시도

const SUPABASE_URL = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
const KIS_APP_KEY = 'PSyZeUkvAMKC84bH1mpFaaIvCfedjCwhw4bM';
const KIS_APP_SECRET = 'y+EMhHskkeLYHIHISKpVO8LaUlsKw+wuaoXMwXwsmOB5rmwcC8ZQqzbTAoPM9dVrijOS3/HvSovOwa6XRW5C3sirKjmxJ+K62jquZQmEp09P2olT1jK2zgcSNc0AcdC6MBLgb/sxRJNiTsUnSyDRXetV2zzwOGMOm6MjfdGAwalyetzwtqM=';

async function main() {
    console.log('=== KIS API 직접 진단 ===');
    console.log('시각:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
    console.log('');

    // 1. Supabase 토큰 캐시 확인
    console.log('--- 1. Supabase 토큰 캐시 확인 ---');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens?select=id,token,expires_at,created_at&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
        const tokens = await res.json();
        if (tokens.length === 0) {
            console.log('⚠️  Supabase에 캐시된 토큰 없음!');
        } else {
            tokens.forEach((t, i) => {
                const expiresAt = new Date(t.expires_at);
                const now = new Date();
                const isValid = expiresAt > now;
                console.log(`  [${i}] id=${t.id}, valid=${isValid}, expires=${t.expires_at}, token=${t.token.substring(0, 20)}...`);
            });
        }

        // 유효한 토큰 찾기
        const validToken = tokens.find(t => new Date(t.expires_at) > new Date());
        if (validToken) {
            console.log('\n✅ 유효한 캐시 토큰 발견! 이 토큰으로 가격 조회 테스트...');
            await testPriceWithToken(validToken.token);
        } else {
            console.log('\n❌ 유효한 캐시 토큰 없음. 새 토큰 발급 시도...');
        }
    } catch (e) {
        console.log('❌ Supabase 조회 실패:', e.message);
    }

    // 2. KIS API 토큰 발급 직접 시도
    console.log('\n--- 2. KIS API 토큰 발급 직접 시도 ---');
    try {
        const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                appkey: KIS_APP_KEY,
                appsecret: KIS_APP_SECRET,
            })
        });

        const text = await res.text();
        console.log(`  Status: ${res.status}`);
        console.log(`  Response: ${text.substring(0, 500)}`);

        if (res.ok) {
            const data = JSON.parse(text);
            console.log('\n✅ 토큰 발급 성공!');
            console.log(`  Token: ${data.access_token?.substring(0, 30)}...`);
            console.log(`  Expires in: ${data.expires_in}s (${Math.round(data.expires_in/3600)}h)`);

            // 발급된 토큰으로 가격 조회 테스트
            await testPriceWithToken(data.access_token);

            // Supabase에 저장
            console.log('\n--- Supabase에 토큰 저장 ---');
            // 기존 토큰 삭제
            await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens?id=neq.0`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                }
            });
            // 새 토큰 저장
            const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
            const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ token: data.access_token, expires_at: expiresAt.toISOString() })
            });
            console.log(`  Save status: ${saveRes.status} ${saveRes.ok ? '✅ 저장됨' : '❌ 저장 실패'}`);
        } else {
            console.log('\n❌ 토큰 발급 실패');
            if (text.includes('EGW00103')) {
                console.log('  → EGW00103: 토큰 발급 한도 초과. 일일 한도가 아직 리셋되지 않았습니다.');
                console.log('  → KIS API 토큰 한도는 보통 오전 7:00 또는 장 시작 시 리셋됩니다.');
            }
        }
    } catch (e) {
        console.log('❌ KIS API 연결 실패:', e.message);
    }
}

async function testPriceWithToken(token) {
    console.log('\n--- 가격 조회 테스트 (삼성전자 005930) ---');
    try {
        const res = await fetch(`${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=005930`, {
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`,
                'appkey': KIS_APP_KEY,
                'appsecret': KIS_APP_SECRET,
                'tr_id': 'FHKST01010100',
            }
        });
        const data = await res.json();
        if (data.rt_cd === '0') {
            console.log(`  ✅ 삼성전자 현재가: ${Number(data.output.stck_prpr).toLocaleString()}원`);
            console.log(`  시장명: ${data.output.rprs_mrkt_kor_name}`);
        } else {
            console.log(`  ❌ API 에러: ${data.msg1}`);
            console.log(`  msg_cd: ${data.msg_cd}`);
        }
    } catch (e) {
        console.log(`  ❌ 가격 조회 실패: ${e.message}`);
    }
}

main().catch(console.error);
