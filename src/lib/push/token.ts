/**
 * JUBOT 통합 푸시 시스템 — 토큰 생성 및 검증
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 고유 access token 생성
 */
export function generateAccessToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

/**
 * 토큰으로 알림 레코드 조회
 */
export async function getNotificationByToken(token: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('push_notifications')
    .select('*, push_content(*)')
    .eq('access_token', token)
    .single();

  if (error || !data) return null;

  // 만료 확인
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data;
}

/**
 * 알림 읽음 상태 업데이트
 */
export async function markNotificationRead(token: string) {
  const supabase = getServiceClient();
  await supabase
    .from('push_notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('access_token', token);
}

/**
 * 토큰의 소유자 user_id 조회
 */
export async function getTokenOwner(token: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('push_notifications')
    .select('user_id')
    .eq('access_token', token)
    .single();

  return data?.user_id || null;
}
