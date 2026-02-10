-- stock_memos 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS stock_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  page_path TEXT DEFAULT '',
  page_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security 활성화
ALTER TABLE stock_memos ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 메모만 CRUD 가능
CREATE POLICY "Users can CRUD own memos"
  ON stock_memos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_memos_updated_at
  BEFORE UPDATE ON stock_memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
