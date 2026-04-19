/**
 * KRX 정보데이터시스템 ETF 분배금 & 가격 데이터 테스트
 * 
 * 두 가지 데이터 소스를 테스트합니다:
 * 1. KRX OTP 방식: ETF 전종목 일별 시세 (가격 + 시가총액)
 * 2. KRX OTP 방식: ETF 분배금 현황
 * 3. 네이버 금융 API: ETF 전종목 리스트 + 가격
 */

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
};

// ===== 1. KRX OTP 방식: ETF 전종목 시세 =====
async function testKrxEtfPrices() {
    console.log('\n===== [TEST 1] KRX ETF 전종목 시세 =====');
    try {
        // Step 1: OTP 발급
        const otpUrl = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
        const formData = new URLSearchParams({
            locale: 'ko_KR',
            mktId: 'ETF',  // ETF 시장
            trdDd: '20260418',  // 조회 날짜
            share: '1',
            money: '1',
            csvxls_isNo: 'false',
            name: 'fileDown',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04301'
        });

        const otpRes = await fetch(otpUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const otp = await otpRes.text();
        console.log('  OTP 발급:', otp.slice(0, 30) + '...');

        // Step 2: 데이터 다운로드
        const downloadUrl = 'http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';
        const dlRes = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `code=${otp}`,
        });

        const csvBuffer = await dlRes.arrayBuffer();
        const csvText = new TextDecoder('euc-kr').decode(csvBuffer);
        const lines = csvText.trim().split('\n');
        
        console.log('  총 행 수:', lines.length);
        console.log('  헤더:', lines[0]);
        if (lines.length > 1) {
            console.log('  첫 5개 데이터:');
            for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
                console.log('   ', lines[i].slice(0, 120));
            }
        }
        return lines;
    } catch (e) {
        console.error('  KRX ETF 시세 실패:', e.message);
        return null;
    }
}

// ===== 2. KRX OTP 방식: ETF 분배금 현황 =====
async function testKrxEtfDividends() {
    console.log('\n===== [TEST 2] KRX ETF 분배금 현황 =====');
    try {
        // 12개월 기간의 분배금 데이터
        const otpUrl = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
        const formData = new URLSearchParams({
            locale: 'ko_KR',
            searchType: '1',  // 기간 검색
            mktId: 'ETF',
            isuCd: 'ALL',     // 전종목
            strtDd: '20250419',  // 1년 전
            endDd: '20260418',   // 오늘
            csvxls_isNo: 'false',
            name: 'fileDown',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04802'  // ETF 분배금 현황
        });

        const otpRes = await fetch(otpUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const otp = await otpRes.text();
        console.log('  OTP 발급:', otp.slice(0, 30) + '...');

        const downloadUrl = 'http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';
        const dlRes = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `code=${otp}`,
        });

        const csvBuffer = await dlRes.arrayBuffer();
        const csvText = new TextDecoder('euc-kr').decode(csvBuffer);
        const lines = csvText.trim().split('\n');
        
        console.log('  총 행 수:', lines.length);
        console.log('  헤더:', lines[0]);
        if (lines.length > 1) {
            console.log('  첫 10개 분배금 데이터:');
            for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
                console.log('   ', lines[i].slice(0, 150));
            }
        }
        return lines;
    } catch (e) {
        console.error('  KRX ETF 분배금 실패:', e.message);
        return null;
    }
}

// ===== 3. 네이버 금융 ETF 전종목 API =====
async function testNaverEtfList() {
    console.log('\n===== [TEST 3] 네이버 금융 ETF 전종목 리스트 =====');
    try {
        const url = 'https://finance.naver.com/api/sise/etfItemList.nhn';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const data = await res.json();
        const items = data?.result?.etfItemList || [];
        
        console.log('  총 ETF 수:', items.length);
        if (items.length > 0) {
            console.log('  필드 목록:', Object.keys(items[0]).join(', '));
            console.log('\n  첫 5개 종목:');
            for (let i = 0; i < Math.min(5, items.length); i++) {
                const item = items[i];
                console.log(`    ${item.itemname} (${item.itemcode}) - 현재가: ${item.nowVal}, 수익률: ${item.changeRate}%`);
            }
            
            // 배당 관련 필드 확인
            const sample = items[0];
            const dividendFields = Object.entries(sample).filter(([k]) => 
                k.includes('div') || k.includes('divi') || k.includes('yield') || k.includes('분')
            );
            console.log('\n  배당관련 필드:', dividendFields.length > 0 ? dividendFields : '없음');
        }
        return items;
    } catch (e) {
        console.error('  네이버 ETF 실패:', e.message);
        return null;
    }
}

// ===== 4. KRX JSON API: ETF 전종목 기본 정보 =====
async function testKrxEtfJson() {
    console.log('\n===== [TEST 4] KRX JSON API: ETF 전종목 기본 정보 =====');
    try {
        const otpUrl = 'http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd';
        const formData = new URLSearchParams({
            locale: 'ko_KR',
            mktId: 'ETF',
            trdDd: '20260418',
            share: '1',
            money: '1',
            csvxls_isNo: 'false',
            name: 'fileDown',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04301'
        });

        const otpRes = await fetch(otpUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const otp = await otpRes.text();

        // JSON 다운로드 대신 CSV 사용
        const downloadUrl = 'http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd';
        const dlRes = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `code=${otp}`,
        });

        const csvBuffer = await dlRes.arrayBuffer();
        const csvText = new TextDecoder('euc-kr').decode(csvBuffer);
        const lines = csvText.trim().split('\n');
        
        // CSV 파싱해서 TIGER/KODEX 커버드콜 ETF 찾기
        const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        console.log('  헤더:', header.join(' | '));
        
        const coveredCallETFs = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
            const name = cols[1] || '';  // 종목명
            if (name.includes('커버드콜') || name.includes('프리미엄') || name.includes('COVERED')) {
                coveredCallETFs.push({ code: cols[0], name, price: cols[4] || cols[3] });
            }
        }
        
        console.log(`\n  커버드콜/프리미엄 ETF ${coveredCallETFs.length}개 발견:`);
        for (const etf of coveredCallETFs.slice(0, 10)) {
            console.log(`    ${etf.name} (${etf.code}) - ${etf.price}`);
        }
        
        return lines;
    } catch (e) {
        console.error('  KRX JSON 실패:', e.message);
        return null;
    }
}

// ===== 실행 =====
(async () => {
    console.log('='.repeat(70));
    console.log(' KRX / 네이버 ETF 데이터 API 테스트');
    console.log(' 실행 시각:', new Date().toLocaleString('ko-KR'));
    console.log('='.repeat(70));

    await testKrxEtfPrices();
    await testKrxEtfDividends();
    await testNaverEtfList();
    await testKrxEtfJson();

    console.log('\n' + '='.repeat(70));
    console.log(' 테스트 완료');
    console.log('='.repeat(70));
})();
