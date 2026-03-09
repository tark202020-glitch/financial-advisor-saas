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

    console.log(`\n▶ [API 호출] ${market} 시장 가격 조회 요청 수신 - ${symbols.length} 종목`);
    console.log(`  [종목 목록] ${symbols.join(', ')}`);

    const results: Record<string, any> = {};
    const fetcher = market === 'KR' ? getDomesticPrice : getOverseasPrice;

    // KR: 3개씩 병렬 + 500ms 딜레이 / US: 1개씩 순차 + 350ms 딜레이
    const CHUNK_SIZE = market === 'KR' ? 3 : 1;
    const CHUNK_DELAY = market === 'KR' ? 500 : 350;

    // Helper: 단일 종목 처리
    const fetchOne = async (symbol: string) => {
        try {
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
    };

    // 1차: 청크별 순차 처리
    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        const chunk = symbols.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(fetchOne));

        // 청크 간 딜레이 (마지막 청크 제외)
        if (i + CHUNK_SIZE < symbols.length) {
            await new Promise(r => setTimeout(r, CHUNK_DELAY));
        }
    }

    // 2차: 실패한 종목 자동 재시도 (1건씩 느리게)
    const failedSymbols = symbols.filter(s => results[s] === null);
    if (failedSymbols.length > 0) {
        console.log(`  [재시도] ${failedSymbols.length}개 실패 종목 재시도: ${failedSymbols.join(', ')}`);
        await new Promise(r => setTimeout(r, 1500)); // 재시도 전 1.5초 대기

        for (const symbol of failedSymbols) {
            await fetchOne(symbol);
            await new Promise(r => setTimeout(r, 500)); // 개별 500ms 대기
        }
    }

    // 결과 로그
    let successCount = 0;
    let failCount = 0;
    symbols.forEach(s => {
        if (results[s]) successCount++;
        else failCount++;
    });

    if (failCount === 0) {
        console.log(`  [완료] ✅ ${market} 시장 ${successCount}종목 데이터 조회 성공`);
    } else {
        console.log(`  [완료] ⚠️ ${market} 시장 전체 ${symbols.length}종목 중 ${successCount} 성공, ${failCount} 실패`);
    }

    return NextResponse.json(results);
}
