import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all memos for the current user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('stock_memos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Memos] GET error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (e: any) {
        console.error('[Memos] GET exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Create a new memo
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, page_path, page_name } = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('stock_memos')
            .insert({
                user_id: user.id,
                title: title || '',
                content: content.trim(),
                page_path: page_path || '',
                page_name: page_name || '',
            })
            .select()
            .single();

        if (error) {
            console.error('[Memos] POST error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        console.error('[Memos] POST exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PATCH: Update an existing memo
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { id, title, content } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('stock_memos')
            .update({
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content: content.trim() }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[Memos] PATCH error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error('[Memos] PATCH exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: Delete a memo
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
            .from('stock_memos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[Memos] DELETE error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Memos] DELETE exception:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
