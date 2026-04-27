-- 저장된 투자리포트 테이블
CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    summary JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_saved_reports_user ON saved_reports(user_id, created_at DESC);

-- RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- 서비스 롤 전체 접근
CREATE POLICY "Service role full access on saved_reports"
    ON saved_reports FOR ALL
    USING (true)
    WITH CHECK (true);

-- 인증된 사용자 본인 데이터만 조회
CREATE POLICY "Users can view own saved_reports"
    ON saved_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
