-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key_name TEXT PRIMARY KEY,
    key_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read
CREATE POLICY "Allow public read-only access." ON system_settings FOR SELECT USING (true);

-- 2. Only admin can upsert/delete.
CREATE POLICY "Allow admin full access based on email" ON system_settings FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'tark202020@gmail.com'
) WITH CHECK (
  auth.jwt() ->> 'email' = 'tark202020@gmail.com'
);
