import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface StockResult {
    symbol: string;
    name: string;
    market: 'KR' | 'US' | 'GOLD';
    flag: string;
    exchange?: string;
}

interface StockMasterLocal {
    symbol: string;
    name: string;
    standard_code?: string;
    group_code?: string;
    market?: string;
}

// ---- Local Master Data Cache ----
let cachedLocalData: StockMasterLocal[] | null = null;
let lastCacheTime = 0;

function loadLocalMasterData(): StockMasterLocal[] {
    const CACHE_TTL = 3600 * 1000; // 1 hour
    const now = Date.now();

    if (cachedLocalData && (now - lastCacheTime < CACHE_TTL)) {
        return cachedLocalData;
    }

    try {
        // Try unified file first, then fallback to kospi only
        const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
        const kospiPath = path.join(process.cwd(), 'public', 'data', 'kospi_master.json');

        let rawData = '';
        if (fs.existsSync(unifiedPath)) {
            rawData = fs.readFileSync(unifiedPath, 'utf-8');
        } else if (fs.existsSync(kospiPath)) {
            rawData = fs.readFileSync(kospiPath, 'utf-8');
        } else {
            return [];
        }

        cachedLocalData = JSON.parse(rawData);
        lastCacheTime = now;
        return cachedLocalData || [];
    } catch (e) {
        console.error('Failed to load local master data:', e);
        return [];
    }
}

// ---- Yahoo Finance Server-Side Search ----
async function searchYahooFinance(query: string): Promise<StockResult[]> {
    try {
        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(3000), // 3 second timeout
        });

        if (!res.ok) return [];

        const data = await res.json();
        if (!data.quotes || !Array.isArray(data.quotes)) return [];

        return data.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map((q: any) => {
                const symbol = q.symbol || '';
                // Determine market
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
        // Silent failure - Yahoo may be rate limited or unreachable
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

    // 1. Search local master data (KOSPI, and KOSDAQ/overseas if all_stocks_master.json is available)
    const localData = loadLocalMasterData();
    const localResults: StockResult[] = [];

    for (const stock of localData) {
        const stockName = (stock.name || '').toLowerCase().replace(/\s/g, '');
        const stockSymbol = (stock.symbol || '').toLowerCase();

        if (stockName.includes(term) || stockSymbol.includes(term)) {
            const mkt = (stock.market === 'US') ? 'US' : 'KR';
            localResults.push({
                symbol: stock.symbol,
                name: stock.name,
                market: mkt as 'KR' | 'US',
                flag: mkt === 'US' ? '🇺🇸' : '🇰🇷',
            });
            if (localResults.length >= limit) break;
        }
    }

    // 2. If local results are limited (especially for overseas), fetch from Yahoo Finance
    let yahooResults: StockResult[] = [];
    const hasEnoughLocal = localResults.length >= 5;
    const isAlphabetic = /^[a-zA-Z]/.test(q.trim());

    // Search Yahoo if: not enough local results, or query looks English (likely overseas ticker)
    if (!hasEnoughLocal || isAlphabetic) {
        yahooResults = await searchYahooFinance(q.trim());
    }

    // 3. Merge results: gold first, then local, then Yahoo (avoiding duplicates)
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
