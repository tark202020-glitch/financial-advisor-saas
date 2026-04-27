import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET — 현재 사용자의 알림 설정 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 설정이 없으면 기본값 반환
    if (!settings) {
      return NextResponse.json({
        user_id: user.id,
        notification_email: null,
        phone_number: null,
        kakao_id: null,
        email_enabled: true,
        sms_enabled: false,
        kakao_enabled: false,
        monthly_report_enabled: true,
        daily_briefing_enabled: false,
        portfolio_alert_enabled: true,
        system_notice_enabled: true,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[Push Settings] GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT — 알림 설정 업데이트 (upsert)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 허용하는 필드만 추출
    const allowedFields = [
      'notification_email', 'phone_number', 'kakao_id',
      'email_enabled', 'sms_enabled', 'kakao_enabled',
      'monthly_report_enabled', 'daily_briefing_enabled',
      'portfolio_alert_enabled', 'system_notice_enabled',
    ];

    const updateData: Record<string, any> = { user_id: user.id, updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Service role client로 upsert (RLS 우회)
    const serviceClient = createServiceClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await serviceClient
      .from('user_notification_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[Push Settings] Upsert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Push Settings] PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
