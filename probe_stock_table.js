// Supabase에 stock_master 테이블 생성 실행 스크립트

const SUPABASE_URL = 'https://jkeisufqjemsnqamiqlv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZWlzdWZxamVtc25xYW1pcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDkxMzAsImV4cCI6MjA4MTE4NTEzMH0.zmlqqSlA6B05wrdWRrxdF0qeCgHf7hB_J6Nam8H1Auo';

async function main() {
    console.log('=== stock_master 테이블 확인 ===\n');

    // 테이블 존재 확인
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stock_master?select=symbol,name,market&limit=3`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
    });

    if (res.ok) {
        const data = await res.json();
        console.log(`✅ stock_master 테이블 존재 (${data.length}개 행)`);
        if (data.length > 0) console.log('  샘플:', JSON.stringify(data[0]));
    } else {
        const err = await res.text();
        if (err.includes('does not exist') || err.includes('42P01')) {
            console.log('❌ stock_master 테이블 없음 → Supabase SQL Editor에서 생성 필요');
            console.log('\n아래 SQL을 Supabase SQL Editor에서 실행해주세요:');
            console.log(`
CREATE TABLE IF NOT EXISTS stock_master (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  market TEXT DEFAULT 'KR',
  standard_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_master_name ON stock_master(name);
CREATE INDEX IF NOT EXISTS idx_stock_master_market ON stock_master(market);

ALTER TABLE stock_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_master_read_all" ON stock_master FOR SELECT USING (true);
CREATE POLICY "stock_master_insert_all" ON stock_master FOR INSERT WITH CHECK (true);
CREATE POLICY "stock_master_update_all" ON stock_master FOR UPDATE USING (true);
CREATE POLICY "stock_master_delete_all" ON stock_master FOR DELETE USING (true);
`);
        } else {
            console.log('❌ API 에러:', err.slice(0, 200));
        }
    }

    // INSERT 테스트
    console.log('\n--- INSERT 테스트 ---');
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_master`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ symbol: 'TEST001', name: '테스트종목', market: 'KR' })
    });
    if (testRes.ok || testRes.status === 201) {
        console.log('✅ INSERT 성공');
        // Cleanup
        await fetch(`${SUPABASE_URL}/rest/v1/stock_master?symbol=eq.TEST001`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
        console.log('✅ 테스트 데이터 삭제 완료');
    } else {
        console.log('❌ INSERT 실패:', (await testRes.text()).slice(0, 200));
    }
}

main().catch(console.error);
