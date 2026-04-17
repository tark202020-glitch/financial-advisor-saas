import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getDomesticPrice, getStockInfo } from "@/lib/kis/client";
import { fetchDividendDisclosures } from "@/lib/opendart";
import { GoogleGenerativeAI } from "@google/generative-ai";

function formatNumber(num: number): string {
    return num.toLocaleString('ko-KR');
}

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return dateStr || '-';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        const adminEmails = ['tark202020@gmail.com', 'tark2020@naver.com'];
        if (authError || !user || !user.email || !adminEmails.includes(user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const userPrompt = body.prompt || '';

        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const todayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
        const displayDate = kstNow.toISOString().slice(0, 10);
        const displayTime = kstNow.toISOString().slice(11, 16);

        const twoYearsAgo = new Date(kstNow);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const fromDate = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const rankFromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당분석] 시작 - 순위기간: ${rankFromDate}~${todayStr}, 배당이력: ${fromDate}~${todayStr}`);

        // ====================================================================
        // 1. LLM Step 1: Extract Config
        // ====================================================================
        const apiKey = process.env.GEMINI_API_KEY || '';
        let topLimit = 10;

        if (apiKey && userPrompt) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const extractPrompt = `넌 배당주 검색 설정 추출기야. 사용자의 프롬프트를 분석해서 반드시 순수 JSON 형태(문자열 블록 \`\`\`json 등이 없는 형태)로만 응답해.
형식: {"topLimit": 10}
- 상위 N개를 뽑으라는 지시(예: 배당 수익률 상위 30개)가 있다면 topLimit을 그 숫자로 설정해. 갯수 언급이 없으면 10. (최대 50)
- 사용자 프롬프트: ${userPrompt}`;
                const result = await model.generateContent(extractPrompt);
                const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const config = JSON.parse(text);
                if (typeof config.topLimit === 'number') topLimit = Math.min(config.topLimit, 50);
                console.log(`  [LLM] 파싱된 필터 설정:`, config);
            } catch (e) {
                console.error("  [LLM] 추출 실패 (기본 Limit 10 사용):", e);
            }
        }

        // ====================================================================
        // 2. 국내 주식 배당률 상위 (코스피만)
        // ====================================================================
        console.log(`  [1단계] 코스피 배당률 상위 조회 중...`);
        const stockRankings = await getDividendRateRanking({
            gb1: '1', upjong: '0001', gb2: '0', gb3: '2', f_dt: rankFromDate, t_dt: todayStr, gb4: '0'
        });

        const fetchTargetCount = Math.min(stockRankings.length, Math.max(topLimit * 1.5, 30)); 
        const candidates = stockRankings.slice(0, fetchTargetCount);

        // ====================================================================
        // 3. 실제 배당 이력 조회
        // ====================================================================
        const stockResults: any[] = [];
        for (const item of candidates) {
            if (stockResults.length >= topLimit) break;
            const code = item.sht_cd;

            let stockName = code;
            try {
                const stockInfo = await getStockInfo(code);
                if (stockInfo) stockName = stockInfo.prdt_abrv_name || stockInfo.prdt_name || code;
            } catch (e) {}

            await new Promise(r => setTimeout(r, 200));
            let actualDividends: any[] = [];
            try {
                actualDividends = await getKsdinfoDividend({ gb1: '0', f_dt: fromDate, t_dt: todayStr, sht_cd: code });
            } catch (e) {}

            if (!actualDividends || actualDividends.length === 0) continue;
            const sortedDividends = actualDividends.filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0).sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));
            if (sortedDividends.length === 0) continue;

            const latestDividend = sortedDividends[0];
            const actualDividendAmount = parseFloat(latestDividend.per_sto_divi_amt || '0');
            const dividendPayDate = latestDividend.divi_pay_dt || latestDividend.record_date || '';
            const recordDate = latestDividend.record_date || '';
            const dividendKind = latestDividend.divi_kind || '';

            const frequency = sortedDividends.length;
            const frequencyPerYear = Math.ceil(frequency / 2);

            await new Promise(r => setTimeout(r, 200));
            let price = 0;
            try {
                const priceData = await getDomesticPrice(code);
                if (priceData) price = parseInt(priceData.stck_prpr || '0');
            } catch (e) {}
            if (price <= 0) continue;

            const yieldRate = (actualDividendAmount / price) * 100;
            const virtualDividend = Math.floor(10000000 / price) * actualDividendAmount;

            stockResults.push({
                code, name: stockName, price,
                dividendAmount: actualDividendAmount,
                dividendPayDate, recordDate,
                yieldRate, dividendKind,
                virtualDividend, frequency, frequencyPerYear,
            });
        }

        stockResults.sort((a, b) => b.yieldRate - a.yieldRate);

        // ====================================================================
        // 4. LLM Step 2: Markdown Rendering
        // ====================================================================
        let markdown = '';
        if (apiKey && userPrompt && stockResults.length > 0) {
            console.log(`  [LLM] 사용자 프롬프트 기반 마크다운 작성 지시...`);
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const renderPrompt = `너는 전문 펀드 매니저 겸 애널리스트야. 사용자의 요청(프롬프트)과 백엔드 시스템이 실제 수집한 "제공된 주식 데이터"를 결합하여 완벽한 마크다운 리포트를 작성해줘.
표나 형식 등 명시된 요청이 있다면 반드시 맞춰서 작성하고, 제공된 데이터 내의 수치(종가, 주당배당금 등)를 절대로 마음대로 바꾸거나 상상해서 쓰지 마.
데이터가 부족하면 있는 것만으로 작성해.

[사용자 요청 프롬프트]:
${userPrompt}

[제공된 주식 데이터 (상위 ${topLimit}개)]:
${JSON.stringify(stockResults.map(s => ({...s, virtualDividend: Math.round(s.virtualDividend)})), null, 2)}`;
                
                const response = await model.generateContent(renderPrompt);
                markdown = response.response.text();
            } catch (e) {
                console.error("  [LLM] 마크다운 렌더링 실패 (기본 양식 폴백):", e);
            }
        }

        if (!markdown) {
            markdown = `# 배당주식\n> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n---\n\n`;
            if (stockResults.length > 0) {
                markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 횟수 | 최근배당일 | 가상배당금 |\n|------|------|-----------|--------|------|-----------|----------|\n`;
                for (const s of stockResults) {
                    markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(s.dividendAmount)}원 (${formatDate(s.dividendPayDate || s.recordDate)}) | ${s.yieldRate.toFixed(2)}% | ${s.frequencyPerYear}회/년 (${s.frequency}건) | ${formatDate(s.recordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
                }
            } else { markdown += `> 조회된 데이터가 없습니다.\n`; }
        }

        markdown += `\n---\n\n## 📋 배당 관련 공시\n\n`;
        let hasAnyDisclosure = false;
        for (const s of stockResults) {
            try {
                const disclosures = await fetchDividendDisclosures(s.code);
                if (disclosures.length > 0) {
                    hasAnyDisclosure = true;
                    markdown += `### ${s.name} (${s.code})\n`;
                    for (const d of disclosures) { markdown += `- ${d.date} | [${d.title}](${d.url})\n`; }
                    markdown += `\n`;
                }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 200));
        }

        if (!hasAnyDisclosure) markdown += `> 최근 12개월 내 "배당" 관련 공시가 없습니다.\n`;
        markdown += `\n---\n*본 리포트는 KIS API 실시간 데이터를 기반으로 AI가 작성했습니다.*\n`;

        // ====================================================================
        // 5. Supabase 저장
        // ====================================================================
        const title = `배당주식_${displayDate} ${displayTime}`;
        const { error: insertError } = await supabase.from('study_boards').insert({ topic: 'dividend', title, content: markdown });
        if (insertError) console.error('[배당분석] 저장 실패:', insertError);

        return NextResponse.json({ success: true, content: markdown, title, stats: { stocks: stockResults.length } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
