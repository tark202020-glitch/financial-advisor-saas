/**
 * 서버 사이드 배치 현재가 조회 유틸리티
 * 
 * 프론트엔드의 useBatchStockPrice 훅과 동일한 로직을
 * 서버(API Route / Cron)에서 사용할 수 있도록 추출한 모듈입니다.
 * 
 * KIS API 초당 호출 제한을 회피하기 위해:
 * - KR: 2건씩 병렬 + 700ms 딜레이
 * - US: 1건씩 순차 + 500ms 딜레이
 * - 실패 시 1초 후 1건씩 재시도
 */

import { getDomesticPrice, getOverseasPrice } from '@/lib/kis/client';

export interface ServerStockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  sector?: string;
}

/**
 * 서버 사이드에서 여러 종목의 현재가를 배치 조회합니다.
 * KIS API 초당 호출 제한을 회피하는 순차/딜레이 로직 내장.
 * 
 * @param symbols 종목 심볼 배열
 * @param market 'KR' | 'US'
 * @returns symbol → ServerStockPrice 맵
 */
export async function fetchBatchPrices(
  symbols: string[],
  market: 'KR' | 'US'
): Promise<Record<string, ServerStockPrice>> {
  if (symbols.length === 0) return {};

  const results: Record<string, ServerStockPrice> = {};
  const fetcher = market === 'KR' ? getDomesticPrice : getOverseasPrice;

  // KR: 2건씩 병렬 + 700ms 딜레이 (프론트 batch API와 동일)
  // US: 1건씩 순차 + 500ms 딜레이
  const parallelSize = market === 'KR' ? 2 : 1;
  const delayMs = market === 'KR' ? 700 : 500;

  console.log(`[BatchPrice] ${market} ${symbols.length}개 종목 현재가 조회 시작`);

  // 1차: 순차 배치 조회
  const failedSymbols: string[] = [];

  for (let i = 0; i < symbols.length; i += parallelSize) {
    const group = symbols.slice(i, i + parallelSize);

    const groupResults = await Promise.all(
      group.map(async (symbol) => {
        try {
          const data = await fetcher(symbol);
          return { symbol, data };
        } catch (e: any) {
          console.warn(`[BatchPrice] ${symbol} 조회 실패:`, e.message?.slice(0, 100));
          return { symbol, data: null };
        }
      })
    );

    for (const { symbol, data } of groupResults) {
      if (!data) {
        failedSymbols.push(symbol);
        continue;
      }

      let price = 0, diff = 0, rate = 0;
      let sector: string | undefined;

      if (market === 'KR') {
        price = parseFloat((data as any).stck_prpr || '0');
        diff = parseFloat((data as any).prdy_vrss || '0');
        rate = parseFloat((data as any).prdy_ctrt || '0');
        sector = (data as any).bstp_kor_isnm;
      } else {
        price = parseFloat(((data as any).last || '0').replace(/,/g, ''));
        diff = parseFloat(((data as any).diff || '0').replace(/,/g, ''));
        rate = parseFloat(((data as any).rate || '0').replace(/,/g, ''));
      }

      if (price > 0) {
        const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
        results[symbol] = { symbol, price, change, changePercent: rate, sector };
      } else {
        failedSymbols.push(symbol);
      }
    }

    // 다음 그룹 전 딜레이 (마지막 그룹 제외)
    if (i + parallelSize < symbols.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // 2차: 실패 종목 재시도 (1초 대기 후 1건씩 500ms 간격)
  if (failedSymbols.length > 0) {
    console.log(`[BatchPrice] ${failedSymbols.length}개 실패 종목 재시도: ${failedSymbols.join(', ')}`);
    await new Promise(r => setTimeout(r, 1000));

    for (const symbol of failedSymbols) {
      try {
        const data = await fetcher(symbol);
        if (!data) continue;

        let price = 0, diff = 0, rate = 0;
        let sector: string | undefined;

        if (market === 'KR') {
          price = parseFloat((data as any).stck_prpr || '0');
          diff = parseFloat((data as any).prdy_vrss || '0');
          rate = parseFloat((data as any).prdy_ctrt || '0');
          sector = (data as any).bstp_kor_isnm;
        } else {
          price = parseFloat(((data as any).last || '0').replace(/,/g, ''));
          diff = parseFloat(((data as any).diff || '0').replace(/,/g, ''));
          rate = parseFloat(((data as any).rate || '0').replace(/,/g, ''));
        }

        if (price > 0) {
          const change = rate < 0 ? -Math.abs(diff) : Math.abs(diff);
          results[symbol] = { symbol, price, change, changePercent: rate, sector };
        }
      } catch (e) {
        console.warn(`[BatchPrice] 재시도 실패: ${symbol}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const successCount = Object.keys(results).length;
  const failCount = symbols.length - successCount;
  console.log(`[BatchPrice] ${market} 완료: ${successCount}/${symbols.length} 성공${failCount > 0 ? `, ${failCount} 실패` : ''}`);

  return results;
}
