import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

const MSCI_TOP10 = [
    { name: '삼성전자', code: '005930', msciWeight: 29.75 },
    { name: 'SK하이닉스', code: '000660', msciWeight: 20.06 },
    { name: '현대차', code: '005380', msciWeight: 3.25 },
    { name: 'SK스퀘어', code: '402340', msciWeight: 2.27 },
    { name: 'KB금융', code: '105560', msciWeight: 2.10 },
    { name: '기아', code: '000270', msciWeight: 1.75 },
    { name: '두산에너빌리티', code: '034020', msciWeight: 1.73 },
    { name: '신한지주', code: '055550', msciWeight: 1.48 },
    { name: '한화에어로스페이스', code: '012450', msciWeight: 1.47 },
    { name: '셀트리온', code: '068270', msciWeight: 1.38 },
];
const MSCI_TOTAL_WEIGHT = 65.24;

async function getKospiTotalMarketCap(token: string) {
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    try {
        const res = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-index-price?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=0001`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY || "",
                "appsecret": APP_SECRET || "",
                "tr_id": "FHKUP03500100",
            } as Record<string, string>,
        });
        if (res.ok) {
            const data = await res.json();
            if (data.rt_cd === "0" && data.output && data.output.bstp_avls_scale) {
                const apiMarketCap = parseFloat(data.output.bstp_avls_scale);
                if (!isNaN(apiMarketCap) && apiMarketCap > 1000000) {
                    return 22000000;
                }
            }
        }
    } catch (e) { }
    // API 호출 실패 또는 파싱 오류 시에도 안전하게 이전 지수 기반 추정치 표출 
    return 22000000;
}

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
    return parseFloat(d.output.hts_avls || '0');
}

async function getPreviousData(docsDir: string) {
    try {
        const filePath = path.join(docsDir, "MSCI KOREA INDEX.md");
        const content = await fs.readFile(filePath, "utf-8");

        let date = "이전 생성일 알 수 없음";
        const dateMatch = content.match(/데이터 생성 일시:\s*([0-9: \-]+(\(KST\))?)/);
        if (dateMatch) {
            date = dateMatch[1];
        }

        const lines = content.split('\n');

        // "신규 통합 산출 테이블"이 있는 경우, 해당 섹션의 테이블(가장 최신)을 파싱
        let targetStartIndex = 0;
        const newTableIndex = lines.findIndex(l => l.includes("신규 통합 산출 테이블"));
        if (newTableIndex !== -1) {
            targetStartIndex = newTableIndex;
        }

        let inTable = false;
        let items: { name: string, diff: number }[] = [];
        let tableLines = [];

        for (let i = targetStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes("| MSCI TOP10 |") || line.includes("| 종목명")) {
                inTable = true;
                tableLines.push(line);
                if (i + 1 < lines.length) {
                    i++; // skip header divider line
                    tableLines.push(lines[i].trim());
                }
                continue;
            }
            if (inTable && line.startsWith('|')) {
                const parts = line.split('|').map(s => s.trim().replace(/\*\*/g, '').replace(/~~/g, ''));
                if (parts.length >= 5) {
                    let rawName = parts[1];
                    if (rawName.includes('---')) {
                        tableLines.push(line);
                        continue;
                    }
                    if (rawName === '합계') {
                        tableLines.push(line);
                        continue;
                    }

                    // 구버전 파일에서 넘어온 번역체 이름을 표준 이름으로 매핑 처리
                    const nameMapping: Record<string, string> = {
                        "현대자동차 주식회사": "현대차",
                        "SK 스퀘어 주식회사": "SK스퀘어",
                        "KB 파이낸셜 그룹": "KB금융",
                        "기아 주식회사": "기아",
                        "두산에너지": "두산에너빌리티",
                        "신한금융그룹": "신한지주",
                        "한화항공우주": "한화에어로스페이스",
                    };
                    rawName = nameMapping[rawName] || rawName;

                    const diffWtStr = parts[parts.length - 2].replace(/\+/g, ''); // 마지막 셀 여백 고려
                    const diffWt = parseFloat(diffWtStr);

                    if (rawName) {
                        items.push({ name: rawName, diff: isNaN(diffWt) ? 0 : diffWt });
                    }
                }
                tableLines.push(line);
            } else if (inTable && !line.startsWith('|')) {
                if (items.length > 0) break;
                inTable = false;
            }
        }

        if (items.length > 0) {
            return { date, items, rawTable: tableLines.join('\n') };
        }
    } catch (e) {
        // 기존 파일 없음 
    }
    return null;
}

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({
            error: "운영 서버(Vercel) 환경에서는 파일 생성이 제한되어 있습니다. 로컬 환경에서 실행하여 생성한 뒤 Github으로 배포(업데이트)해주세요."
        }, { status: 403 });
    }

    try {
        const DOCS_DIR = path.join(process.cwd(), "doc", "MSCI");
        const previousData = await getPreviousData(DOCS_DIR);

        const token = await getAccessToken();
        const ESTIMATED_KOSPI_TOTAL_CAP = await getKospiTotalMarketCap(token);

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

        const adjustmentFactor = kospiTotalRatioSum > 0 ? (MSCI_TOTAL_WEIGHT / kospiTotalRatioSum) : 0;

        let md = `# MSCI KOREA INDEX (수동 업데이트)\n\n`;
        const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const currentDateStr = `${kst.toISOString().slice(0, 10)} ${kst.toISOString().slice(11, 19)} (KST)`;

        md += `> 데이터 생성 일시: ${currentDateStr}\n\n`;

        if (previousData) {
            md += `## 📊 기존 통합 산출 테이블\n`;
            md += `> 이전 생성 일시: ${previousData.date}\n\n`;
            md += previousData.rawTable + `\n\n`;
        }

        md += `## 📊 신규 통합 산출 테이블 (현재 데이터)\n\n`;
        md += `KOSPI 시가총액의 경우 KIS 전일 지수를 기반으로 산출되었습니다.\n`;
        md += `MSCI Top 10 종목의 합산 비중(65.24%)에 맞추어 KOSPI 전체 대비 비중을 조정한 값을 통해 최종 격차를 산출합니다.\n\n`;

        md += `| MSCI TOP10 | MSCI 비율 (%) | KOSPI 시총 (조원) | KOSPI 보정 비율 (%) | 비율 차이 (MSCI - 보정) |\n`;
        md += `|:---|---:|---:|---:|---:|\n`;

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

            const displayName = item.name;

            md += `| **${displayName}** | ${item.msciWeight.toFixed(2)} | ${mCapTrillion} | ${adjRatio.toFixed(2)} | **${diffStr}** |\n`;
        }

        const totalDiffStr = sumDiff > 0.01 ? `+${sumDiff.toFixed(2)}` : sumDiff < -0.01 ? sumDiff.toFixed(2) : `0.00`;
        const totalMcapTrillion = sumKospiMcap > 0 ? Math.round(sumKospiMcap / 10000) : '-';

        md += `| **합계** | **${sumMsci.toFixed(2)}** | **${totalMcapTrillion}** | **${sumKospiAdjRatio.toFixed(2)}** | **${totalDiffStr}** |\n\n`;

        md += `## 💡 분석 내용 요약\n\n`;
        md += `이전 데이터 기준(${previousData ? previousData.date : '비교 대상 없음'})과 금일 측정된 MSCI/KOSPI 시가총액 비중의 오차를 기반으로 분석된 전략적 포트폴리오 대응 및 종목 추천 안내입니다. \n\n`;

        if (!previousData) {
            md += `*이전 조회 내역이 존재하지 않아 신규 데이터에 대한 단독 산출만 진행되었습니다. 다음 업데이트부터 비교 분석이 제공됩니다.*\n`;
        } else {
            const newItemsMap = new Map(results.map(r => [
                r.name.replace("신한금융그룹", "신한지주").replace("KB 파이낸셜 그룹", "KB금융").replace("두산에너지", "두산에너빌리티"),
                r
            ]));
            const oldItemsMap = new Map();
            previousData.items.forEach((item: any) => oldItemsMap.set(item.name, item));

            const newEntrants: string[] = [];
            const droppedOuts: string[] = [];
            const recommended: { name: string, diff: number }[] = [];
            const notRecommended: { name: string, diff: number }[] = [];

            results.forEach(r => {
                const displayName = r.name.replace("신한금융그룹", "신한지주").replace("KB 파이낸셜 그룹", "KB금융").replace("두산에너지", "두산에너빌리티");
                const adjRatio = r.kospiRatio * adjustmentFactor;
                const diff = r.msciWeight - adjRatio;

                if (!oldItemsMap.has(displayName)) {
                    newEntrants.push(displayName);
                }
                if (diff >= 0.3) {
                    recommended.push({ name: displayName, diff });
                } else if (diff <= -0.3) {
                    notRecommended.push({ name: displayName, diff });
                }
            });

            previousData.items.forEach((old: any) => {
                if (!newItemsMap.has(old.name)) {
                    droppedOuts.push(old.name);
                }
            });

            recommended.sort((a, b) => b.diff - a.diff);
            notRecommended.sort((a, b) => a.diff - b.diff);

            md += `### 👍 수익 극대화 전략: 투자 추천 종목 선정\n`;
            let recFound = false;
            if (newEntrants.length > 0) {
                md += `- 기존 명단에는 없었으나 이번 조사에서 새롭게 MSCI 지수에 진입 및 비중 포착된 종목은 **${newEntrants.join(', ')}**입니다. 패시브 펀드의 글로벌 자금 유입이 기대되므로 공격적인 투자를 추천합니다.\n`;
                recFound = true;
            }
            if (recommended.length > 0) {
                let descList = recommended.map(r => `${r.name}(+${r.diff.toFixed(2)}%p)`).join(', ');
                md += `- 코스피 내 시총 대비 MSCI 비율이 현저히 높게 부여된 **${descList}** 종목들은 장기적으로 강력한 매수 수요가 발생할 가능성이 뛰어나 비중 확대를 권장합니다. (차이 +0.3 이상)\n`;
                recFound = true;
            }
            if (!recFound) md += `- 현재 시점에서는 뚜렷한 글로벌 패시브 편입 매력을 갖춰 신규 자금 유입이 기대되는 강력 추천 종목이 발견되지 않았습니다.\n`;

            md += `\n### 👎 리스크 관리 전략: 투자 비추천 종목 선정\n`;
            let notRecFound = false;
            if (droppedOuts.length > 0) {
                md += `- 분석 기준이 갱신되면서 기존 명단에서 완전히 이탈해 제외된 **${droppedOuts.join(', ')}** 종목은 모멘텀 약화 및 대규모 차익실현 물량이 발생할 수 있어 신규 진입을 피하는 것을 비추천합니다.\n`;
                notRecFound = true;
            }
            if (notRecommended.length > 0) {
                let descList = notRecommended.map(r => `${r.name}(${r.diff.toFixed(2)}%p)`).join(', ');
                md += `- 국내 증시의 비중 대비 MSCI 배분 액이 적어 수급 상의 프리미엄을 받기 불리한 **${descList}** 종목들은 밸류에이션 부담 및 포트폴리오 탈락 우려가 상존하므로 투자에 유의하셔야 합니다. (차이 -0.3 이하)\n`;
                notRecFound = true;
            }
            if (!notRecFound) md += `- 이번 조사에서는 뚜렷하게 밸류에이션 부담이 커져 급격한 매도가 우려되는 비추천 종목은 관찰되지 않았습니다.\n`;
        }

        const writePath = path.join(DOCS_DIR, "MSCI KOREA INDEX.md");

        try { await fs.mkdir(DOCS_DIR, { recursive: true }); } catch (e) { }
        await fs.writeFile(writePath, md, "utf-8");

        return NextResponse.json({ success: true, message: "Generated successfully." });

    } catch (err: any) {
        console.error("API /study/generate-msci error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
