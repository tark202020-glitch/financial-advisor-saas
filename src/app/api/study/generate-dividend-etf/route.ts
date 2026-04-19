import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getKrxEtfDividendYield } from "@/lib/krxData";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30; // KRX 방식은 빠르므로 30초면 충분

function formatNumber(num: number): string {
    return num.toLocaleString('ko-KR');
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    // YYYY/MM/DD → YYYY-MM-DD
    if (dateStr.includes('/')) return dateStr.replace(/\//g, '-');
    // YYYYMMDD → YYYY-MM-DD
    if (dateStr.length === 8) return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    return dateStr;
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
        const displayDate = kstNow.toISOString().slice(0, 10);
        const displayTime = kstNow.toISOString().slice(11, 16);

        console.log(`\n▶ [배당ETF분석] 시작 (KRX 방식 — 고속 벌크 수집)`);

        // ====================================================================
        // 1. LLM Step 1: 사용자 프롬프트에서 필터 조건 추출
        // ====================================================================
        const apiKey = process.env.GEMINI_API_KEY || '';
        let includeKeywords: string[] = [];
        let excludeKeywords: string[] = [];
        let topLimit = 10;

        if (apiKey && userPrompt) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const extractPrompt = `넌 ETF 필터 설정 추출기야. 사용자의 프롬프트를 분석해서 반드시 순수 JSON 형태(문자열 블록 \`\`\`json 등이 없는 형태)로만 응답해.
형식: {"includeKeywords": ["키워드1", "키워드2"], "excludeKeywords": ["제외어1"], "topLimit": 10}
- 프롬프트에 포함되어야 할 종목 키워드(예: 미국, 리츠)를 includeKeywords 로 뽑아. 사용자가 특정 단어를 반드시 포함해야만 한다고 명시하지 않았다면 빈 배열 []로 해 (모든 ETF 대상).
- 제외해야 하는 키워드가 명시적으로 프롬프트에 있다면 excludeKeywords 로 뽑아. (예시: "리츠 종목은 제외해줘" -> ["리츠", "REITs"]). 사용자가 '제외'나 '빼달라'는 언급을 명확히 하지 않았다면 절대로 임의의 단어를 넣지 말고 무조건 무조건 빈 배열 []로 설정해.
- 상위 N개를 뽑으라는 지시(예: 상위 30개)가 있다면 topLimit을 그 숫자로 설정해. 단 최종 표시 상한은 10개이므로 topLimit은 최대 10.
- 사용자 프롬프트: ${userPrompt}`;
                const result = await model.generateContent(extractPrompt);
                const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const config = JSON.parse(text);
                if (config.includeKeywords && Array.isArray(config.includeKeywords)) includeKeywords = config.includeKeywords;
                if (config.excludeKeywords && Array.isArray(config.excludeKeywords)) excludeKeywords = config.excludeKeywords;
                if (typeof config.topLimit === 'number') topLimit = Math.min(config.topLimit, 10);
                console.log(`  [LLM] 파싱된 필터 설정:`, config);
            } catch (e) {
                console.error("  [LLM] 필터 추출 실패 (기본값 사용):", e);
            }
        }

        // ====================================================================
        // 2. KRX 데이터 기반 고속 배당수익률 산출 (API 2회 호출로 완료)
        // ====================================================================
        console.log(`  [2단계] KRX 벌크 데이터 수집 시작...`);

        const { results: finalTopEtfs, totalEtfs, dividendMatched, dataSource } = await getKrxEtfDividendYield({
            topLimit,
            includeKeywords,
            excludeKeywords,
        });

        console.log(`  [2단계] 완료 — 전체 ETF ${totalEtfs}개, 분배금 확인 ${dividendMatched}개, TOP ${finalTopEtfs.length}개 (데이터소스: ${dataSource})`);

        // ====================================================================
        // 3. LLM Step 2: 프롬프트에 맞는 Markdown 렌더링
        // ====================================================================
        let markdown = '';
        if (apiKey && userPrompt && finalTopEtfs.length > 0) {
            console.log(`  [LLM] 사용자 프롬프트 기반 마크다운 작성 지시...`);
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const renderPrompt = `너는 전문 펀드 매니저 겸 애널리스트야. 사용자의 요청(프롬프트)과 백엔드 시스템이 실제 수집한 "제공된 ETF 데이터"를 결합하여 완벽한 마크다운 리포트를 작성해줘.
데이터 상의 금액 및 수치는 있는 그대로 포맷팅해서 작성해야 하며 절대 임의로 상상해서 쓰지 마.
데이터가 부족하면 있는 것만으로 작성해. 표는 사용자가 요청한 양식에 맞춰 그려주되, 사용자가 헤더를 지정하지 않았다면 반드시 아래의 강제 마크다운 표 포맷을 엄수해줘.

[강제 마크다운 헤더 포맷]
| 종목 | 종가 | 연 배당금(최근지급) | 환산수익률 | 지급횟수 | 최근배당일 | 가상배당금 |

* 주의사항:
- "연 배당금(최근지급)" 칸에는 반드시 JSON의 annualDividend 금액과 latestDividend 금액을 조합하여 "[annualDividend]원 (최근 [latestDividend]원)" 문자열로 합쳐 명시해야 해.
- "환산수익률" 칸에는 yieldRate 치수를 O.OO% 포맷으로 표시해줘.

[사용자 요청 프롬프트]:
${userPrompt}

[제공된 ETF 데이터 (상위 ${finalTopEtfs.length}개)]:
${JSON.stringify(finalTopEtfs.map(e => ({
    ...e,
    annualDividend: Math.round(e.annualDividend),
    virtualDividend: Math.round(e.virtualDividend),
})), null, 2)}`;

                const response = await model.generateContent(renderPrompt);
                markdown = response.response.text();
            } catch (e) {
                console.error("  [LLM] 마크다운 렌더링 실패 (기본 양식 폴백):", e);
            }
        }

        // 폴백: LLM 실패 시 기본 마크다운 테이블
        if (!markdown) {
            markdown = `# 배당ETF\n> 📅 작성일시: ${displayDate} ${displayTime}\n\n`;
            if (finalTopEtfs.length > 0) {
                markdown += `| 종목 | 종가 | 연 배당금(최근지급) | 수익률 | 지급횟수 | 최근배당일 | 가상배당금 |\n|------|------|----------|--------|--------|-----------|----------|\n`;
                for (const s of finalTopEtfs) {
                    markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(Math.round(s.annualDividend))}원 (최근 ${formatNumber(Math.round(s.latestDividend))}원) | ${s.yieldRate.toFixed(2)}% | ${s.payoutCount}회 | ${formatDate(s.latestRecordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
                }
            } else {
                markdown += `> 조회된 데이터가 없습니다.\n`;
            }
        }

        markdown += `\n\n---\n*본 리포트는 KRX 정보데이터시스템 전일 종가 기준으로 AI가 작성했습니다.*\n`;
        markdown += `*데이터 소스: ${dataSource === 'KRX' ? 'KRX(한국거래소)' : '네이버 금융(폴백)'} | 전체 ETF ${totalEtfs}개 중 분배금 확인 ${dividendMatched}개 → 수익 상위 ${finalTopEtfs.length}개 선별*\n`;

        // ====================================================================
        // 4. DB 저장
        // ====================================================================
        const title = `배당ETF_${displayDate} ${displayTime}`;
        const { error: insertError } = await supabase
            .from('study_boards')
            .insert({ topic: 'dividend', title, content: markdown });
        if (insertError) console.error('[배당ETF] 저장 실패:', insertError);

        return NextResponse.json({
            success: true,
            content: markdown,
            title,
            stats: {
                totalCandidates: totalEtfs,
                dividendMatched,
                finalTop: finalTopEtfs.length,
                dataSource,
            },
        });
    } catch (err: any) {
        console.error("API /study/generate-dividend-etf error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
