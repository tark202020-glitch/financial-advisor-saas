// Supabase kis_tokens 테이블 스키마 변경 스크립트
// 분산 잠금을 위한 컬럼 추가

const SUPABASE_URL = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

async function main() {
    console.log('=== kis_tokens 테이블 컬럼 추가 ===\n');

    // 1. 현재 구조 확인
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens?select=*&limit=1`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
    });
    const rows = await res.json();
    console.log('현재 kis_tokens 구조:', rows.length > 0 ? Object.keys(rows[0]) : '빈 테이블');

    // 2. refreshing_until 컬럼이 이미 있는지 확인
    if (rows.length > 0 && 'refreshing_until' in rows[0]) {
        console.log('✅ refreshing_until 컬럼 이미 존재');
    } else {
        console.log('⚠️  refreshing_until 컬럼 없음 → Supabase SQL Editor에서 추가 필요:');
        console.log('   ALTER TABLE kis_tokens ADD COLUMN refreshing_until TIMESTAMPTZ DEFAULT NULL;');
        console.log('   ALTER TABLE kis_tokens ADD COLUMN last_refresh_attempt TIMESTAMPTZ DEFAULT NULL;');
    }

    // 3. 기존 row에 컬럼 추가 시도 (PATCH로 null 설정 - 컬럼 있으면 성공, 없으면 무시)
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/kis_tokens?id=gt.0`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ refreshing_until: null, last_refresh_attempt: null })
    });
    if (testRes.ok) {
        console.log('✅ refreshing_until, last_refresh_attempt 컬럼 접근 가능');
    } else {
        const err = await testRes.text();
        console.log('❌ 컬럼 접근 불가:', err.slice(0, 200));
        console.log('\n>>> Supabase Dashboard SQL Editor에서 다음 SQL을 실행해주세요:');
        console.log('ALTER TABLE kis_tokens ADD COLUMN IF NOT EXISTS refreshing_until TIMESTAMPTZ DEFAULT NULL;');
        console.log('ALTER TABLE kis_tokens ADD COLUMN IF NOT EXISTS last_refresh_attempt TIMESTAMPTZ DEFAULT NULL;');
    }
}

main().catch(console.error);
