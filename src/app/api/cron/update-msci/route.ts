import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAccessToken } from "@/lib/kis/client";
import { appendMSCIToSheets } from "@/lib/googleSheets";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * /api/cron/update-msci
 *
 * MSCI KOREA INDEX 자동 갱신 Cron
 * - generate-msci와 동일한 정밀 산출 로직 사용
 * - Supabase study_boards 저장 + Google Sheets 누적 저장
 * - Vercel Cron: 매일 UTC 22:00 (KST 07:00) 실행
 */

// MSCI TOP10 비중 (공식 기준, 2026.03)
const MSCI_TOP10: { name: string; code: string; msciWeight: number }[] = [
    { name: "삼성전자", code: "005930", msciWeight: 33.61 },
    { name: "SK하이닉스", code: "000660", msciWeight: 18.99 },
    { name: "삼성전자우", code: "005935", msciWeight: 3.85 },
    { name: "현대차", code: "005380", msciWeight: 2.94 },
    { name: "SK스퀘어", code: "402340", msciWeight: 1.96 },
    { name: "KB금융", code: "105560", msciWeight: 1.89 },
    { name: "기아", code: "000270", msciWeight: 1.59 },
    { name: "두산에너빌리티", code: "034020", msciWeight: 1.56 },
    { name: "신한지주", code: "055550", msciWeight: 1.39 },
    { name: "한화에어로스페이스", code: "012450", msciWeight: 1.31 },
];

const ESTIMATED_KOSPI_TOTAL_CAP = 22000000; // 약 2,200조원

