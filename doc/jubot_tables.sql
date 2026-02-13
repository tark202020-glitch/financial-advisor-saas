-- JUBOT 테이블 생성 SQL

-- 1. 뉴스/기사 저장
CREATE TABLE IF NOT EXISTS jubot_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    related_symbols TEXT[],
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 공시 저장
CREATE TABLE IF NOT EXISTS jubot_disclosures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    company_name TEXT,
    report_name TEXT NOT NULL,
    report_type TEXT,
    ai_summary TEXT,
    impact TEXT CHECK (impact IN ('positive', 'negative', 'neutral')),
    dart_rcept_no TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI 분석 결과 저장
CREATE TABLE IF NOT EXISTS jubot_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('daily_briefing', 'portfolio_insight', 'stock_alert')),
    target_symbol TEXT,
    content JSONB NOT NULL,
    data_sources JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 사용자 설정 저장
CREATE TABLE IF NOT EXISTS jubot_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    news_sources JSONB DEFAULT '[]'::jsonb,
    analysis_schedule TEXT DEFAULT '2x',
    monitor_watchlist BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 (모든 테이블)
ALTER TABLE jubot_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jubot_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE jubot_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE jubot_settings ENABLE ROW LEVEL SECURITY;

-- jubot_articles: 본인 데이터만 접근 + 공용(user_id IS NULL) 데이터 읽기
CREATE POLICY "Users can read own or public articles" ON jubot_articles FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own articles" ON jubot_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own articles" ON jubot_articles FOR DELETE USING (auth.uid() = user_id);

-- jubot_disclosures
CREATE POLICY "Users can read own disclosures" ON jubot_disclosures FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own disclosures" ON jubot_disclosures FOR INSERT WITH CHECK (auth.uid() = user_id);

-- jubot_analysis
CREATE POLICY "Users can read own analysis" ON jubot_analysis FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own analysis" ON jubot_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- jubot_settings
CREATE POLICY "Users can read own settings" ON jubot_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON jubot_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON jubot_settings FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_jubot_articles_user ON jubot_articles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jubot_analysis_user_type ON jubot_analysis(user_id, analysis_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jubot_disclosures_symbol ON jubot_disclosures(symbol, created_at DESC);
