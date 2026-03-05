import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from 'fs/promises';
import path from 'path';

// 영문 -> 국문 종목명 및 티커 매핑 (Top 20 대응)
const STOCK_MAPPING: Record<string, { name: string; code: string; sector: string }> = {
    'SAMSUNG ELECTRONICS CO': { name: '삼성전자', code: '005930', sector: '반도체/전자' },
    'SK HYNIX': { name: 'SK하이닉스', code: '000660', sector: '반도체' },
    'SAMSUNG ELECTRONICS PREF': { name: '삼성전자우', code: '005935', sector: '반도체/전자' },
    'HYUNDAI MOTOR CO': { name: '현대차', code: '005380', sector: '자동차' },
    'SK SQUARE CO': { name: 'SK스퀘어', code: '402340', sector: '지주/투자' },
    'KB FINANCIAL GROUP': { name: 'KB금융', code: '105560', sector: '금융' },
    'KIA CORP': { name: '기아', code: '000270', sector: '자동차' },
    'DOOSAN ENERBILITY': { name: '두산에너빌리티', code: '034020', sector: '에너지/기계' },
    'SHINHAN FINANCIAL GROUP': { name: '신한지주', code: '055550', sector: '금융' },
    'HANWHA AEROSPACE': { name: '한화에어로스페이스', code: '012450', sector: '방산/항공' },
    'POSCO HOLDINGS': { name: 'POSCO홀딩스', code: '005490', sector: '철강/소재' },
    'SAMSUNG BIOLOGICS CO': { name: '삼성바이오로직스', code: '207940', sector: '바이오' },
    'CELLTRION': { name: '셀트리온', code: '068270', sector: '바이오' },
    'NAVER LOGISTICS': { name: 'NAVER', code: '035420', sector: 'IT/플랫폼' },
    'KAKAO': { name: '카카오', code: '035720', sector: 'IT/플랫폼' },
    'LG ENERGY SOLUTION': { name: 'LG에너지솔루션', code: '373220', sector: '2차전지' },
    'SAMSUNG SDI': { name: '삼성SDI', code: '006400', sector: '2차전지' },
    'HYUNDAI MOBIS CO': { name: '현대모비스', code: '012330', sector: '자동차부품' },
    'LG CHEM': { name: 'LG화학', code: '051910', sector: '화학/2차전지' }
};

const ESTIMATED_KOSPI_TOTAL_CAP = 22000000; // 코스피 전체 시총 추정치 (약 2,200조원 => API 단위 22,000,000 억원)

export const dynamic = "force-dynamic";

/** MSCI Data (Fallback due to strict scraping limits in edge) */
function getFallbackMSCIData() {
    return [
        { name: 'SAMSUNG ELECTRONICS CO', weight: 33.61 },
        { name: 'SK HYNIX', weight: 18.99 },
        { name: 'SAMSUNG ELECTRONICS PREF', weight: 3.85 },
        { name: 'HYUNDAI MOTOR CO', weight: 2.94 },
        { name: 'SK SQUARE CO', weight: 1.96 },
        { name: 'KB FINANCIAL GROUP', weight: 1.89 },
        { name: 'KIA CORP', weight: 1.59 },
        { name: 'DOOSAN ENERBILITY', weight: 1.56 },
        { name: 'SHINHAN FINANCIAL GROUP', weight: 1.39 },
        { name: 'HANWHA AEROSPACE', weight: 1.31 },
    ];
}

/** Get Access Token (KIS) */
async function getAccessToken() {
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) throw new Error("Missing KIS Keys");

    const response = await fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        }),
    });
    if (!response.ok) throw new Error("KIS Token Request Failed");
    const data = await response.json();
    return data.access_token;
}