/** KIS API로 개별 종목 시총 조회 (억 원) */
async function getStockMarketCap(token: string, symbol: string): Promise<number> {
    const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
    const APP_KEY = process.env.KIS_APP_KEY;
    const APP_SECRET = process.env.KIS_APP_SECRET;

    try {
        const res = await fetch(
            `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`,
            {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${token}`,
                    appkey: APP_KEY || "",
                    appsecret: APP_SECRET || "",
                    tr_id: "FHKST01010100",
                } as Record<string, string>,
            }
        );
        if (!res.ok) return 0;
        const d = await res.json();
        if (d.rt_cd !== "0") return 0;
        return parseFloat(d.output.hts_avls || "0");
    } catch {
        return 0;
    }
}

/** 이전 MSCI 데이터 가져오기 (study_boards에서) */
async function getPreviousData(supabase: any) {
    try {
        const { data: boards } = await supabase
            .from("study_boards")
            .select("content")
            .eq("topic", "msci")
            .order("created_at", { ascending: false })
            .limit(1);

        if (!boards || boards.length === 0 || !boards[0].content) return null;

        const content = boards[0].content;
        let date = "이전 생성일 알 수 없음";
        const dateMatch = content.match(/데이터 생성 일시:\s*([0-9: \-]+($$KST$$)?)/);
        if (dateMatch) date = dateMatch[1];

        const lines = content.split("\n");
        let targetStartIndex = 0;
        const newTableIndex = lines.findIndex((l: string) => l.includes("신규 통합 산출 테이블"));
        if (newTableIndex !== -1) targetStartIndex = newTableIndex;

        let inTable = false;
        const items: { name: string; diff: number }[] = [];
        const tableLines: string[] = [];

        const nameMapping: Record<string, string> = {
            "현대자동차 주식회사": "현대차",
            현대자동차: "현대차",
            "SK 스퀘어 주식회사": "SK스퀘어",
            "KB 파이낸셜 그룹": "KB금융",
            "기아 주식회사": "기아",
            두산에너지: "두산에너빌리티",
            신한금융그룹: "신한지주",
            한화항공우주: "한화에어로스페이스",
        };

        for (let i = targetStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes("| MSCI TOP10 |") || line.includes("| 종목명")) {
                inTable = true;
                tableLines.push(line);
                if (i + 1 < lines.length) {
                    i++;
                    tableLines.push(lines[i].trim());
                }
                continue;
            }
            if (inTable && line.startsWith("|")) {
                const parts = line.split("|").map((s: string) => s.trim().replace(/\*\*/g, "").replace(/~~/g, ""));
                if (parts.length >= 5) {
                    let rawName = parts[1];
                    if (rawName.includes("---") || rawName === "합계") {
                        tableLines.push(line);
                        continue;
                    }
                    rawName = nameMapping[rawName] || rawName;
                    const diffWtStr = parts[parts.length - 2].replace(/\+/g, "");
                    const diffWt = parseFloat(diffWtStr);
                    if (rawName) items.push({ name: rawName, diff: isNaN(diffWt) ? 0 : diffWt });
                }
                tableLines.push(line);
            } else if (inTable && !line.startsWith("|")) {
                if (items.length > 0) break;
                inTable = false;
            }
        }

        if (items.length > 0) return { date, items, rawTable: tableLines.join("\n") };
    } catch (e) {
        console.error("[MSCI Cron] Failed to parse previous data:", e);
    }
    return null;
}

export async function GET() {
    console.log("[MSCI Cron] Starting MSCI index update...");

    try {
        // 1. KIS 토큰 (분산 잠금 적용된 공유 함수)
        const token = await getAccessToken();

        // 2. 각 종목 시총 조회
        const results: Array<{
            name: string;
            code: string;
            msciWeight: number;
            marketCap: number;
            kospiRatio: number;
        }> = [];
        let kospiTotalRatioSum = 0;

        for (const item of MSCI_TOP10) {
            const mCap = await getStockMarketCap(token, item.code);
            const kospiRatio = (mCap / ESTIMATED_KOSPI_TOTAL_CAP) * 100;
            kospiTotalRatioSum += kospiRatio;
            results.push({ ...item, marketCap: mCap, kospiRatio });
            await new Promise((r) => setTimeout(r, 100)); // Rate limit
        }

        // 3. MSCI 비중 합계에 맞춘 보정 팩터
        let MSCI_TOTAL_WEIGHT = 0;
        for (const item of MSCI_TOP10) MSCI_TOTAL_WEIGHT += item.msciWeight;
        const adjustmentFactor = kospiTotalRatioSum > 0 ? MSCI_TOTAL_WEIGHT / kospiTotalRatioSum : 0;

        // 4. Supabase 연결
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const previousData = await getPreviousData(supabase);

        // 5. 마크다운 생성 (generate-msci와 동일)
        const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const currentDateStr = `${kst.toISOString().slice(0, 10)} ${kst.toISOString().slice(11, 19)} (KST)`;
        const dateOnly = kst.toISOString().slice(0, 10);

        let md = `# MSCI KOREA INDEX (자동 업데이트)\n\n`;
        md += `> 데이터 생성 일시: ${currentDateStr}\n\n`;

        if (previousData) {
            md += `## 📊 기존 통합 산출 테이블\n`;
            md += `> 이전 생성 일시: ${previousData.date}\n\n`;
            md += previousData.rawTable + `\n\n`;
        }

        md += `## 📊 신규 통합 산출 테이블 (현재 데이터)\n\n`;
        md += `KOSPI 시가총액의 경우 KIS 전일 지수를 기반으로 산출되었습니다.\n`;
        md += `MSCI Top 10 종목의 합산 비중(${MSCI_TOTAL_WEIGHT.toFixed(2)}%)에 맞추어 KOSPI 전체 대비 비중을 조정한 값을 통해 최종 격차를 산출합니다.\n\n`;
        md += `| MSCI TOP10 | MSCI 비율 (%) | KOSPI 시총 (조원) | KOSPI 보정 비율 (%) | 비율 차이 (MSCI - 보정) |\n`;
        md += `|:---|---:|---:|---:|---:|\n`;

        let sumMsci = 0, sumKospiMcap = 0, sumKospiAdjRatio = 0, sumDiff = 0;

        // Google Sheets 데이터 배열
        const sheetsData: Array<{
            name: string;
            code: string;
            msciWeight: number;
            marketCapTrillion: number;
            adjustedRatio: number;
            diff: number;
        }> = [];

        for (const item of results) {
            const adjRatio = item.kospiRatio * adjustmentFactor;
            const diff = item.msciWeight - adjRatio;
            const mCapTrillion = item.marketCap > 0 ? item.marketCap / 10000 : 0;

            sumMsci += item.msciWeight;
            sumKospiMcap += item.marketCap;
            sumKospiAdjRatio += adjRatio;
            sumDiff += diff;

            const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
            const mCapDisplay = item.marketCap > 0 ? Math.round(item.marketCap / 10000) : "-";

            md += `| **${item.name}** | ${item.msciWeight.toFixed(2)} | ${mCapDisplay} | ${adjRatio.toFixed(2)} | **${diffStr}** |\n`;

            sheetsData.push({
                name: item.name,
                code: item.code,
                msciWeight: item.msciWeight,
                marketCapTrillion: mCapTrillion,
                adjustedRatio: adjRatio,
                diff,
            });
        }

        const totalDiffStr = sumDiff > 0.01 ? `+${sumDiff.toFixed(2)}` : sumDiff < -0.01 ? sumDiff.toFixed(2) : "0.00";
        const totalMcapTrillion = sumKospiMcap > 0 ? Math.round(sumKospiMcap / 10000) : "-";
        md += `| **합계** | **${sumMsci.toFixed(2)}** | **${totalMcapTrillion}** | **${sumKospiAdjRatio.toFixed(2)}** | **${totalDiffStr}** |\n\n`;

        // 분석 내용
        md += `## 💡 분석 내용 요약\n\n`;
        if (previousData) {
            const normalizeName = (name: string) =>
                name.replace("신한금융그룹", "신한지주").replace("KB 파이낸셜 그룹", "KB금융").replace("두산에너지", "두산에너빌리티").replace("현대자동차", "현대차");

            const oldItemsMap = new Map<string, any>();
            previousData.items.forEach((item: any) => oldItemsMap.set(normalizeName(item.name), item));

            const recommended = results
                .map((r) => ({ name: r.name, diff: r.msciWeight - r.kospiRatio * adjustmentFactor }))
                .filter((r) => r.diff >= 0.3)
                .sort((a, b) => b.diff - a.diff);

            const notRecommended = results
                .map((r) => ({ name: r.name, diff: r.msciWeight - r.kospiRatio * adjustmentFactor }))
                .filter((r) => r.diff <= -0.3)
                .sort((a, b) => a.diff - b.diff);

            md += `### 👍 투자 추천 종목\n`;
            if (recommended.length > 0) {
                md += `- MSCI 비율이 KOSPI 보정 비율보다 높은 종목: **${recommended.map((r) => `${r.name}(+${r.diff.toFixed(2)}%p)`).join(", ")}**\n`;
            } else {
                md += `- 현재 뚜렷한 추천 종목 없음\n`;
            }

            md += `\n### 👎 투자 비추천 종목\n`;
            if (notRecommended.length > 0) {
                md += `- MSCI 비율이 KOSPI 보정 비율보다 낮은 종목: **${notRecommended.map((r) => `${r.name}(${r.diff.toFixed(2)}%p)`).join(", ")}**\n`;
            } else {
                md += `- 현재 뚜렷한 비추천 종목 없음\n`;
            }
        } else {
            md += `*이전 조회 내역이 존재하지 않아 비교 분석은 다음 업데이트부터 제공됩니다.*\n`;
        }

        // 6. Supabase 저장
        const { error: insertError } = await supabase.from("study_boards").insert({
            topic: "msci",
            title: `MSCI KOREA INDEX (${dateOnly}) - Cron Auto`,
            content: md,
        });

        if (insertError) {
            console.error("[MSCI Cron] Supabase insert failed:", insertError.message);
        } else {
            console.log("[MSCI Cron] Supabase study_boards saved.");
        }

        // 7. Google Sheets 누적 저장
        let sheetsResult: { success: boolean; updatedRange?: string; error?: string } = { success: false, error: 'skipped' };
        try {
            sheetsResult = await appendMSCIToSheets(sheetsData, dateOnly);
            if (sheetsResult.success) {
                console.log(`[MSCI Cron] Google Sheets saved: ${sheetsResult.updatedRange}`);
            } else {
                console.warn(`[MSCI Cron] Google Sheets failed: ${sheetsResult.error}`);
            }
        } catch (e: any) {
            console.error("[MSCI Cron] Google Sheets error:", e.message);
            sheetsResult = { success: false, error: e.message };
        }

        return NextResponse.json({
            success: true,
            date: dateOnly,
            stocks: results.map((r) => ({
                name: r.name,
                code: r.code,
                msciWeight: r.msciWeight,
                marketCap: r.marketCap,
                adjustedRatio: (r.kospiRatio * adjustmentFactor).toFixed(2),
                diff: (r.msciWeight - r.kospiRatio * adjustmentFactor).toFixed(2),
            })),
            supabase_saved: !insertError,
            google_sheets: sheetsResult,
        });
    } catch (err: any) {
        console.error("[MSCI Cron] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
