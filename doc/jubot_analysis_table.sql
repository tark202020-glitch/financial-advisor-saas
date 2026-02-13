-- 주봇 분석 히스토리 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS jubot_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('daily_briefing', 'portfolio_insight', 'stock_analysis')),
    target_symbol TEXT, -- stock_analysis일 때 종목코드
    content JSONB NOT NULL, -- AI 분석 결과 전체
    data_sources JSONB, -- 분석에 사용된 데이터 소스 메타
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_jubot_analysis_user_type ON jubot_analysis(user_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_jubot_analysis_created ON jubot_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jubot_analysis_symbol ON jubot_analysis(target_symbol) WHERE target_symbol IS NOT NULL;

-- RLS (Row Level Security)
ALTER TABLE jubot_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
    ON jubot_analysis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
    ON jubot_analysis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
    ON jubot_analysis FOR DELETE
    USING (auth.uid() = user_id);
