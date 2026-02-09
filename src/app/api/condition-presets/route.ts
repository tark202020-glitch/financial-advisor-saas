import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET: 현재 사용자의 프리셋 목록 조회
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('condition_presets')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[Presets] GET error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (e: any) {
        console.error('[Presets] GET exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: 새 프리셋 저장 또는 기존 프리셋 업데이트
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { name, conditions, id } = body;

        if (!name || !conditions) {
            return NextResponse.json({ error: '이름과 조건을 입력해주세요.' }, { status: 400 });
        }

        if (id) {
            // Update existing
            const { data, error } = await supabase
                .from('condition_presets')
                .update({ name, conditions, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json(data);
        } else {
            // Insert new
            const { data, error } = await supabase
                .from('condition_presets')
                .insert({ user_id: user.id, name, conditions })
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json(data);
        }
    } catch (e: any) {
        console.error('[Presets] POST exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: 프리셋 삭제
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('condition_presets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Presets] DELETE exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
