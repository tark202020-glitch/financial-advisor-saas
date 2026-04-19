/**
 * KRX 정보데이터시스템 (data.krx.co.kr) 기반 ETF 데이터 수집 모듈
 * 
 * KIS API의 Rate Limit / 데이터 누락 문제를 해결하기 위해
 * KRX OTP 방식(2단계: OTP 발급 → CSV 다운로드)으로 ETF 전종목 데이터를 벌크 수집합니다.
 * 
 * - API 키 불필요
 * - Rate Limit 없음 (벌크 CSV)
 * - 전일 종가 기준 (1일 1회 갱신)
 * - 커버드콜/프리미엄 ETF 전수 포함
 */

// ============================================================================
// Types
// ============================================================================

export interface KrxEtfPrice {
    code: string;        // 종목코드 (6자리, 예: "069500")
    isinCode: string;    // ISIN 코드
    name: string;        // 종목명
    price: number;       // 종가 (현재가)
    change: number;      // 대비
    changeRate: number;   // 등락률
    open: number;        // 시가
    high: number;        // 고가
    low: number;         // 저가
    volume: number;      // 거래량
    tradingValue: number; // 거래대금
    marketCap: number;   // 시가총액
    nav: number;         // NAV
    baseIndex: string;   // 기초지수명
}

export interface KrxEtfDistribution {
    code: string;        // 종목코드 (6자리)
    isinCode: string;    // ISIN 코드
    name: string;        // 종목명
    recordDate: string;  // 분배금기준일 (YYYY/MM/DD)
    payDate: string;     // 지급일 (YYYY/MM/DD)
    cashDistribution: number; // 현금분배금 (원/좌)
}

export interface EtfDividendYieldResult {
    code: string;
    name: string;
    price: number;
    annualDividend: number;      // TTM 연간 분배금 합산
    latestDividend: number;      // 최근 1회 분배금
    payoutCount: number;         // 최근 12개월 지급 횟수
    yieldRate: number;           // 배당 수익률 (%)
    latestPayDate: string;       // 최근 지급일
    latestRecordDate: string;    // 최근 기준일
    marketCap: number;           // 시가총액
    nav: number;                 // NAV
    virtualDividend: number;     // 1천만원 투자 시 가상 배당금
}

// ============================================================================
// KRX API Core (JSON API 1차 → OTP/CSV 2차 폴백)
// ============================================================================

const KRX_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
};

// JSON API: OTP 없이 직접 JSON 응답 (Vercel 서버리스 환경에서 더 안정적)
const JSON_API_URL = 'https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';
// OTP/CSV 폴백용
const OTP_URL = 'https://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
const DOWNLOAD_URL = 'https://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';

/**
 * KRX JSON API: OTP 없이 직접 JSON 응답을 받습니다.
 * Vercel 서버리스 환경에서 OTP 2단계 방식보다 안정적입니다.
 */
