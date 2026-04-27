import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNotificationByToken, markNotificationRead, getTokenOwner } from '@/lib/push/token';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * GET — 토큰 기반 컨텐츠 조회
 * URL: /api/push/content/[token]
 * 
 * 인증 안 된 상태: 토큰 유효성 + 이벤트 기본 정보만 반환
 * 인증된 상태 (Authorization 헤더): 전체 컨텐츠 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 토큰으로 알림 조회
    const notification = await getNotificationByToken(token);

    if (!notification) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 링크입니다.' },
        { status: 404 }
      );
    }

    // 인증 여부 확인
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 인증 안 됨 — 기본 정보만 반환
      return NextResponse.json({
        authenticated: false,
        event_type: notification.event_type,
        event_title: notification.event_title,
        created_at: notification.created_at,
        requires_auth: true,
      });
    }

    // 인증 토큰 검증
    const sessionToken = authHeader.replace('Bearer ', '');
    const isValid = await verifySessionToken(sessionToken, notification.user_id);

    if (!isValid) {
      return NextResponse.json(
        { error: '인증이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 읽음 처리
    await markNotificationRead(token);

    // 전체 컨텐츠 반환
    return NextResponse.json({
      authenticated: true,
      event_type: notification.event_type,
      event_title: notification.event_title,
      event_body: notification.event_body,
      event_data: notification.event_data,
      content: notification.push_content || null,
      created_at: notification.created_at,
    });
  } catch (error: any) {
    console.error('[Push Content] GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST — 비밀번호 인증
 * Body: { email, password }
 * 
 * 성공 시 임시 세션 토큰 발급
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. 토큰 소유자 확인
    const ownerId = await getTokenOwner(token);
    if (!ownerId) {
      return NextResponse.json(
        { error: '유효하지 않은 링크입니다.' },
        { status: 404 }
      );
    }

    // 2. Supabase Auth로 비밀번호 검증
    const supabase = getServiceClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 3. 인증된 사용자가 토큰 소유자와 일치하는지 확인
    if (authData.user.id !== ownerId) {
      return NextResponse.json(
        { error: '이 리포트에 대한 접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 4. 임시 세션 토큰 생성 (간단한 방식: user_id + timestamp 기반)
    const sessionToken = generateSessionToken(authData.user.id);

    // 5. DB에 세션 토큰 저장 (push_notifications의 event_data에 저장)
    await supabase
      .from('push_notifications')
      .update({
        event_data: {
          ...(await getNotificationByToken(token))?.event_data,
          session_token: sessionToken,
          session_expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간
        },
      })
      .eq('access_token', token);

    return NextResponse.json({
      success: true,
      sessionToken,
    });
  } catch (error: any) {
    console.error('[Push Content] POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 간단한 세션 토큰 생성
 */
function generateSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}:${crypto.randomUUID()}`;
  // Base64 인코딩 (간단한 방식)
  return Buffer.from(payload).toString('base64url');
}

/**
 * 세션 토큰 검증
 */
async function verifySessionToken(sessionToken: string, expectedUserId: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(sessionToken, 'base64url').toString();
    const [userId, timestamp] = decoded.split(':');

    // user_id 일치 확인
    if (userId !== expectedUserId) return false;

    // 1시간 만료 확인
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    if (tokenAge > 60 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}
