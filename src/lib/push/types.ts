/**
 * JUBOT 통합 푸시 시스템 — 타입 정의
 */

// 지원하는 이벤트 유형
export type PushEventType =
  | 'weekly_report'      // 주간 투자리포트
  | 'daily_briefing'     // 일일 시장 브리핑
  | 'portfolio_alert'    // 포트폴리오 급변 알림
  | 'system_notice';     // 시스템 공지

// 지원하는 발송 채널
export type PushChannel = 'email' | 'sms' | 'kakao';

// Push 이벤트 발송 요청
export interface PushEvent {
  eventType: PushEventType;
  userId: string;
  title: string;
  body: string;
  contentId?: string;         // push_content 테이블 ID
  contentUrl?: string;        // 내부 경로 (e.g., /report)
  data?: Record<string, any>;
  expiresInDays?: number;     // 컨텐츠 만료일 (기본 7일)
}

// 사용자 알림 설정
export interface UserNotificationSettings {
  user_id: string;
  notification_email: string | null;
  phone_number: string | null;
  kakao_id: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  kakao_enabled: boolean;
  weekly_report_enabled: boolean;
  daily_briefing_enabled: boolean;
  portfolio_alert_enabled: boolean;
  system_notice_enabled: boolean;
  updated_at: string;
}

// 알림 발송 레코드
export interface PushNotification {
  id: string;
  user_id: string;
  event_type: PushEventType;
  event_title: string;
  event_body: string | null;
  event_data: Record<string, any>;
  content_id: string | null;
  access_token: string | null;
  content_url: string | null;
  channel: PushChannel;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sent_at: string | null;
  read_at: string | null;
  error_message: string | null;
  recipient: string | null;
  expires_at: string | null;
  created_at: string;
}

// 푸시 컨텐츠
export interface PushContent {
  id: string;
  user_id: string;
  content_type: string;
  title: string;
  payload: Record<string, any>;
  ai_interaction_id: string | null;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
  expires_at: string | null;
}

// 채널 어댑터 인터페이스
export interface ChannelAdapter {
  send(params: {
    recipient: string;
    title: string;
    body: string;
    linkUrl: string;
  }): Promise<{ success: boolean; error?: string }>;
}

// 이벤트 유형별 한국어 라벨
export const EVENT_TYPE_LABELS: Record<PushEventType, string> = {
  weekly_report: '주간 투자리포트',
  daily_briefing: '일일 시장 브리핑',
  portfolio_alert: '포트폴리오 급변 알림',
  system_notice: '시스템 공지',
};

// 이벤트 유형별 설정 필드 매핑
export const EVENT_SETTINGS_MAP: Record<PushEventType, keyof UserNotificationSettings> = {
  weekly_report: 'weekly_report_enabled',
  daily_briefing: 'daily_briefing_enabled',
  portfolio_alert: 'portfolio_alert_enabled',
  system_notice: 'system_notice_enabled',
};
