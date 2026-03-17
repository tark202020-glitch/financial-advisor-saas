-- Supabase stock_master 테이블 생성
-- KIS 마스터 데이터에서 다운로드한 종목 리스트를 저장

CREATE TABLE IF NOT EXISTS stock_master (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  market TEXT DEFAULT 'KR',
  standard_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 종목명 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_master_name ON stock_master(name);
CREATE INDEX IF NOT EXISTS idx_stock_master_market ON stock_master(market);

-- RLS: 모든 사용자가 읽기 가능 (공개 데이터)
ALTER TABLE stock_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_master_read_all" ON stock_master
  FOR SELECT USING (true);

CREATE POLICY "stock_master_insert_all" ON stock_master
  FOR INSERT WITH CHECK (true);

CREATE POLICY "stock_master_update_all" ON stock_master
  FOR UPDATE USING (true);

CREATE POLICY "stock_master_delete_all" ON stock_master
  FOR DELETE USING (true);
