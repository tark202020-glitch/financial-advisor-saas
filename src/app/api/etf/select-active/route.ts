import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/etf/select-active
 *
 * stock_master 테이블에서 "액티브" ETF를 자동 선정하여
 * etf_tracked_list 테이블에 저장합니다.
 *
 * 필터: "액티브" 포함 + 제외 키워드 18개 적용
 * 카테고리: AI-테크(ai), 배당(dividend), 전략(strategy)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 제외 키워드 (통합)
const EXCLUDE_KEYWORDS = [
    '메타버스', 'ESG', 'China', '부동산', '채권', 'TDF', 'ACE',
    '회사채', '머니마켓', '바이오', '샤오미', '브로드컴', '팔란티어',
    '커버드콜', '글로벌', '차이나', '인도', '미국'
];

// 카테고리 키워드 정의
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    ai: ['AI', '자율주행', '반도체'],
    dividend: ['배당'],
    strategy: ['수출', '전략', '코스닥', '포커스', '에너지', '밸류업'],
};

function shouldExclude(name: string): boolean {
    const upper = name.toUpperCase();
    return EXCLUDE_KEYWORDS.some(kw => upper.includes(kw.toUpperCase()));
}

function categorize(name: string): string | null {
    const upper = name.toUpperCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (upper.includes(kw.toUpperCase())) {
                return category;
            }
        }
    }
    return null; // 미분류 → 선정 제외
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

        // 2. 제외 키워드 필터링
        const afterExclude = stocks.filter(s => !shouldExclude(s.name));
        console.log(`[ETF Select] 제외 키워드 적용 후: ${afterExclude.length}개`);

        // 3. 카테고리 분류 (미분류는 선정 제외)
        const categorized: Record<string, typeof afterExclude> = { ai: [], strategy: [], dividend: [] };
        for (const stock of afterExclude) {
            const cat = categorize(stock.name);
            if (cat && categorized[cat]) {
                categorized[cat].push(stock);
            }
        }

        // 4. 전체 매칭 종목 선정 (카테고리당 제한 없음)
        const selected: Array<{ symbol: string; name: string; category: string }> = [];
        for (const [category, list] of Object.entries(categorized)) {
            for (const s of list) {
                selected.push({ symbol: s.symbol, name: s.name, category });
            }
        }

        console.log(`[ETF Select] 선정: AI-테크=${categorized.ai.length}, 배당=${categorized.dividend.length}, 전략=${categorized.strategy.length}, 합계=${selected.length}`);

        // 5. 기존 데이터 전체 리셋 (tracked_list + holdings + changes)
        await supabase.from('etf_changes').delete().neq('id', 0);
        await supabase.from('etf_holdings').delete().neq('id', 0);
        await supabase.from('etf_tracked_list').delete().neq('symbol', '');
        console.log('[ETF Select] 기존 데이터 전체 삭제 완료');

        // 6. 새 목록 삽입
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
            },
            selected,
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
