/**
 * OpenDART API 직접 호출 유틸리티
 * 
 * corpCode.xml에서 추출한 stock_code→corp_code 매핑 파일을 사용하여
 * OpenDART API를 직접 호출합니다.
 * API 문서: https://opendart.fss.or.kr/guide/main.do
 */

import corpCodeMap from '@/data/dart-corp-codes.json';

const DART_API_KEY = process.env.DART_API_KEY;
const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

/**
 * 종목코드(stock_code) → corp_code 변환
 * JSON 매핑 파일에서 즉시 조회 (API 호출 없음)
 */
export function getCorpCode(stockCode: string): string | null {
    // .KS, .KQ 등 suffix 제거
    let clean = stockCode;
    if (clean.includes('.')) clean = clean.split('.')[0];

    return (corpCodeMap as Record<string, string>)[clean] || null;
}

/**
 * 재무제표 데이터 조회 (단일회사 주요계정)
 */
export async function fetchFinancials(stockCode: string, year?: number): Promise<{
    year: number;
    revenue: number | null;
    operatingProfit: number | null;
    netIncome: number | null;
    equity: number | null;
    revenue_prev: number | null;
    operatingProfit_prev: number | null;
    netIncome_prev: number | null;
} | null> {
    if (!DART_API_KEY) {
        console.warn('[DART] API key not set');
        return null;
    }

    const corpCode = getCorpCode(stockCode);
    if (!corpCode) {
        console.warn(`[DART] No corp_code found for stock_code: ${stockCode}`);
        return null;
    }

    const targetYear = year || new Date().getFullYear() - 1;

    try {
        // 단일회사 주요계정 조회 (연간 사업보고서)
        const url = `${DART_BASE_URL}/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${targetYear}&reprt_code=11011`;
        console.log(`[DART] Fetching financials: corp_code=${corpCode}, year=${targetYear}`);

        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== '000' || !data.list) {
            console.warn(`[DART] No data for ${corpCode}/${targetYear}: status=${data.status}, msg=${data.message}`);
            // 이전 연도 시도
            const prevUrl = `${DART_BASE_URL}/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${targetYear - 1}&reprt_code=11011`;
            const prevRes = await fetch(prevUrl);
            const prevData = await prevRes.json();

            if (prevData.status !== '000' || !prevData.list) {
                return null;
            }

            return processFinancialData(prevData.list, targetYear - 1);
        }

        return processFinancialData(data.list, targetYear);
    } catch (e) {
        console.warn(`[DART] Financials fetch failed for ${stockCode}:`, e);
        return null;
    }
}

function processFinancialData(list: any[], year: number) {
    const parseAmount = (amountStr: string | undefined): number | null => {
        if (!amountStr || amountStr === '' || amountStr === '-') return null;
        return parseInt(amountStr.replace(/,/g, ''), 10) || null;
    };

    // CFS(연결) 우선, 없으면 OFS(별도)
    const findValue = (keyword: string, fsDivPriority: string[] = ['CFS', 'OFS']): { current: number | null, prev: number | null } => {
        for (const fsDiv of fsDivPriority) {
            const item = list.find((i: any) =>
                i.fs_div === fsDiv &&
                i.account_nm?.includes(keyword)
            );
            if (item) {
                return {
                    current: parseAmount(item.thstrm_amount),
                    prev: parseAmount(item.frmtrm_amount),
                };
            }
        }
        return { current: null, prev: null };
    };

    let revenue = findValue('매출액');
    if (!revenue.current) {
        // 일부 기업: '수익(매출액)' 또는 '영업수익'
        const altRevenue = findValue('수익');
        if (altRevenue.current) {
            revenue = altRevenue;
        }
    }

    const opProfit = findValue('영업이익');
    const netIncome = findValue('당기순이익');
    const equity = findValue('자본총계');

    return {
        year,
        revenue: revenue.current,
        operatingProfit: opProfit.current,
        netIncome: netIncome.current,
        equity: equity.current,
        revenue_prev: revenue.prev,
        operatingProfit_prev: opProfit.prev,
        netIncome_prev: netIncome.prev,
    };
}

