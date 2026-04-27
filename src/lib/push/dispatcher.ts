/**
 * JUBOT 통합 푸시 시스템 — Push Dispatcher (핵심 허브)
 * 
 * 모든 이벤트 소스가 호출하는 단일 진입점.
 * 사용자 알림 설정을 확인하고, 활성 채널별로 알림을 생성/발송합니다.
 */

import { createClient } from '@supabase/supabase-js';
import type { PushEvent, PushChannel, UserNotificationSettings } from './types';
import { EVENT_SETTINGS_MAP } from './types';
import { generateAccessToken } from './token';
import { emailChannel } from './channels/email';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 단일 사용자에게 푸시 알림 발송
 */
export async function dispatch(event: PushEvent, baseUrl: string): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const supabase = getServiceClient();
  const result = { sent: 0, failed: 0, errors: [] as string[] };

  try {
    // 1. 사용자 알림 설정 조회
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', event.userId)
      .single();

    // 설정이 없으면 기본값 사용 (이메일만 활성)
    const userSettings: UserNotificationSettings = settings || {
      user_id: event.userId,
      notification_email: null,
      phone_number: null,
      kakao_id: null,
      email_enabled: true,
      sms_enabled: false,
      kakao_enabled: false,
      weekly_report_enabled: true,
      daily_briefing_enabled: false,
      portfolio_alert_enabled: true,
      system_notice_enabled: true,
      updated_at: new Date().toISOString(),
    };

    // 2. 이벤트 유형별 수신 여부 확인
    const settingsKey = EVENT_SETTINGS_MAP[event.eventType];
    if (settingsKey && !userSettings[settingsKey]) {
      console.log(`[Push Dispatcher] User ${event.userId} opted out of ${event.eventType}`);
      return result;
    }

    // 3. 활성 채널 목록 결정
    const activeChannels: { channel: PushChannel; recipient: string }[] = [];

    if (userSettings.email_enabled && userSettings.notification_email) {
      activeChannels.push({ channel: 'email', recipient: userSettings.notification_email });
    }
    if (userSettings.sms_enabled && userSettings.phone_number) {
      activeChannels.push({ channel: 'sms', recipient: userSettings.phone_number });
    }
    if (userSettings.kakao_enabled && userSettings.kakao_id) {
      activeChannels.push({ channel: 'kakao', recipient: userSettings.kakao_id });
    }

    if (activeChannels.length === 0) {
      console.log(`[Push Dispatcher] User ${event.userId} has no active channels`);
      return result;
    }

    // 4. 각 채널별로 알림 생성 및 발송
    for (const { channel, recipient } of activeChannels) {
      const accessToken = generateAccessToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (event.expiresInDays || 7));

      // 컨텐츠 열람 URL 생성
      const linkUrl = `${baseUrl}/push/${accessToken}`;

      // DB에 알림 레코드 생성
      const { error: insertError } = await supabase
        .from('push_notifications')
        .insert({
          user_id: event.userId,
          event_type: event.eventType,
          event_title: event.title,
          event_body: event.body,
          event_data: event.data || {},
          content_id: event.contentId || null,
          access_token: accessToken,
          content_url: event.contentUrl || null,
          channel,
          status: 'pending',
          recipient,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error(`[Push Dispatcher] DB insert failed:`, insertError);
        result.failed++;
        result.errors.push(`DB insert: ${insertError.message}`);
        continue;
      }

      // 채널별 발송
      let sendResult: { success: boolean; error?: string } = { success: false, error: '' };

      switch (channel) {
        case 'email':
          sendResult = await emailChannel.send({
            recipient,
            title: event.title,
            body: event.body,
            linkUrl,
          });
          break;
        case 'sms':
          // Phase 2
          sendResult = { success: false, error: 'SMS 채널 미구현 (Phase 2)' };
          break;
        case 'kakao':
          // Phase 2
          sendResult = { success: false, error: '카카오 채널 미구현 (Phase 2)' };
          break;
      }

      // 발송 결과 업데이트
      if (sendResult.success) {
        await supabase
          .from('push_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('access_token', accessToken);
        result.sent++;
      } else {
        await supabase
          .from('push_notifications')
          .update({ status: 'failed', error_message: sendResult.error })
          .eq('access_token', accessToken);
        result.failed++;
        result.errors.push(`${channel}: ${sendResult.error}`);
      }
    }

    return result;

  } catch (error: any) {
    console.error(`[Push Dispatcher] Unexpected error:`, error);
    result.errors.push(error.message);
    return result;
  }
}

/**
 * 여러 사용자에게 동시 발송
 */
export async function dispatchToAll(
  events: PushEvent[],
  baseUrl: string
): Promise<{ totalSent: number; totalFailed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    events.map(event => dispatch(event, baseUrl))
  );

  let totalSent = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      totalSent += r.value.sent;
      totalFailed += r.value.failed;
      errors.push(...r.value.errors);
    } else {
      totalFailed++;
      errors.push(r.reason?.message || 'Unknown error');
    }
  }

  return { totalSent, totalFailed, errors };
}
