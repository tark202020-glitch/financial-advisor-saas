import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/etf/select-active
 *
 * stock_master 테이블에서 "액티브" ETF를 자동 선정하여
 * etf_tracked_list 테이블에 저장합니다.
 *
 * 필터: "액티브" 포함, "커버드콜" 제외, 해외 제외
 * 카테고리: AI, 전략, 배당 (각 최대 10개)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 해외 ETF 제외 키워드
const FOREIGN_KEYWORDS = [
    '미국', '나스닥', 'S&P', '글로벌', '차이나', '일본', '유럽',
    '인도', '베트남', '해외', 'MSCI', '항셍', '니케이', '중국',
    '대만', '원유', '달러', '엔화', '유로', '브라질'
];

// 카테고리 키워드 정의
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    ai: ['AI', '인공지능', '로봇', '자율주행', '빅데이터', '클라우드',
         '반도체', '메타버스', '디지털', '소프트웨어', '테크', '양자',
         '데이터', 'ICT', '사이버', 'K로봇'],
    strategy: ['전략', '모멘텀', '밸류', '퀄리티', '성장', '멀티팩터',
               '스마트', '코스닥', '중소형', 'K수출', 'TOP', '핵심기업',
               '그로스', '코리아', '가치'],
    dividend: ['배당', '고배당', '월배당', '인컴', '리츠', 'REIT',
               '현금흐름', '이자']
};

function categorize(name: string): string {
    const upper = name.toUpperCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (upper.includes(kw.toUpperCase())) {
                return category;
            }
        }
    }
    return 'etc';
}

function isForeign(name: string): boolean {
    return FOREIGN_KEYWORDS.some(kw => name.includes(kw));
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 1. stock_master에서 "액티브" ETF 검색
        const { data: stocks, error: fetchError } = await supabase
            .from('stock_master')
            .select('symbol, name')
            .ilike('name', '%액티브%');

        if (fetchError) {
            return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        if (!stocks || stocks.length === 0) {
            return NextResponse.json({ success: false, error: '액티브 ETF를 찾을 수 없습니다.' });
        }

        console.log(`[ETF Select] stock_master에서 "액티브" 포함: ${stocks.length}개`);

        // 2. 필터링: 커버드콜 제외, 해외 제외
        const filtered = stocks.filter(s => {
            if (s.name.includes('커버드콜')) return false;
            if (isForeign(s.name)) return false;
            return true;
        });

        console.log(`[ETF Select] 필터 후: ${filtered.length}개 (커버드콜/해외 제외)`);

        // 3. 카테고리 분류
        const categorized: Record<string, typeof filtered> = { ai: [], strategy: [], dividend: [], etc: [] };
        for (const stock of filtered) {
            const cat = categorize(stock.name);
            categorized[cat].push(stock);
        }

        // 4. 카테고리당 최대 10개
        const selected: Array<{ symbol: string; name: string; category: string }> = [];
        for (const [category, list] of Object.entries(categorized)) {
            const top = list.slice(0, 10);
            for (const s of top) {
                selected.push({ symbol: s.symbol, name: s.name, category });
            }
        }

        console.log(`[ETF Select] 선정: AI=${categorized.ai.length}, 전략=${categorized.strategy.length}, 배당=${categorized.dividend.length}, 기타=${categorized.etc.length}`);

        // 5. etf_tracked_list 갱신 (기존 삭제 → 재삽입)
        await supabase.from('etf_tracked_list').delete().neq('symbol', '');

        const records = selected.map(s => ({
            symbol: s.symbol,
            name: s.name,
            category: s.category,
            is_active: true,
            updated_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
            .from('etf_tracked_list')
            .upsert(records, { onConflict: 'symbol' });

        if (insertError) {
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            total: selected.length,
            categories: {
                ai: categorized.ai.length,
                strategy: categorized.strategy.length,
                dividend: categorized.dividend.length,
                etc: categorized.etc.length,
            },
            selected: selected.slice(0, 30), // 미리보기
        });

    } catch (error: any) {
        console.error('[ETF Select] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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
