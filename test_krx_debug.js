/**
 * KRX 데이터 소스 디버깅 스크립트
 * KRX OTP 방식 및 네이버 금융 API를 직접 테스트합니다.
 */

const OTP_URL = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
const DOWNLOAD_URL = 'http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';

const KRX_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
};

function formatDateKrx(date) {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

async function testKrxOtp(params, label) {
    console.log(`\n=== ${label} ===`);
    console.log('Params:', JSON.stringify(params, null, 2));
    
    try {
        // 1. OTP
        const otpRes = await fetch(OTP_URL, {
            method: 'POST',
            headers: { ...KRX_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ ...params, csvxls_isNo: 'false', name: 'fileDown' }).toString(),
        });

        console.log(`OTP Response Status: ${otpRes.status}`);
        const otp = await otpRes.text();
        console.log(`OTP Value (first 50 chars): "${otp.slice(0, 50)}" (length: ${otp.length})`);

        if (!otp || otp.length < 10) {
            console.log('ERROR: OTP too short or empty');
            return null;
        }

        // 2. CSV Download
        const dlRes = await fetch(DOWNLOAD_URL, {
            method: 'POST',
            headers: { ...KRX_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `code=${otp}`,
        });

        console.log(`CSV Download Status: ${dlRes.status}`);
        const buf = await dlRes.arrayBuffer();
        const csvText = new TextDecoder('euc-kr').decode(buf);
        
        const lines = csvText.trim().split('\n');
        console.log(`CSV Lines: ${lines.length}`);
        if (lines.length > 0) {
            console.log(`Headers: ${lines[0].slice(0, 200)}`);
        }
        if (lines.length > 1) {
            console.log(`First data row: ${lines[1].slice(0, 200)}`);
        }
        if (lines.length > 2) {
            console.log(`Second data row: ${lines[2].slice(0, 200)}`);
        }

        return { lines: lines.length, headers: lines[0] || '', csvText };
    } catch (e) {
        console.error(`FAILED: ${e.message}`);
        return null;
    }
}

async function testNaverEtfApi() {
    console.log('\n=== 네이버 금융 ETF API 테스트 ===');
    try {
        const res = await fetch('https://finance.naver.com/api/sise/etfItemList.nhn', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        console.log(`Naver API Status: ${res.status}`);
        const data = await res.json();
        const items = data?.result?.etfItemList || [];
        console.log(`Naver ETF Count: ${items.length}`);
        if (items.length > 0) {
            console.log(`First item:`, JSON.stringify(items[0], null, 2));
        }
    } catch (e) {
        console.error(`Naver FAILED: ${e.message}`);
    }
}

async function main() {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = formatDateKrx(kst);
    
    const oneYearAgo = new Date(kst);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDateStr = formatDateKrx(oneYearAgo);

    // Try different dates for price
    const yesterday = new Date(kst);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateKrx(yesterday);

    const twoDaysAgo = new Date(kst);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = formatDateKrx(twoDaysAgo);

    console.log(`Today (KST): ${todayStr}`);
    console.log(`Yesterday: ${yesterdayStr}`);
    console.log(`2 Days Ago: ${twoDaysAgoStr}`);
    console.log(`1 Year Ago: ${fromDateStr}`);

    // Test 1: ETF price (today)
    await testKrxOtp({
        locale: 'ko_KR',
        mktId: 'ETF',
        trdDd: todayStr,
        share: '1',
        money: '1',
        url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
    }, `KRX ETF 시세 (${todayStr} - 오늘)`);

    // Test 2: ETF price (yesterday)
    await testKrxOtp({
        locale: 'ko_KR',
        mktId: 'ETF',
        trdDd: yesterdayStr,
        share: '1',
        money: '1',
        url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
    }, `KRX ETF 시세 (${yesterdayStr} - 어제)`);

    // Test 3: ETF distribution
    await testKrxOtp({
        locale: 'ko_KR',
        searchType: '1',
        mktId: 'ETF',
        isuCd: 'ALL',
        strtDd: fromDateStr,
        endDd: todayStr,
        url: 'dbms/MDC/STAT/standard/MDCSTAT04802',
    }, `KRX ETF 분배금 (${fromDateStr} ~ ${todayStr})`);

    // Test 4: Naver fallback
    await testNaverEtfApi();
}

main().catch(console.error);
