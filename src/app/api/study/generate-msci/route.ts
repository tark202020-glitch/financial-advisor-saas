import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

const MSCI_TOP10 = [
    { name: '삼성전자', code: '005930', msciWeight: 29.75 },
    { name: 'SK하이닉스', code: '000660', msciWeight: 20.06 },
    { name: '현대자동차 주식회사', code: '005380', msciWeight: 3.25 },
    { name: 'SK 스퀘어 주식회사', code: '402340', msciWeight: 2.27 },
    { name: 'KB 파이낸셜 그룹', code: '105560', msciWeight: 2.10 },
    { name: '기아 주식회사', code: '000270', msciWeight: 1.75 },
    { name: '두산에너지', code: '034020', msciWeight: 1.73 },
    { name: '신한금융그룹', code: '055550', msciWeight: 1.48 },
    { name: '한화항공우주', code: '012450', msciWeight: 1.47 },
    { name: '셀트리온', code: '068270', msciWeight: 1.38 },
];
const MSCI_TOTAL_WEIGHT = 65.24;
const ESTIMATED_KOSPI_TOTAL_CAP = 22000000; // 코스피 전체 시총 추정치 (약 2,200조원 => API 단위 22,000,000 억원)

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

async function getStockMarketCap(token: string, symbol: string) {
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    const res = await fetch(
        `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY || "",
            "appsecret": APP_SECRET || "",
            "tr_id": "FHKST01010100",
        } as Record<string, string>,
    });
    if (!res.ok) return 0;
    const d = await res.json();
    if (d.rt_cd !== "0") return 0;
    // 시가총액 (hts_avls, 단위: 억원)
    return parseFloat(d.output.hts_avls || '0');
}

export async function POST(request: NextRequest) {
    try {
        const token = await getAccessToken();

        const results = [];
        let kospiTotalRatioSum = 0;

        for (const item of MSCI_TOP10) {
            const mCap = await getStockMarketCap(token, item.code);
            const kospiRatio = (mCap / ESTIMATED_KOSPI_TOTAL_CAP) * 100;
            kospiTotalRatioSum += kospiRatio;

            results.push({
                ...item,
                marketCap: mCap,
                kospiRatio: kospiRatio
            });
            await new Promise(r => setTimeout(r, 100)); // Rate limit
        }

        // 4. 조정 비율 산출 (MSCI 합계 65.24 / 코스피 비중 합계)
        const adjustmentFactor = kospiTotalRatioSum > 0 ? (MSCI_TOTAL_WEIGHT / kospiTotalRatioSum) : 0;

        let md = `# MSCI KOREA INDEX (수동 업데이트)\n\n`;
        const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        md += `> 데이터 생성 일시: ${kst.toISOString().slice(0, 10)} ${kst.toISOString().slice(11, 19)} (KST)\n\n`;
        md += `## 📊 통합 산출 테이블 (MSCI vs KOSPI Top 10)\n\n`;
        md += `KOSPI 시가총액의 경우 실시간 현재가를 반영하며, KOSPI 전체 시총은 약 2,200조원을 기준으로 역산합니다.\n`;
        md += `MSCI Top 10 종목의 합산 비중(65.24%)에 맞추어 KOSPI 전체 대비 비중을 조정한 값을 통해 최종 격차를 산출합니다.\n\n`;

        md += `| MSCI TOP10 | MSCI 비율 (%) | KOSPI 시총 (조원) | KOSPI 전체 대비 종목장 시총 비율 (%) | KOSPI 보정 비율 (%) | 비율 차이 (MSCI - 보정) |\n`;
        md += `|:---|---:|---:|---:|---:|---:|\n`;

        let sumMsci = 0;
        let sumKospiMcap = 0;
        let sumKospiOrigRatio = 0;
        let sumKospiAdjRatio = 0;
        let sumDiff = 0;

        for (const item of results) {
            const adjRatio = item.kospiRatio * adjustmentFactor;
            const diff = item.msciWeight - adjRatio;

            sumMsci += item.msciWeight;
            sumKospiMcap += item.marketCap;
            sumKospiOrigRatio += item.kospiRatio;
            sumKospiAdjRatio += adjRatio;
            sumDiff += diff;

            const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            const mCapTrillion = item.marketCap > 0 ? Math.round(item.marketCap / 10000) : '-';

            // 신한금융 -> 신한금융 스펠링 보정 (표시용)
            const displayName = item.name.replace("신한금융그룹", "신한금융그룹");

            md += `| **${displayName}** | ${item.msciWeight.toFixed(2)} | ${mCapTrillion} | ${item.kospiRatio.toFixed(2)} | ${adjRatio.toFixed(2)} | **${diffStr}** |\n`;
        }

        // JS 부동소수점 오차로 0.00 이 아닌 값이 나올 수 있으므로 합계는 명확하게 포매팅
        const totalDiffStr = sumDiff > 0.01 ? `+${sumDiff.toFixed(2)}` : sumDiff < -0.01 ? sumDiff.toFixed(2) : `0.00`;
        const totalMcapTrillion = sumKospiMcap > 0 ? Math.round(sumKospiMcap / 10000) : '-';
        md += `| **합계** | **${sumMsci.toFixed(2)}** | **${totalMcapTrillion}** | **${sumKospiOrigRatio.toFixed(2)}** | **${sumKospiAdjRatio.toFixed(2)}** | **${totalDiffStr}** |\n`;

        // Save
        const DOCS_DIR = path.join(process.cwd(), "doc", "MSCI");
        const writePath = path.join(DOCS_DIR, "MSCI KOREA INDEX.md"); // "MSCI KOREA INDEX.md" 에 덮어쓰기

        try { await fs.mkdir(DOCS_DIR, { recursive: true }); } catch (e) { }
        await fs.writeFile(writePath, md, "utf-8");

        return NextResponse.json({ success: true, message: "Generated successfully." });

    } catch (err: any) {
        console.error("API /study/generate-msci error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
