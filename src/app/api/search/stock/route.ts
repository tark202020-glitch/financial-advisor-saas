import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface StockMaster {
    symbol: string;
    name: string;
    standard_code?: string;
    group_code?: string;
    market?: 'KR' | 'US';
    exchange?: string;
}

let cachedMasterData: StockMaster[] | null = null;
let lastCacheTime = 0;

function loadMasterData() {
    // Reload cache if it's older than 1 hour or null
    const CACHE_TTL = 3600 * 1000;
    const now = Date.now();

    if (cachedMasterData && (now - lastCacheTime < CACHE_TTL)) {
        return cachedMasterData;
    }

    try {
        const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
        const fallbackKospiPath = path.join(process.cwd(), 'public', 'data', 'kospi_master.json');

        let rawData = '';
        if (fs.existsSync(unifiedPath)) {
            rawData = fs.readFileSync(unifiedPath, 'utf-8');
        } else if (fs.existsSync(fallbackKospiPath)) {
            // Un-updated setup fallback
            rawData = fs.readFileSync(fallbackKospiPath, 'utf-8');
        } else {
            console.warn("No stock master data found!");
            return [];
        }

        const data = JSON.parse(rawData);
        cachedMasterData = data;
        lastCacheTime = now;
        return cachedMasterData;

    } catch (e) {
        console.error("Failed to load / parse stock master data:", e);
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

    const term = q.toLowerCase().replace(/\s/g, ''); // ignore spaces

    const masterData = loadMasterData();
    if (!masterData || masterData.length === 0) {
        return NextResponse.json({ error: "Master data not available" }, { status: 500 });
    }

    const results = [];

    for (const stock of masterData) {
        // Simple search matching string logic
        const stockName = stock.name.toLowerCase().replace(/\s/g, '');
        const stockSymbol = stock.symbol.toLowerCase();

        if (stockName.includes(term) || stockSymbol.includes(term)) {
            // Ensure default market is KR if not set in old files
            const isKR = !stock.market || stock.market === 'KR';
            results.push({
                ...stock,
                market: stock.market || 'KR',
                flag: isKR ? '🇰🇷' : '🇺🇸'
            });

            if (results.length >= limit) {
                break;
            }
        }
    }

    return NextResponse.json(results);
}