/** Get Fallback Top 10 using individual stock inquiries for off-hours */
async function getFallbackTop10(token: string) {
    const TOP_STOCKS = [
        { symbol: '005930', name: '삼성전자' },
        { symbol: '000660', name: 'SK하이닉스' },
        { symbol: '373220', name: 'LG에너지솔루션' },
        { symbol: '207940', name: '삼성바이오로직스' },
        { symbol: '005380', name: '현대차' },
        { symbol: '000270', name: '기아' },
        { symbol: '068270', name: '셀트리온' },
        { symbol: '105560', name: 'KB금융' },
        { symbol: '005490', name: 'POSCO홀딩스' },
        { symbol: '035420', name: 'NAVER' },
        { symbol: '055550', name: '신한지주' },
        { symbol: '003670', name: '포스코퓨처엠' },
        { symbol: '006400', name: '삼성SDI' },
        { symbol: '034020', name: '두산에너빌리티' },
        { symbol: '012450', name: '한화에어로스페이스' },
    ];
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    const results = [];
    for (const stock of TOP_STOCKS) {
        try {
            const res = await fetch(
                `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${stock.symbol}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${token}`,
                    "appkey": APP_KEY || "",
                    "appsecret": APP_SECRET || "",
                    "tr_id": "FHKST01010100",
                } as Record<string, string>,
            });
            if (!res.ok) continue;
            const d = await res.json();
            if (d.rt_cd !== "0") continue;
            const output = d.output;
            results.push({
                name: stock.name,
                code: stock.symbol,
                marketCap: parseFloat(output.hts_avls || '0')
            });
            await new Promise(r => setTimeout(r, 100)); // API Rate Limit 방어
        } catch (e) {
            console.error("Fallback error:", e);
        }
    }

    results.sort((a, b) => b.marketCap - a.marketCap);
    const top10 = results.slice(0, 10);

    return top10.map(item => {
        const ratio = ((item.marketCap / ESTIMATED_KOSPI_TOTAL_CAP) * 100).toFixed(1);
        return {
            name: item.name,
            code: item.code,
            marketCap: item.marketCap,
            weight: parseFloat(ratio)
        };
    });
}

