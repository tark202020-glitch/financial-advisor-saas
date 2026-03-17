import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface StockResult {
    symbol: string;
    name: string;
    market: 'KR' | 'US' | 'GOLD';
    flag: string;
    exchange?: string;
}

// ---- Yahoo Finance Server-Side Search (해외 주식용) ----
async function searchYahooFinance(query: string): Promise<StockResult[]> {
    try {
        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) return [];

        const data = await res.json();
        if (!data.quotes || !Array.isArray(data.quotes)) return [];

        return data.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map((q: any) => {
                const symbol = q.symbol || '';
                const exchange = q.exchange || '';
                const isKR = symbol.endsWith('.KS') || symbol.endsWith('.KQ');
                const cleanSymbol = isKR ? symbol.replace(/\.(KS|KQ)$/, '') : symbol;

                return {
                    symbol: cleanSymbol,
                    name: q.shortname || q.longname || cleanSymbol,
                    market: isKR ? 'KR' : 'US',
                    flag: isKR ? '🇰🇷' : '🇺🇸',
                    exchange: exchange,
                } as StockResult;
            });
    } catch (e) {
        console.warn('Yahoo Finance search failed:', e);
        return [];
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!q || q.trim() === '') {
        return NextResponse.json([]);
    }

    const term = q.toLowerCase().replace(/\s/g, '');

    // 0. Gold Spot Special Handling
    const goldKeywords = ['금현물', '금', 'gold', '골드', 'krx금', '금시세', '4020000'];
    const goldResults: StockResult[] = [];
    if (goldKeywords.some(kw => term.includes(kw))) {
        goldResults.push({
            symbol: 'GOLD_4020000',
            name: '🪙 KRX 금현물 (1g)',
            market: 'GOLD',
            flag: '🪙',
            exchange: 'KRX 금현물',
        });
    }

    // 1. Supabase stock_master 테이블에서 검색
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let localResults: StockResult[] = [];

    try {
        // 종목명 또는 종목코드로 검색 (ilike = case-insensitive LIKE)
        const { data, error } = await supabase
            .from('stock_master')
            .select('symbol, name, market')
            .or(`name.ilike.%${q.trim()}%,symbol.ilike.%${q.trim()}%`)
            .limit(limit);

        if (!error && data) {
            localResults = data.map(stock => ({
                symbol: stock.symbol,
                name: stock.name,
                market: (stock.market === 'US' ? 'US' : 'KR') as 'KR' | 'US',
                flag: stock.market === 'US' ? '🇺🇸' : '🇰🇷',
            }));
        } else if (error) {
            console.warn('[Search] Supabase query failed:', error.message);
            // Supabase 실패 시 정적 파일 폴백은 제거 (DB 우선 정책)
        }
    } catch (e) {
        console.warn('[Search] Supabase exception:', e);
    }

    // 2. 해외 주식: Yahoo Finance에서 보충 검색
    let yahooResults: StockResult[] = [];
    const hasEnoughLocal = localResults.length >= 5;
    const isAlphabetic = /^[a-zA-Z]/.test(q.trim());

    if (!hasEnoughLocal || isAlphabetic) {
        yahooResults = await searchYahooFinance(q.trim());
    }

    // 3. 결과 병합: 금현물 → 국내(Supabase) → 해외(Yahoo) 순서
    const seen = new Set(localResults.map(r => r.symbol));
    const merged = [...goldResults, ...localResults];
    goldResults.forEach(g => seen.add(g.symbol));

    for (const yr of yahooResults) {
        if (!seen.has(yr.symbol)) {
            seen.add(yr.symbol);
            merged.push(yr);
        }
        if (merged.length >= limit) break;
    }

    return NextResponse.json(merged);
}