/**
 * 다년도 재무 데이터 조회
 */
export async function fetchMultiYearFinancials(stockCode: string, years: number = 3): Promise<Array<{
    year: number;
    revenue_억: number | null;
    operating_profit_억: number | null;
    net_income_억: number | null;
    equity_억: number | null;
}>> {
    const result = [];
    const currentYear = new Date().getFullYear();

    for (let i = 1; i <= years; i++) {
        const targetYear = currentYear - i;
        const data = await fetchFinancials(stockCode, targetYear);
        if (data) {
            result.push({
                year: data.year,
                revenue_억: data.revenue ? Math.round(data.revenue / 100000000) : null,
                operating_profit_억: data.operatingProfit ? Math.round(data.operatingProfit / 100000000) : null,
                net_income_억: data.netIncome ? Math.round(data.netIncome / 100000000) : null,
                equity_억: data.equity ? Math.round(data.equity / 100000000) : null,
            });
        }
    }

    return result;
}

/**
 * 배당 정보 조회
 */
export async function fetchDividends(stockCode: string, year?: number): Promise<{
    year: number;
    dps: number | null;
    payoutRatio: number | null;
} | null> {
    if (!DART_API_KEY) return null;

    const corpCode = getCorpCode(stockCode);
    if (!corpCode) return null;

    const targetYear = year || new Date().getFullYear() - 1;

    try {
        const url = `${DART_BASE_URL}/alotMatter.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${targetYear}&reprt_code=11011`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== '000' || !data.list) return null;

        // 주당배당금 (보통주)
        const dpsItem = data.list.find((d: any) =>
            d.se?.includes('주당') && d.stock_knd?.includes('보통주')
        );
        const dps = dpsItem ? parseInt(dpsItem.thstrm?.replace(/,/g, '') || '0') : null;

        // 배당성향
        const payoutItem = data.list.find((d: any) =>
            d.se?.includes('배당성향')
        );
        const payoutRatio = payoutItem ? parseFloat(payoutItem.thstrm?.replace(/,/g, '') || '0') : null;

        return { year: targetYear, dps, payoutRatio };
    } catch (e) {
        console.warn(`[DART] Dividends fetch failed for ${stockCode}:`, e);
        return null;
    }
}

/**
 * 종합 재무 요약 (포트폴리오 분석용)
 */
export async function fetchCompanySummary(stockCode: string): Promise<{
    baseYear: number;
    revenue: number | null;
    revenueGrowth: string | null;
    operatingProfit: number | null;
    profitGrowth: string | null;
    netIncome: number | null;
    roe: string | null;
    dps: number | null;
} | null> {
    const fin = await fetchFinancials(stockCode);
    if (!fin) return null;

    const revenueGrowth = fin.revenue && fin.revenue_prev && fin.revenue_prev !== 0
        ? (((fin.revenue - fin.revenue_prev) / Math.abs(fin.revenue_prev)) * 100).toFixed(1) : null;

    const profitGrowth = fin.operatingProfit && fin.operatingProfit_prev && fin.operatingProfit_prev !== 0
        ? (((fin.operatingProfit - fin.operatingProfit_prev) / Math.abs(fin.operatingProfit_prev)) * 100).toFixed(1) : null;

    const roe = fin.netIncome && fin.equity ? ((fin.netIncome / fin.equity) * 100).toFixed(1) : null;

    const div = await fetchDividends(stockCode);

    return {
        baseYear: fin.year,
        revenue: fin.revenue ? Math.round(fin.revenue / 100000000) : null,
        revenueGrowth,
        operatingProfit: fin.operatingProfit ? Math.round(fin.operatingProfit / 100000000) : null,
        profitGrowth,
        netIncome: fin.netIncome ? Math.round(fin.netIncome / 100000000) : null,
        roe,
        dps: div?.dps || null,
    };
}
