-- ETF 분석기 Supabase 테이블 3개

-- 1. 추적 대상 ETF 목록
CREATE TABLE IF NOT EXISTS etf_tracked_list (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'etc',  -- ai, strategy, dividend, etc
  market_cap BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etf_tracked_category ON etf_tracked_list(category);
CREATE INDEX IF NOT EXISTS idx_etf_tracked_active ON etf_tracked_list(is_active);

-- 2. 일별 보유종목 스냅샷
CREATE TABLE IF NOT EXISTS etf_holdings (
  id BIGSERIAL PRIMARY KEY,
  etf_symbol TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  holding_symbol TEXT NOT NULL,
  holding_name TEXT NOT NULL,
  weight_pct NUMERIC(8,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(etf_symbol, snapshot_date, holding_symbol)
);

CREATE INDEX IF NOT EXISTS idx_etf_holdings_etf_date ON etf_holdings(etf_symbol, snapshot_date);

-- 3. 변경 감지 기록
CREATE TABLE IF NOT EXISTS etf_changes (
  id BIGSERIAL PRIMARY KEY,
  etf_symbol TEXT NOT NULL,
  etf_name TEXT,
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_type TEXT NOT NULL,  -- 'added', 'removed', 'weight_changed'
  holding_symbol TEXT NOT NULL,
  holding_name TEXT NOT NULL,
  prev_weight NUMERIC(8,4),
  curr_weight NUMERIC(8,4),
  weight_diff NUMERIC(8,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etf_changes_date ON etf_changes(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_etf_changes_etf ON etf_changes(etf_symbol, change_date DESC);

-- RLS 정책 (전체 공개)
ALTER TABLE etf_tracked_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE etf_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etf_tracked_list_all" ON etf_tracked_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "etf_holdings_all" ON etf_holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "etf_changes_all" ON etf_changes FOR ALL USING (true) WITH CHECK (true);
