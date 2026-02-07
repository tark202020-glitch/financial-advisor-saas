import { NextRequest, NextResponse } from 'next/server';
import { getDomesticPrice, getOverseasPrice } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const market = searchParams.get('market'); // 'KR' or 'US'

    if (!symbolsParam || !market) {
        return NextResponse.json({ error: 'Missing symbols or market' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

    if (symbols.length === 0) {
        return NextResponse.json({});
    }

    // Rate Limiting / Concurrency Control
    // We process in chunks of 5 parallel requests to avoid being blocked by KIS
    const CHUNK_SIZE = 5;
    const results: Record<string, any> = {};

    // Helper to process a chunk
    const processChunk = async (chunk: string[]) => {
        const promises = chunk.map(async (symbol) => {
            try {
                // Determine which fetcher to use
                const fetcher = market === 'KR' ? getDomesticPrice : getOverseasPrice;
                const data = await fetcher(symbol);

                if (data) {
                    results[symbol] = data;
                } else {
                    results[symbol] = null;
                }
            } catch (e) {
                console.error(`Error fetching ${symbol}:`, e);
                results[symbol] = null;
            }
        });
        await Promise.all(promises);
    };

    // Execute chunks sequentially
    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        const chunk = symbols.slice(i, i + CHUNK_SIZE);
        await processChunk(chunk);

        // Slight delay between chunks to be nice to API
        if (i + CHUNK_SIZE < symbols.length) {
            await new Promise(r => setTimeout(r, 200)); // 200ms delay
        }
    }

    return NextResponse.json(results);
}
