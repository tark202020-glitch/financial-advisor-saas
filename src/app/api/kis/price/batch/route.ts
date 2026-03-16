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

    // KR: 2건씩 병렬 + 700ms 딜레이 (토큰 발급 한도 보호 — NXT 이중 호출 제거로 절반 감소)
    // US: 1건씩 순차 + 400ms 딜레이 (해외 API는 보수적으로 처리)
    const parallelSize = market === 'KR' ? 2 : 1;
    const delayMs = market === 'KR' ? 700 : 400;

    for (let i = 0; i < symbols.length; i += parallelSize) {
        const group = symbols.slice(i, i + parallelSize);

        const groupResults = await Promise.all(
            group.map(async (symbol) => {
                try {
                    const data = await fetcher(symbol);
                    return { symbol, data: data || null };
                } catch (e) {
                    console.error(`  [실패] ${symbol}:`, e instanceof Error ? e.message : e);
                    return { symbol, data: null };
                }
            })
        );

        groupResults.forEach(({ symbol, data }) => {
            results[symbol] = data;
        });

        // 다음 그룹 전 딜레이 (마지막 그룹 제외)
        if (i + parallelSize < symbols.length) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    // 2차: 실패 종목 재시도 (1초 대기 후 1건씩 500ms 간격)
    const failedSymbols = symbols.filter(s => results[s] === null);
    if (failedSymbols.length > 0) {
        console.log(`  [재시도] ${failedSymbols.length}개 실패 종목 재시도: ${failedSymbols.join(', ')}`);
        await new Promise(r => setTimeout(r, 1000));

        for (const symbol of failedSymbols) {
            try {
                const data = await fetcher(symbol);
                results[symbol] = data || null;
            } catch (e) {
                console.error(`  [재시도 실패] ${symbol}:`, e instanceof Error ? e.message : e);
                results[symbol] = null;
            }
            await new Promise(r => setTimeout(r, 500));
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
