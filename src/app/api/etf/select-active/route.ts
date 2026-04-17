import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/etf/select-active
 *
 * 추적 대상 종목(ETF/주식) 관리 API
 *
 * GET    — 현재 추적 목록 조회
 * POST   — 개별 종목 추가 { symbol, name, category?, market?, memo? }
 * DELETE — 개별 종목 삭제 { symbol }
 * PATCH  — 종목 메모/카테고리 수정 { symbol, memo?, category? }
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET: 현재 추적 목록 조회
export async function GET() {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from('etf_tracked_list')
            .select('*')
            .eq('is_active', true)
            .order('category')
            .order('name');

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            total: data?.length || 0,
            tracked: data || [],
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: 개별 종목 추가
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol, name, category, market, memo } = body;

        if (!symbol || !name) {
            return NextResponse.json(
                { success: false, error: '종목코드(symbol)와 종목명(name)은 필수입니다.' },
                { status: 400 }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 이미 존재하는지 확인
        const { data: existing } = await supabase
            .from('etf_tracked_list')
            .select('symbol')
            .eq('symbol', symbol)
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: `이미 추적 목록에 등록된 종목입니다: ${symbol}` },
                { status: 409 }
            );
        }

        const record = {
            symbol,
            name,
            category: category || 'custom',
            market: market || 'KR',
            memo: memo || '',
            is_active: true,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('etf_tracked_list')
            .insert(record)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        console.log(`[ETF Tracker] 종목 추가: ${symbol} ${name} (${record.category})`);

        return NextResponse.json({
            success: true,
            message: `${name} (${symbol}) 추가 완료`,
            item: data,
        });

    } catch (error: any) {
        console.error('[ETF Tracker] POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: 개별 종목 삭제
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol } = body;

        if (!symbol) {
            return NextResponse.json(
                { success: false, error: '종목코드(symbol)는 필수입니다.' },
                { status: 400 }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 종목 삭제 (관련 holdings, changes는 유지 — 히스토리 보존)
        const { error } = await supabase
            .from('etf_tracked_list')
            .delete()
            .eq('symbol', symbol);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        console.log(`[ETF Tracker] 종목 삭제: ${symbol}`);

        return NextResponse.json({
            success: true,
            message: `${symbol} 삭제 완료`,
        });

    } catch (error: any) {
        console.error('[ETF Tracker] DELETE Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: 메모/카테고리 수정
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol, memo, category } = body;

        if (!symbol) {
            return NextResponse.json(
                { success: false, error: '종목코드(symbol)는 필수입니다.' },
                { status: 400 }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (memo !== undefined) updates.memo = memo;
        if (category !== undefined) updates.category = category;

        const { data, error } = await supabase
            .from('etf_tracked_list')
            .update(updates)
            .eq('symbol', symbol)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${symbol} 수정 완료`,
            item: data,
        });

    } catch (error: any) {
        console.error('[ETF Tracker] PATCH Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
