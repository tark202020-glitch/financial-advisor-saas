-- ============================================
-- JUBOT 통합 푸시 알림 시스템 테이블
-- 2026-04-27
-- ============================================

-- 1. 사용자 알림 설정
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 알림 수신 이메일 (로그인 이메일과 별도)
  notification_email TEXT,
  phone_number TEXT,
  kakao_id TEXT,
  -- 채널별 수신 on/off
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  kakao_enabled BOOLEAN DEFAULT false,
  -- 이벤트 유형별 수신 설정
  weekly_report_enabled BOOLEAN DEFAULT true,
  daily_briefing_enabled BOOLEAN DEFAULT false,
  portfolio_alert_enabled BOOLEAN DEFAULT true,
  system_notice_enabled BOOLEAN DEFAULT true,
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notification settings"
  ON user_notification_settings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings"
  ON user_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings"
  ON user_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. 푸시 컨텐츠 저장소
CREATE TABLE IF NOT EXISTS push_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,           -- 'weekly_report' | 'daily_briefing' | 'portfolio_alert' | 'custom'
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  ai_interaction_id TEXT,               -- Deep Research interaction ID (for async polling)
  status TEXT DEFAULT 'generating',     -- 'generating' | 'ready' | 'failed'
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE push_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own push content"
  ON push_content FOR SELECT
  USING (auth.uid() = user_id);
-- Service role needs insert/update access (for cron jobs)
CREATE POLICY "Service role can manage push content"
  ON push_content FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. 알림 발송 큐 & 이력
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 이벤트 메타데이터
  event_type TEXT NOT NULL,             -- 'weekly_report' | 'daily_briefing' | 'portfolio_alert' | 'system_notice'
  event_title TEXT NOT NULL,
  event_body TEXT,
  event_data JSONB DEFAULT '{}',
  -- 컨텐츠 링크
  content_id UUID REFERENCES push_content(id) ON DELETE SET NULL,
  access_token TEXT UNIQUE,
  content_url TEXT,
  -- 발송 상태
  channel TEXT NOT NULL,                -- 'email' | 'sms' | 'kakao'
  status TEXT DEFAULT 'pending',        -- 'pending' | 'sent' | 'failed' | 'read'
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  -- 수신자 정보 (발송 시점 기록)
  recipient TEXT,                       -- 발송 대상 (이메일 주소, 전화번호 등)
  -- 만료
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_push_notifications_user ON push_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_notifications_token ON push_notifications(access_token);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status) WHERE status = 'pending';

-- RLS
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications"
  ON push_notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage notifications"
  ON push_notifications FOR ALL
  USING (true)
  WITH CHECK (true);
