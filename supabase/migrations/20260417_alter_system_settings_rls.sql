-- Update RLS for system_settings to allow multiple admins
DROP POLICY IF EXISTS "Allow admin full access based on email" ON system_settings;

CREATE POLICY "Allow admin full access based on email" ON system_settings FOR ALL 
USING (
  auth.jwt() ->> 'email' IN ('tark202020@gmail.com', 'tark2020@naver.com')
) WITH CHECK (
  auth.jwt() ->> 'email' IN ('tark202020@gmail.com', 'tark2020@naver.com')
);
