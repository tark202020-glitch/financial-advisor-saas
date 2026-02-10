import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey);
}

// Extract user_id from Authorization header (Supabase JWT)
async function getUserId(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

// GET: Fetch all memos for the current user
export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('stock_memos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

// POST: Create a new memo
export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, page_path, page_name } = body;

    if (!content || content.trim() === '') {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('stock_memos')
        .insert({
            user_id: userId,
            title: title || '',
            content: content.trim(),
            page_path: page_path || '',
            page_name: page_name || '',
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}

// PATCH: Update an existing memo
export async function PATCH(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content } = body;

    if (!id) {
        return NextResponse.json({ error: 'Memo ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('stock_memos')
        .update({
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content: content.trim() }),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE: Delete a memo
export async function DELETE(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Memo ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('stock_memos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
