-- Create the study_boards table
CREATE TABLE IF NOT EXISTS study_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL CHECK (topic IN ('msci', 'dividend', 'etf')),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for faster queries by topic
CREATE INDEX IF NOT EXISTS idx_study_boards_topic ON study_boards(topic);

-- Enable RLS
ALTER TABLE study_boards ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Anyone can read study boards
CREATE POLICY "Allow public read-only access on study_boards" ON study_boards FOR SELECT USING (true);

-- 2. Only admin can insert/update/delete.
CREATE POLICY "Allow admin full access based on email" ON study_boards FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'tark202020@gmail.com'
) WITH CHECK (
  auth.jwt() ->> 'email' = 'tark202020@gmail.com'
);