async function krxFetchJson(params: Record<string, string>): Promise<Record<string, any>> {
    const bld = params.url || params.bld || 'unknown';
    console.log(`[KRX-JSON] API 호출 시작 (${bld})...`);

    const body = new URLSearchParams({
        ...params,
        bld: params.url || params.bld || '',  // JSON API는 'bld' 파라미터 사용
    });
    // JSON API에서는 'url' 파라미터 제거
    body.delete('url');

    const res = await fetch(JSON_API_URL, {
        method: 'POST',
        headers: {
            ...KRX_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
    });

    console.log(`[KRX-JSON] 응답 상태: ${res.status} (${bld})`);

    if (!res.ok) {
        const errorBody = await res.text().catch(() => '(body read failed)');
        throw new Error(`KRX JSON API 실패: ${res.status} ${res.statusText} | body: ${errorBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const outBlock = data.OutBlock_1 || data.output || data.block1 || [];
    console.log(`[KRX-JSON] 데이터 수신: ${Array.isArray(outBlock) ? outBlock.length : 'N/A'}건 (${bld})`);

    return data;
}

/**
 * KRX OTP 2단계 fetch: OTP 발급 → CSV 다운로드 → 텍스트 반환
 * JSON API 실패 시 폴백으로 사용합니다.
 */
async function krxFetchCsv(params: Record<string, string>): Promise<string> {
    const apiLabel = params.url || 'unknown';
    console.log(`[KRX-CSV] OTP 발급 시작 (${apiLabel})...`);

    // 1. OTP 발급 (15초 timeout)
    const otpRes = await fetch(OTP_URL, {
        method: 'POST',
        headers: {
            ...KRX_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            ...params,
            csvxls_isNo: 'false',
            name: 'fileDown',
        }).toString(),
        signal: AbortSignal.timeout(15000),
    });

    console.log(`[KRX-CSV] OTP 응답 상태: ${otpRes.status} (${apiLabel})`);

    if (!otpRes.ok) {
        const errorBody = await otpRes.text().catch(() => '(body read failed)');
        throw new Error(`KRX OTP 발급 실패: ${otpRes.status} ${otpRes.statusText} | body: ${errorBody.slice(0, 100)}`);
    }

    const otp = await otpRes.text();
    if (!otp || otp.length < 10) {
        throw new Error(`KRX OTP 응답 이상 (길이=${otp.length}): "${otp.slice(0, 100)}"`);
    }

    console.log(`[KRX-CSV] OTP 발급 성공 (길이=${otp.length}), CSV 다운로드 시작...`);

    // 2. CSV 다운로드 (15초 timeout)
    const dlRes = await fetch(DOWNLOAD_URL, {
        method: 'POST',
        headers: {
            ...KRX_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `code=${otp}`,
        signal: AbortSignal.timeout(15000),
    });

    console.log(`[KRX-CSV] CSV 다운로드 응답 상태: ${dlRes.status} (${apiLabel})`);

    if (!dlRes.ok) {
        throw new Error(`KRX CSV 다운로드 실패: ${dlRes.status} ${dlRes.statusText}`);
    }

    // EUC-KR 디코딩 (KRX는 EUC-KR 인코딩)
    const buf = await dlRes.arrayBuffer();
    const csvText = new TextDecoder('euc-kr').decode(buf);
    const lineCount = csvText.trim().split('\n').length;
    console.log(`[KRX-CSV] CSV 수신 완료: ${buf.byteLength} bytes, ${lineCount} lines (${apiLabel})`);

    return csvText;
}

/**
 * CSV 텍스트를 파싱하여 Record 배열로 변환합니다.
 * KRX CSV는 쌍따옴표로 감싸인 필드를 포함할 수 있으며, 숫자에 콤마가 있습니다.
 */
function parseCsv(csvText: string): Record<string, string>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCsvLine(line);
        if (cols.length !== headers.length) continue;

        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = cols[j];
        }
        rows.push(row);
    }

    return rows;
}

/**
 * CSV 한 줄을 파싱합니다. 쌍따옴표 내 콤마를 정확히 처리합니다.
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.replace(/"/g, '').trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.replace(/"/g, '').trim());

    return result;
}

/**
 * 숫자 문자열에서 콤마를 제거하고 숫자로 변환합니다.
 */
function parseNum(val: string | undefined): number {
    if (!val) return 0;
    const cleaned = val.replace(/,/g, '').replace(/"/g, '').trim();
    if (cleaned === '' || cleaned === '-') return 0;
    return parseFloat(cleaned) || 0;
}

/**
 * YYYYMMDD 형식의 날짜 문자열을 반환합니다.
 */
function formatDateKrx(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

// ============================================================================
// ETF 전종목 시세 (가격)
// ============================================================================

/**
 * KRX ETF 전종목 시세를 조회합니다.
 * @param date 조회 날짜 (YYYYMMDD). 기본값: 최근 영업일 추정
 */
export async function fetchKrxEtfPrices(date?: string): Promise<KrxEtfPrice[]> {
    // 날짜가 없으면 오늘(KST) 기준
    if (!date) {
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        date = formatDateKrx(kst);
    }

    console.log(`[KRX] ETF 전종목 시세 조회 (${date})...`);

    const params = {
        locale: 'ko_KR',
        mktId: 'ETF',
        trdDd: date,
        share: '1',
        money: '1',
        url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
    };

    // --- 1차: JSON API 시도 ---
    try {
        const data = await krxFetchJson(params);
        const items = data.OutBlock_1 || data.output || data.block1 || [];
        if (Array.isArray(items) && items.length > 0) {
            console.log(`[KRX-JSON] ETF 시세 ${items.length}개 종목 (JSON 성공)`);
            // JSON 응답 필드명 로깅 (최초 1회)
            if (items.length > 0) {
                console.log(`[KRX-JSON] 필드명: ${Object.keys(items[0]).join(', ')}`);
            }
            return items.map((item: any) => {
                // JSON 응답의 필드명은 영문 약어 또는 한글일 수 있음
                const rawCode = item.ISU_SRT_CD || item.ISU_CD || item['종목코드'] || '';
                const shortCode = rawCode.length === 12 ? rawCode.slice(3, 9) : rawCode.replace(/[^0-9]/g, '');
                return {
                    code: shortCode,
                    isinCode: item.ISU_CD || rawCode,
                    name: item.ISU_ABBRV || item.ISU_NM || item['종목명'] || '',
                    price: parseNum(item.TDD_CLSPRC || item.CLSPRC || item['종가'] || item['현재가']),
                    change: parseNum(item.CMPPREVDD_PRC || item['대비']),
                    changeRate: parseNum(item.FLUC_RT || item['등락률']),
                    open: parseNum(item.TDD_OPNPRC || item['시가']),
                    high: parseNum(item.TDD_HGPRC || item['고가']),
                    low: parseNum(item.TDD_LWPRC || item['저가']),
                    volume: parseNum(item.ACC_TRDVOL || item['거래량']),
                    tradingValue: parseNum(item.ACC_TRDVAL || item['거래대금']),
                    marketCap: parseNum(item.MKTCAP || item['시가총액']),
                    nav: parseNum(item.NAV || item['NAV']),
                    baseIndex: item.IDX_IND_NM || item['기초지수'] || '',
                };
            }).filter((item: KrxEtfPrice) => item.code && item.price > 0);
        }
        console.log(`[KRX-JSON] ETF 시세 JSON 빈 응답 → CSV 폴백`);
    } catch (e: any) {
        console.error(`[KRX-JSON] ETF 시세 JSON 실패: ${e.message} → CSV 폴백`);
    }

    // --- 2차: OTP/CSV 폴백 ---
    const csvText = await krxFetchCsv(params);

    const rows = parseCsv(csvText);
    console.log(`[KRX-CSV] ETF 시세 ${rows.length}개 종목 수신`);

    return rows.map(row => {
        const rawCode = row['종목코드'] || '';
        const shortCode = rawCode.length === 12 ? rawCode.slice(3, 9) : rawCode.replace(/[^0-9]/g, '');

        return {
            code: shortCode,
            isinCode: rawCode,
            name: row['종목명'] || '',
            price: parseNum(row['종가'] || row['현재가']),
            change: parseNum(row['대비']),
            changeRate: parseNum(row['등락률']),
            open: parseNum(row['시가']),
            high: parseNum(row['고가']),
            low: parseNum(row['저가']),
            volume: parseNum(row['거래량']),
            tradingValue: parseNum(row['거래대금']),
            marketCap: parseNum(row['시가총액']),
            nav: parseNum(row['NAV']),
            baseIndex: row['기초지수'] || row['기초지수명'] || '',
        };
    }).filter(item => item.code && item.price > 0);
}

// ============================================================================
// ETF 분배금 현황
// ============================================================================

/**
 * KRX ETF 분배금 현황을 조회합니다 (전종목, 기간 지정).
 * @param fromDate 시작일 (YYYYMMDD)
 * @param toDate 종료일 (YYYYMMDD)
 */
export async function fetchKrxEtfDistributions(fromDate: string, toDate: string): Promise<KrxEtfDistribution[]> {
    console.log(`[KRX] ETF 분배금 현황 조회 (${fromDate} ~ ${toDate})...`);

    const params = {
        locale: 'ko_KR',
        searchType: '1',       // 기간 검색
        mktId: 'ETF',
        isuCd: 'ALL',          // 전종목
        strtDd: fromDate,
        endDd: toDate,
        url: 'dbms/MDC/STAT/standard/MDCSTAT04802',
    };

    // --- 1차: JSON API 시도 ---
    try {
        const data = await krxFetchJson(params);
        const items = data.OutBlock_1 || data.output || data.block1 || [];
        if (Array.isArray(items) && items.length > 0) {
            console.log(`[KRX-JSON] 분배금 ${items.length}건 (JSON 성공)`);
            if (items.length > 0) {
                console.log(`[KRX-JSON] 분배금 필드명: ${Object.keys(items[0]).join(', ')}`);
            }
            return items.map((item: any) => {
                const rawCode = item.ISU_SRT_CD || item.ISU_CD || item['종목코드'] || '';
                const shortCode = rawCode.length === 12 ? rawCode.slice(3, 9) : rawCode.replace(/[^0-9]/g, '');
                return {
                    code: shortCode,
                    isinCode: item.ISU_CD || rawCode,
                    name: item.ISU_ABBRV || item.ISU_NM || item['종목명'] || '',
                    recordDate: item.RECORD_DATE || item.STD_DT || item['분배금기준일'] || item['기준일'] || '',
                    payDate: item.PAY_DATE || item.PAY_DT || item['지급일'] || item['실제지급일'] || '',
                    cashDistribution: parseNum(item.CASH_DISTR || item.CASH_DIST_AMT || item['현금분배금'] || item['분배금'] || item['현금분배금(원/좌)']),
                };
            }).filter((item: KrxEtfDistribution) => item.code && item.cashDistribution > 0);
        }
        console.log(`[KRX-JSON] 분배금 JSON 빈 응답 → CSV 폴백`);
    } catch (e: any) {
        console.error(`[KRX-JSON] 분배금 JSON 실패: ${e.message} → CSV 폴백`);
    }

    // --- 2차: OTP/CSV 폴백 ---
    const csvText = await krxFetchCsv(params);

    const rows = parseCsv(csvText);
    console.log(`[KRX-CSV] 분배금 ${rows.length}건 수신`);

    return rows.map(row => {
        const rawCode = row['종목코드'] || '';
        const shortCode = rawCode.length === 12 ? rawCode.slice(3, 9) : rawCode.replace(/[^0-9]/g, '');

        return {
            code: shortCode,
            isinCode: rawCode,
            name: row['종목명'] || '',
            recordDate: row['분배금기준일'] || row['기준일'] || '',
            payDate: row['지급일'] || row['실제지급일'] || '',
            cashDistribution: parseNum(row['현금분배금'] || row['분배금'] || row['현금분배금(원/좌)']),
        };
    }).filter(item => item.code && item.cashDistribution > 0);
}

// ============================================================================
// 네이버 금융 ETF 가격 폴백
// ============================================================================

export interface NaverEtfPrice {
    code: string;
    name: string;
    price: number;
    changeRate: number;
    marketCap: number;
    nav: number;
}

/**
 * 네이버 금융 ETF 전종목 리스트를 가져옵니다.
 * KRX 서버 장애 시 폴백으로 사용합니다.
 * 분배금 정보는 포함되지 않으므로 가격 폴백으로만 활용합니다.
 */
export async function fetchNaverEtfPrices(): Promise<NaverEtfPrice[]> {
    console.log(`[Naver] ETF 전종목 가격 폴백 조회...`);

    try {
        const res = await fetch('https://finance.naver.com/api/sise/etfItemList.nhn', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            throw new Error(`Naver API HTTP ${res.status}`);
        }

        const data = await res.json();
        const items = data?.result?.etfItemList || [];

        console.log(`[Naver] ETF ${items.length}개 종목 수신`);

        return items.map((item: any) => ({
            code: (item.itemcode || '').toString(),
            name: item.itemname || '',
            price: parseFloat(item.nowVal) || 0,
            changeRate: parseFloat(item.changeRate) || 0,
            marketCap: parseFloat(item.marketSum) || 0,
            nav: parseFloat(item.nav) || 0,
        })).filter((item: NaverEtfPrice) => item.code && item.price > 0);
    } catch (e: any) {
        console.error('[Naver] ETF 가격 조회 실패:', e.message);
        return [];
    }
}

// ============================================================================
// 통합 배당수익률 산출
// ============================================================================

/**
 * 배당이 거의 없는 파생/상품 ETF 키워드 — 수익률 랭킹에서 제외할 종목
 */
const JUNK_KEYWORDS = [
    '레버리지', '인버스', '선물', 'VIX', '2X', '블룸버그',
    '원유', '천연가스', '금선물', '은선물', '구리', '농산물', '콩',
    '달러', '엔선물', '유로',
];

/**
 * KRX 데이터를 결합하여 ETF 배당 수익률 TOP N을 산출합니다.
 * 
 * 1. KRX ETF 전종목 시세 1회 호출 → 가격 + 시가총액
 * 2. KRX ETF 분배금 현황 1회 호출 → 최근 12개월 분배금 이력
 * 3. 인메모리 조인 → TTM 수익률 계산 → TOP N 추출
 * 
 * @param options.topLimit 상위 N개 추출 (기본 10)
 * @param options.includeKeywords 종목명에 포함해야 할 키워드 (비어있으면 전체)
 * @param options.excludeKeywords 종목명에서 제외할 키워드
 */
export async function getKrxEtfDividendYield(options: {
    topLimit?: number;
    includeKeywords?: string[];
    excludeKeywords?: string[];
} = {}): Promise<{
    results: EtfDividendYieldResult[];
    totalEtfs: number;
    dividendMatched: number;
    dataSource: 'KRX' | 'NAVER_FALLBACK';
}> {
    const { topLimit = 10, includeKeywords = [], excludeKeywords = [] } = options;

    // ---- 날짜 계산 ----
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = formatDateKrx(kst);

    const oneYearAgo = new Date(kst);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDateStr = formatDateKrx(oneYearAgo);

    // ---- 1. ETF 전종목 가격 조회 ----
    let priceMap = new Map<string, KrxEtfPrice>();
    let dataSource: 'KRX' | 'NAVER_FALLBACK' = 'KRX';

    try {
        const prices = await fetchKrxEtfPrices(todayStr);
        
        // KRX가 빈 결과 → 비영업일(주말/휴일)일 수 있으므로 전일 시도
        if (prices.length === 0) {
            console.log(`[KRX] ${todayStr} 시세 없음 → 전일 시도...`);
            const yesterday = new Date(kst);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = formatDateKrx(yesterday);
            
            const retryPrices = await fetchKrxEtfPrices(yesterdayStr);
            if (retryPrices.length === 0) {
                // 이틀 전도 시도
                const twoDaysAgo = new Date(kst);
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const twoDaysAgoStr = formatDateKrx(twoDaysAgo);
                
                const retry2 = await fetchKrxEtfPrices(twoDaysAgoStr);
                if (retry2.length === 0) {
                    // 3일 전도 시도 (금요일 → 월요일 대비)
                    const threeDaysAgo = new Date(kst);
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    const threeDaysAgoStr = formatDateKrx(threeDaysAgo);
                    
                    const retry3 = await fetchKrxEtfPrices(threeDaysAgoStr);
                    retry3.forEach(p => priceMap.set(p.code, p));
                } else {
                    retry2.forEach(p => priceMap.set(p.code, p));
                }
            } else {
                retryPrices.forEach(p => priceMap.set(p.code, p));
            }
        } else {
            prices.forEach(p => priceMap.set(p.code, p));
        }
    } catch (e: any) {
        console.error('[KRX] ETF 시세 조회 실패:', e.message);
    }

    // KRX 실패 시 네이버 금융 폴백
    if (priceMap.size === 0) {
        console.log('[KRX] 전종목 시세 실패 → 네이버 금융 폴백 사용');
        dataSource = 'NAVER_FALLBACK';
        try {
            const naverPrices = await fetchNaverEtfPrices();
            naverPrices.forEach(np => {
                priceMap.set(np.code, {
                    code: np.code,
                    isinCode: '',
                    name: np.name,
                    price: np.price,
                    change: 0,
                    changeRate: np.changeRate,
                    open: 0,
                    high: 0,
                    low: 0,
                    volume: 0,
                    tradingValue: 0,
                    marketCap: np.marketCap,
                    nav: np.nav,
                    baseIndex: '',
                });
            });
        } catch (e: any) {
            console.error('[Naver] ETF 가격 폴백도 실패:', e.message);
        }
    }

    console.log(`[배당ETF] 가격 데이터: ${priceMap.size}개 ETF (소스: ${dataSource})`);

    // ---- 2. ETF 분배금 현황 조회 ----
    let distributions: KrxEtfDistribution[] = [];
    try {
        distributions = await fetchKrxEtfDistributions(fromDateStr, todayStr);
    } catch (e: any) {
        console.error('[KRX] 분배금 조회 실패:', e.message);
    }

    // 종목코드별 분배금 그룹핑
    const distMap = new Map<string, KrxEtfDistribution[]>();
    for (const d of distributions) {
        if (!distMap.has(d.code)) distMap.set(d.code, []);
        distMap.get(d.code)!.push(d);
    }

    console.log(`[배당ETF] 분배금 이력: ${distributions.length}건 (${distMap.size}개 종목)`);

    // ---- 3. 배당수익률 계산 ----
    const results: EtfDividendYieldResult[] = [];

    for (const [code, dists] of distMap) {
        const priceInfo = priceMap.get(code);
        if (!priceInfo || priceInfo.price <= 0) continue;

        const nameUpper = priceInfo.name.toUpperCase();

        // 파생상품 제외
        if (JUNK_KEYWORDS.some(kw => nameUpper.includes(kw))) continue;

        // 포함 키워드 필터
        if (includeKeywords.length > 0) {
            const hasInclude = includeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
            if (!hasInclude) continue;
        }

        // 제외 키워드 필터
        if (excludeKeywords.length > 0) {
            const hasExclude = excludeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
            if (hasExclude) continue;
        }

        // 분배일 기준 내림차순 정렬
        const sortedDists = [...dists].sort((a, b) =>
            (b.recordDate || '').localeCompare(a.recordDate || '')
        );

        // TTM 연간 분배금 합산
        const totalAnnualDiv = sortedDists.reduce((sum, d) => sum + d.cashDistribution, 0);
        const latest = sortedDists[0];
        const payoutCount = sortedDists.length;

        // 연환산(Annualized) 보정: 상장된 지 1년이 안 된 ETF의 경우
        let annualDiv = totalAnnualDiv;
        if (payoutCount > 0 && payoutCount < 12) {
            // 월배당 ETF 추정: 이름에 '월배당', '프리미엄', '커버드' 키워드
            const isMonthly = nameUpper.includes('월배당') || nameUpper.includes('프리미엄') ||
                nameUpper.includes('커버드') || nameUpper.includes('COVERED') || nameUpper.includes('PREMIUM');

            if (isMonthly) {
                const avgPayout = totalAnnualDiv / payoutCount;
                annualDiv = avgPayout * 12;
            } else if (payoutCount <= 4) {
                // 분기배당 (4회 미만이면 분기로 추정하여 보정)
                const avgPayout = totalAnnualDiv / payoutCount;
                const expectedPayouts = payoutCount <= 2 ? 4 : Math.ceil(12 / Math.floor(12 / payoutCount));
                if (payoutCount < expectedPayouts) {
                    annualDiv = avgPayout * expectedPayouts;
                }
            }
        }

        const yieldRate = (annualDiv / priceInfo.price) * 100;
        const shares = Math.floor(10000000 / priceInfo.price);
        const virtualDividend = shares * annualDiv;

        results.push({
            code,
            name: priceInfo.name,
            price: priceInfo.price,
            annualDividend: annualDiv,
            latestDividend: latest.cashDistribution,
            payoutCount,
            yieldRate,
            latestPayDate: latest.payDate || '',
            latestRecordDate: latest.recordDate || '',
            marketCap: priceInfo.marketCap,
            nav: priceInfo.nav,
            virtualDividend,
        });
    }

    // 수익률 내림차순 정렬 → TOP N 추출
    results.sort((a, b) => b.yieldRate - a.yieldRate);
    const topResults = results.slice(0, topLimit);

    console.log(`[배당ETF] 최종: 분배금 확인 ${results.length}개 → TOP ${topResults.length}개 추출`);

    return {
        results: topResults,
        totalEtfs: priceMap.size,
        dividendMatched: results.length,
        dataSource,
    };
}
