// KRX 종목 마스터 데이터 갱신 테스트
// KRX 공식 API를 통해 KOSPI + KOSDAQ 전체 종목 리스트를 가져옵니다.

async function fetchKRXStocks(marketType) {
    // KRX 정보데이터시스템 API
    // STK: 주식, KSQ: 코스닥, KNX: 코넥스
    const url = 'http://data.krx.co.kr/comm/bldAttend498/getJsonData.cmd';
    const formData = new URLSearchParams();
    formData.append('bld', 'dbms/MDC/STAT/standard/MDCSTAT01901');
    formData.append('locale', 'ko_KR');
    formData.append('mktId', marketType); // STK, KSQ, KNX
    formData.append('trdDd', new Date().toISOString().slice(0, 10).replace(/-/g, '')); // YYYYMMDD
    formData.append('money', '1');
    formData.append('csvxls_is498No', 'false');

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiStat/MKD/01/01/rpt/MDCSTAT01901.cmd',
            },
            body: formData.toString(),
        });

        if (!res.ok) {
            console.log(`  ❌ KRX ${marketType}: HTTP ${res.status}`);
            return [];
        }

        const data = await res.json();
        const items = data.OutBlock_1 || [];
        console.log(`  ✅ KRX ${marketType}: ${items.length}개 종목`);
        
        if (items.length > 0) {
            console.log(`     예시: ${items[0].ISU_SRT_CD} ${items[0].ISU_ABBRV}`);
        }

        return items.map(item => ({
            symbol: item.ISU_SRT_CD,
            name: item.ISU_ABBRV,
            market: 'KR',
            standard_code: item.ISU_CD,
        }));
    } catch (e) {
        console.log(`  ❌ KRX ${marketType} 실패: ${e.message}`);
        return [];
    }
}

// KIS API로도 종목 리스트 조회 가능한지 확인
async function fetchKISStockList() {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });

    const BASE_URL = process.env.KIS_BASE_URL;
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    // KIS 종목 마스터 다운로드 URL (공식 문서)
    // https://apiportal.koreainvestment.com/apiservice/apiservice-domestic-stock-quotations
    const urls = [
        'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip',
        'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip',
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            console.log(`  KIS Master (${url.includes('kospi') ? 'KOSPI' : 'KOSDAQ'}): HTTP ${res.status}, Size: ${res.headers.get('content-length')} bytes`);
        } catch (e) {
            console.log(`  ❌ KIS Master 다운로드 실패: ${e.message}`);
        }
    }
}

async function main() {
    console.log('=== 종목 마스터 갱신 소스 테스트 ===\n');

    // 1. KRX 정보데이터시스템
    console.log('--- 1. KRX 정보데이터시스템 API ---');
    const kospiStocks = await fetchKRXStocks('STK');
    const kosdaqStocks = await fetchKRXStocks('KSQ');

    // KoAct 코스닥액티브 검색
    const allStocks = [...kospiStocks, ...kosdaqStocks];
    const koact = allStocks.filter(s => s.name.includes('KoAct') || s.name.includes('코스닥액티브'));
    console.log(`\n  🔍 "KoAct/코스닥액티브" 검색: ${koact.length}개`);
    koact.forEach(s => console.log(`     ${s.symbol} ${s.name}`));

    console.log(`\n  📊 전체: KOSPI ${kospiStocks.length} + KOSDAQ ${kosdaqStocks.length} = ${allStocks.length}개`);

    // 2. KIS 종목 마스터 다운로드
    console.log('\n--- 2. KIS 종목 마스터 ZIP ---');
    await fetchKISStockList();

    console.log('\n=== 테스트 완료 ===');
}

main().catch(console.error);