/** Get KOSPI Top 10 */
async function getKospiTop10() {
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;
    const token = await getAccessToken();

    const response = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=20173&FID_INPUT_ISCD=0000&FID_DIV_CLS_CODE=0&FID_BLNG_CLS_CODE=0&FID_TRGT_CLS_CODE=111111111&FID_TRGT_XCLS_CODE=000000000&FID_INPUT_PRICE_1=&FID_INPUT_PRICE_2=&FID_VOL_CLS_CODE=&FID_INPUT_DATE_1=`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY || "",
            "appsecret": APP_SECRET || "",
            "tr_id": "FHPST01730000",
            "custtype": "P"
        } as Record<string, string>,
    });

    if (!response.ok) throw new Error("Market Cap HTTP Failed");
    const data = await response.json();

    if (data.rt_cd !== "0" || !data.output || data.output.length === 0) {
        console.log("Using Fallback for KOSPI (Off-hours)");
        return await getFallbackTop10(token);
    }

    // 전체 코스피 시가총액 추정치 대비 비중
    const top10 = data.output.slice(0, 10);

    return top10.map((item: any) => {
        const mCap = parseFloat(item.mksc_shra || item.stck_avls || '0');
        const ratio = ((mCap / ESTIMATED_KOSPI_TOTAL_CAP) * 100).toFixed(1);
        return {
            name: item.hts_kor_isnm,
            code: item.mksc_shrn_iscd || item.stck_shrn_iscd,
            marketCap: mCap,
            weight: parseFloat(ratio)
        };
    });
}

/** Main Cron Handler */
export async function GET() {
    console.log("Cron: Update MSCI Index Triggered");

    try {
        const msciData = getFallbackMSCIData(); // 추후 Puppeteer Vercel 우회 또는 API 구축시 연동
        const kospiData = await getKospiTop10();

        const integratedMap = new Map();

        // 1. MSCI 삽입
        msciData.forEach(mItem => {
            let krName = mItem.name;
            let code = '-';
            let sector = '-';

            const mapped = STOCK_MAPPING[mItem.name];
            if (mapped) {
                krName = mapped.name;
                code = mapped.code;
                sector = mapped.sector;
            }

            integratedMap.set(krName, {
                name: krName,
                code: code,
                sector: sector,
                marketCap: 0,
                msciWeight: mItem.weight,
                kospiWeight: 0
            });
        });

        // 2. KOSPI 삽입 (Top 10에 포함된 것)
        kospiData.forEach((kItem: any) => {
            let krName = kItem.name;
            let sector = '-';

            // 이름으로 업종 매핑 탐색
            const foundMap = Object.values(STOCK_MAPPING).find(m => m.name === krName);
            if (foundMap) sector = foundMap.sector;

            const existing = integratedMap.get(krName);
            if (existing) {
                existing.kospiWeight = kItem.weight;
                existing.marketCap = kItem.marketCap;
                if (existing.code === '-') existing.code = kItem.code;
                if (existing.sector === '-') existing.sector = sector;
            } else {
                integratedMap.set(krName, {
                    name: krName,
                    code: kItem.code,
                    sector: sector,
                    marketCap: kItem.marketCap,
                    msciWeight: 0,
                    kospiWeight: kItem.weight
                });
            }
        });

        const integratedArray = Array.from(integratedMap.values());
        integratedArray.sort((a, b) => b.msciWeight - a.msciWeight || b.kospiWeight - a.kospiWeight);

        // 3. 마크다운 생성
        const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kst.toISOString().slice(0, 10);

        let md = `# MSCI KOREA INDEX (${dateStr})\n\n`;
        md += `> 데이터 갱신 일시: ${kst.toISOString().slice(0, 10)} ${kst.toISOString().slice(11, 19)} (KST)\n\n`;
        md += `## 📊 통합 산출 테이블 (MSCI vs KOSPI Top 10)\n\n`;
        md += `해당 테이블은 MSCI Top 10 편입 정보와 실제 KOSPI 전체 시총(약 2,200조원 추정) 대비 최상위 10종목 상의 비중을 대비하여 얼마나 오버/언더웨이트 되었는지 직관적으로 탐색합니다.\n\n`;
        md += `| 순위 | 종목명 | 종목코드 | 업종 | 시가총액 (조원) | 코스피 내 비중 (추정) | MSCI 편입 비율 (%) | 비중 갭 |\n`;
        md += `|:---|:---|:---|:---|---:|---:|---:|---:|\n`;

        integratedArray.forEach((item, idx) => {
            const diff = (item.msciWeight - item.kospiWeight).toFixed(1);
            const diffStr = parseFloat(diff) > 0 ? `+${diff}` : `${diff}`;
            const mCapTrillion = item.marketCap > 0 ? (item.marketCap / 10000).toFixed(0) : '-';

            md += `| ${idx + 1} | **${item.name}** | ${item.code} | ${item.sector} | ~${mCapTrillion} | ~${item.kospiWeight > 0 ? item.kospiWeight.toFixed(1) : '-'}% | ${item.msciWeight > 0 ? item.msciWeight.toFixed(1) : '-'}% | **${diffStr}** |\n`;
        });

        // 4. 로컬/서버리스 환경 디스크 쓰기
        // Vercel 환경에서는 /tmp 경로 외 쓰기가 제한되므로,
        // 이 파일을 사용자에게 전달하여 커밋하도록 하거나
        // 로컬에서는 dev 모드이므로 직접 doc 폴더에 씁니다.
        const writePath = path.join(process.cwd(), 'doc', 'MSCI', 'MSCI KOREA INDEX.md');

        if (process.env.NODE_ENV !== 'production') {
            // 상위 디렉터리 확인/생성
            try { await fs.mkdir(path.dirname(writePath), { recursive: true }); } catch (e) { }
            await fs.writeFile(writePath, md, 'utf-8');
            console.log(`Successfully generated at ${writePath}`);
        } else {
            console.log("Running in Production: Using /tmp logic or skipping local write");
            // Production Vercel에서는 Supabase로 백업하거나 렌더링에 직접 쓰도록 보완해야 하지만
            // 사용자 요구사항이 로컬(옵시디언 연동)이므로, 로컬 환경에서 npm run dev 중일 때 Cron API를 호출한다고 가정합니다.
            try { await fs.mkdir(path.dirname(writePath), { recursive: true }); } catch (e) { }
            await fs.writeFile(writePath, md, 'utf-8');
        }

        return NextResponse.json({ success: true, message: "MSCI Index updated.", result: integratedArray });

    } catch (err: any) {
        console.error("MSCI Cron Update Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
