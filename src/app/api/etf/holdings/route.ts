import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/etf/holdings
 *
 * ETF 보유종목 및 변경 기록 조회 API
 * - GET ?symbol=xxx → 특정 ETF 보유종목
 * - GET ?changes=true → 최근 변경 기록
 * - GET ?date=2026-03-18 → 특정 날짜 스냅샷
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const changesOnly = searchParams.get('changes') === 'true';
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // 변경 기록만 조회
        if (changesOnly) {
            let query = supabase
                .from('etf_changes')
                .select('*')
                .order('change_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(limit);

            if (symbol) {
                query = query.eq('etf_symbol', symbol);
            }
            if (date) {
                query = query.eq('change_date', date);
            }

            const { data, error } = await query;
            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                changes: data || [],
                count: data?.length || 0,
            });
        }

        // 특정 ETF 보유종목 조회
        if (symbol) {
            const targetDate = date || new Date().toISOString().slice(0, 10);

            // 해당 날짜 데이터 먼저 시도, 없으면 최신 데이터
            let { data, error } = await supabase
                .from('etf_holdings')
                .select('*')
                .eq('etf_symbol', symbol)
                .eq('snapshot_date', targetDate)
                .order('weight_pct', { ascending: false });

            if (!data || data.length === 0) {
                // 가장 최근 날짜 데이터
                const { data: latestData, error: latestError } = await supabase
                    .from('etf_holdings')
                    .select('*')
                    .eq('etf_symbol', symbol)
                    .order('snapshot_date', { ascending: false })
                    .order('weight_pct', { ascending: false })
                    .limit(50);

                if (latestData && latestData.length > 0) {
                    // 같은 날짜만 필터
                    const latestDate = latestData[0].snapshot_date;
                    data = latestData.filter(d => d.snapshot_date === latestDate);
                }
                error = latestError || null;
            }

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                symbol,
                snapshot_date: data?.[0]?.snapshot_date || targetDate,
                holdings: data || [],
                count: data?.length || 0,
            });
        }

        // 전체 개요: 최근 날짜의 모든 변경 요약
        const { data: recentChanges, error: changeError } = await supabase
            .from('etf_changes')
            .select('*')
            .order('change_date', { ascending: false })
            .limit(50);

        return NextResponse.json({
            success: true,
            recent_changes: recentChanges || [],
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
