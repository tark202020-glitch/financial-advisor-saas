// KIS API를 사용하여 코스피 시총 TOP 10을 조회하고 Markdown 파일로 저장
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;

if (!APP_KEY || !APP_SECRET) {
    console.error("ERROR: KIS_APP_KEY or KIS_APP_SECRET not found in .env.local");
    process.exit(1);
}

async function getAccessToken() {
    const response = await fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        }),
    });
    if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.access_token;
}

async function getMarketCapRanking(token) {
    const response = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=20173&FID_INPUT_ISCD=0000&FID_DIV_CLS_CODE=0&FID_BLNG_CLS_CODE=0&FID_TRGT_CLS_CODE=111111111&FID_TRGT_XCLS_CODE=000000000&FID_INPUT_PRICE_1=&FID_INPUT_PRICE_2=&FID_VOL_CLS_CODE=&FID_INPUT_DATE_1=`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY,
            "appsecret": APP_SECRET,
            "tr_id": "FHPST01730000",
            "custtype": "P"
        },
    });

    if (!response.ok) {
        console.log(`Market Cap API HTTP Error: ${response.status}`);
        return null;
    }

    const data = await response.json();
    console.log(`API rt_cd: ${data.rt_cd}, msg: ${data.msg1}`);
    if (data.rt_cd !== "0") {
        console.log(`Market Cap API Error: ${data.msg1}`);
        return null;
    }

    return data.output || [];
}

async function getFallbackTop10(token) {
    const TOP_STOCKS = [
        { symbol: '005930', name: '삼성전자' },
        { symbol: '000660', name: 'SK하이닉스' },
        { symbol: '373220', name: 'LG에너지솔루션' },
        { symbol: '207940', name: '삼성바이오로직스' },
        { symbol: '005380', name: '현대자동차' },
        { symbol: '000270', name: '기아' },
        { symbol: '068270', name: '셀트리온' },
        { symbol: '005490', name: 'POSCO홀딩스' },
        { symbol: '035420', name: 'NAVER' },
        { symbol: '055550', name: '신한지주' },
        { symbol: '105560', name: 'KB금융' },
        { symbol: '003670', name: '포스코퓨처엠' },
        { symbol: '006400', name: '삼성SDI' },
        { symbol: '012330', name: '현대모비스' },
        { symbol: '028260', name: '삼성물산' },
    ];

    const results = [];
    for (const stock of TOP_STOCKS) {
        try {
            const res = await fetch(
                `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${stock.symbol}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${token}`,
                    "appkey": APP_KEY,
                    "appsecret": APP_SECRET,
                    "tr_id": "FHKST01010100",
                },
            });
            if (!res.ok) continue;
            const d = await res.json();
            if (d.rt_cd !== "0") continue;
            const output = d.output;
            results.push({
                code: stock.symbol,
                name: stock.name,
                price: output.stck_prpr || '0',
                change: output.prdy_vrss || '0',
                changeRate: output.prdy_ctrt || '0',
                marketCap: output.hts_avls || '0',
                volume: output.acml_vol || '0',
            });
            console.log(`  ✓ ${stock.name}: ${Number(output.hts_avls || 0).toLocaleString()}억원`);
            await new Promise(r => setTimeout(r, 120));
        } catch (e) {
            console.log(`  ✗ ${stock.name}: ${e.message}`);
        }
    }
    return results;
}

async function main() {
    console.log("🔑 KIS API 토큰 발급 중...");
    const token = await getAccessToken();
    console.log("✅ 토큰 발급 완료\n");

    console.log("📊 시총 순위 API 호출 중...");
    let rankingData = await getMarketCapRanking(token);

    let top10;

    if (rankingData && rankingData.length > 0) {
        console.log(`✅ 시총 순위 데이터 수신: ${rankingData.length}개 종목`);
        top10 = rankingData.slice(0, 10).map((item, idx) => ({
            rank: idx + 1,
            code: item.mksc_shrn_iscd || item.stck_shrn_iscd || '-',
            name: item.hts_kor_isnm || '-',
            price: item.stck_prpr || '0',
            change: item.prdy_vrss || '0',
            changeRate: item.prdy_ctrt || '0',
            marketCap: item.stck_avls || item.mksc_shra || '0',
            volume: item.acml_vol || '0',
        }));
    } else {
        console.log("⚠️ 시총 순위 API 사용 불가 (장외시간). 개별 종목 조회 중...\n");
        const fallback = await getFallbackTop10(token);
        fallback.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
        top10 = fallback.slice(0, 10).map((item, idx) => ({
            rank: idx + 1,
            ...item,
        }));
    }

    const totalMarketCap = top10.reduce((sum, item) => sum + parseFloat(item.marketCap || '0'), 0);

    console.log("\n📋 코스피 시가총액 TOP 10:");
    console.log("=".repeat(80));
    top10.forEach(item => {
        const weight = totalMarketCap > 0 ? ((parseFloat(item.marketCap) / totalMarketCap) * 100).toFixed(2) : '0.00';
        console.log(`${item.rank}. ${item.name} (${item.code}) | 시총: ${Number(item.marketCap).toLocaleString()}억원 | 비중: ${weight}%`);
    });

    // Generate Markdown
    const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().slice(0, 10);
    const timeStr = kst.toISOString().slice(11, 19);

    let md = `# 📊 코스피 시가총액 TOP 10\n\n`;
    md += `> **조회일시**: ${dateStr} ${timeStr} (KST)  \n`;
    md += `> **데이터 소스**: 한국투자증권 (KIS) Open API\n\n`;
    md += `---\n\n`;
    md += `## 시가총액 순위 및 비중\n\n`;
    md += `| 순위 | 종목명 | 종목코드 | 현재가 (원) | 전일대비 (%) | 시가총액 (억원) | TOP10 내 비중 |\n`;
    md += `|:----:|--------|:--------:|------------:|:------------:|----------------:|--------------:|\n`;

    top10.forEach(item => {
        const weight = totalMarketCap > 0 ? ((parseFloat(item.marketCap) / totalMarketCap) * 100).toFixed(1) : '0.0';
        const priceFormatted = Number(item.price).toLocaleString();
        const marketCapFormatted = Number(item.marketCap).toLocaleString();
        const changeSign = parseFloat(item.change) >= 0 ? '+' : '';
        const changeRateStr = `${changeSign}${item.changeRate}%`;
        md += `| ${item.rank} | **${item.name}** | ${item.code} | ${priceFormatted} | ${changeRateStr} | ${marketCapFormatted} | ${weight}% |\n`;
    });

    md += `\n### 📈 TOP 10 비중 분포 (시각화)\n\n`;
    md += `\`\`\`\n`;
    top10.forEach(item => {
        const weight = totalMarketCap > 0 ? ((parseFloat(item.marketCap) / totalMarketCap) * 100) : 0;
        const barLength = Math.round(weight / 2);
        const bar = '█'.repeat(barLength);
        const nameStr = item.name.padEnd(14);
        md += `${nameStr} ${bar} ${weight.toFixed(1)}%\n`;
    });
    md += `\`\`\`\n\n`;

    md += `### 📌 참고사항\n\n`;
    md += `- 시가총액은 **억원** 단위입니다.\n`;
    md += `- 비중은 TOP 10 종목 내에서의 상대적 비중을 나타냅니다.\n`;
    md += `- 장외 시간(15:30 이후)에는 종가 기준 데이터가 표시됩니다.\n`;
    md += `- 데이터는 KIS Open API를 통해 실시간 조회되었습니다.\n`;

    const outputPath = path.resolve('doc/KOSPI_시총_TOP10.md');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`\n✅ 파일 저장 완료: ${outputPath}`);
}

main().catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
