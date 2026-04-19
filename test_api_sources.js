// Test various free API sources for Korean ETF dividend data

async function testNaverEtfList() {
    console.log('\n=== 1. 네이버 금융 ETF 목록 API ===');
    try {
        const res = await fetch('https://finance.naver.com/api/sise/etfItemList.nhn?etfType=0&targetColumn=market_sum&sortOrder=desc');
        const data = await res.json();
        const items = data.result?.etfItemList;
        if (items && items.length > 0) {
            console.log(`총 ETF 수: ${items.length}`);
            console.log('필드 목록:', Object.keys(items[0]));
            // Show first 3 with relevant fields
            for (const item of items.slice(0, 3)) {
                console.log(`  ${item.itemname} (${item.itemcode}) - 현재가: ${item.nowVal}, 시총: ${item.marketSum}`);
            }
        }
    } catch (e) {
        console.error('네이버 ETF 목록 실패:', e.message);
    }
}

async function testKrxEtfPrice() {
    console.log('\n=== 2. KRX ETF 시세 (OTP 방식) ===');
    try {
        // Step 1: Generate OTP
        const otpBody = new URLSearchParams({
            name: 'fileDown',
            filetype: 'csv',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
            locale: 'ko_KR',
            trdDd: '20260418',
            share: '1',
            money: '1',
            csvxls_isNo: 'false',
        });
        
        const otpRes = await fetch('http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020102',
                'User-Agent': 'Mozilla/5.0',
            },
            body: otpBody.toString(),
        });
        const otp = await otpRes.text();
        console.log('OTP 발급:', otp ? `성공 (길이: ${otp.length})` : '실패');

        if (otp) {
            // Step 2: Download data
            const dlRes = await fetch('http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://data.krx.co.kr',
                    'User-Agent': 'Mozilla/5.0',
                },
                body: `code=${otp}`,
            });
            const csvText = await dlRes.text();
            const lines = csvText.split('\n').filter(l => l.trim());
            console.log(`CSV 행 수: ${lines.length}`);
            if (lines.length > 0) {
                console.log('헤더:', lines[0].substring(0, 200));
                if (lines.length > 1) console.log('첫 행:', lines[1].substring(0, 200));
            }
        }
    } catch (e) {
        console.error('KRX ETF 시세 실패:', e.message);
    }
}

async function testKrxEtfDividend() {
    console.log('\n=== 3. KRX ETF 분배금 (OTP 방식) ===');
    try {
        // ETF 분배금 현황 페이지: MDCSTAT04802
        const otpBody = new URLSearchParams({
            name: 'fileDown',
            filetype: 'csv',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04802',
            locale: 'ko_KR',
            strtDd: '20250418',
            endDd: '20260418',
            share: '1',
            money: '1',
            csvxls_isNo: 'false',
        });
        
        const otpRes = await fetch('http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020105',
                'User-Agent': 'Mozilla/5.0',
            },
            body: otpBody.toString(),
        });
        const otp = await otpRes.text();
        console.log('OTP 발급:', otp ? `성공 (길이: ${otp.length})` : '실패');

        if (otp) {
            const dlRes = await fetch('http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://data.krx.co.kr',
                    'User-Agent': 'Mozilla/5.0',
                },
                body: `code=${otp}`,
            });
            const buf = await dlRes.arrayBuffer();
            // KRX returns EUC-KR
            const decoder = new TextDecoder('euc-kr');
            const csvText = decoder.decode(buf);
            const lines = csvText.split('\n').filter(l => l.trim());
            console.log(`CSV 행 수: ${lines.length}`);
            if (lines.length > 0) {
                console.log('헤더:', lines[0].substring(0, 300));
                if (lines.length > 1) console.log('첫 행:', lines[1].substring(0, 300));
                if (lines.length > 2) console.log('둘째 행:', lines[2].substring(0, 300));
            }
        }
    } catch (e) {
        console.error('KRX ETF 분배금 실패:', e.message);
    }
}

async function testKrxEtfTRD() {
    console.log('\n=== 4. KRX ETF 전종목 기본정보 (13104 시세) ===');
    try {
        // KRX 전종목 시세 (ETF) : MDCSTAT04301
        const otpBody = new URLSearchParams({
            locale: 'ko_KR',
            trdDd: '20260418',
            share: '1',
            money: '1',
            csvxls_isNo: 'false',
            name: 'fileDown',
            filetype: 'csv',
            url: 'dbms/MDC/STAT/standard/MDCSTAT04301',
        });
        
        const otpRes = await fetch('http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://data.krx.co.kr',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            body: otpBody.toString(),
        });
        const otp = await otpRes.text();
        console.log('OTP:', otp ? `성공 (${otp.length}자)` : '실패');
        
        if (otp && otp.length > 10) {
            const dlRes = await fetch('http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'http://data.krx.co.kr',
                    'User-Agent': 'Mozilla/5.0',
                },
                body: `code=${otp}`,
            });
            const buf = await dlRes.arrayBuffer();
            const decoder = new TextDecoder('euc-kr');
            const csvText = decoder.decode(buf);
            const lines = csvText.split('\n').filter(l => l.trim());
            console.log(`CSV 행 수: ${lines.length}`);
            if (lines.length > 0) console.log('헤더:', lines[0].substring(0, 300));
            if (lines.length > 1) console.log('첫행:', lines[1].substring(0, 300));
        }
    } catch (e) {
        console.error('KRX ETF 시세 실패:', e.message);
    }
}

// Run all tests
(async () => {
    await testNaverEtfList();
    await testKrxEtfDividend();
    await testKrxEtfTRD();
})();
