import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * /api/jubot/history
 * 
 * Phase 3: 분석 히스토리 CRUD
 * 
 * GET  - 분석 히스토리 조회 (타입 필터 가능)
 * POST - 분석 결과 저장
 */

// GET: 히스토리 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'daily_briefing' | 'portfolio_insight' | 'stock_analysis'
        const limit = parseInt(searchParams.get('limit') || '20');
        const symbol = searchParams.get('symbol'); // specific stock

        let query = supabase
            .from('jubot_analysis')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (type) query = query.eq('analysis_type', type);
        if (symbol) query = query.eq('target_symbol', symbol);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            history: data || [],
        });
    } catch (error: any) {
        console.error('[Jubot History] GET Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: 분석 결과 저장
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
        }

        const body = await request.json();
        const { analysis_type, target_symbol, content, data_sources } = body;

        if (!analysis_type || !content) {
            return NextResponse.json({ success: false, error: 'analysis_type과 content는 필수입니다' });
        }

        const { data, error } = await supabase
            .from('jubot_analysis')
            .insert({
                user_id: user.id,
                analysis_type,
                target_symbol: target_symbol || null,
                content,
                data_sources: data_sources || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            saved: data,
        });
    } catch (error: any) {
        console.error('[Jubot History] POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
