import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure API key is set
const apiKey = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        console.error("[AI Advice] Missing GOOGLE_AI_API_KEY");
        return NextResponse.json({
            advice: [{
                id: 1,
                category: "시스템",
                text: "AI 분석 서비스의 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요."
            }]
        });
    }

    try {
        const body = await req.json();
        const { portfolio, totalValue } = body;

        // Safety check for data
        const safeTotalValue = isNaN(Number(totalValue)) ? 0 : Number(totalValue);
        const safePortfolio = Array.isArray(portfolio) ? portfolio.map(p => ({
            ...p,
            currentPrice: isNaN(Number(p.currentPrice)) ? 0 : Number(p.currentPrice),
            changeRate: isNaN(Number(p.changeRate)) ? 0 : Number(p.changeRate)
        })) : [];

        // Construct formatting instructions
        const prompt = `
        당신은 전문 투자 어드바이저입니다.
        고객의 포트폴리오를 분석하고, 실질적인 투자 조언을 제공합니다.
        제공된 데이터는 전체 포트폴리오 중 비중 3% 이상인 주요 종목만 포함되어 있습니다. 이 종목들만 분석하세요.

        **분석 우선순위 (중요한 순서대로 3~4개를 선별하여 조언):**

        0. **🚨 긴급 경고 (최우선)**: 입력 데이터에 'proximity' 필드가 있는 종목은 **반드시** 언급해야 합니다. 하한가 근접 시 "손절매 고려"나 "추가 하락 주의"를, 상한가 근접 시 "분할 매도"를 조언하세요. 절대 누락하지 마세요.
        1. **전일 대비 점검**: 전일 대비 큰 변동이 있는 종목에 대해 언급합니다.
        2. **목표가 알림**: 목표가와의 괴리율을 확인하고, 매매 시점에 대한 조언을 제공합니다.
        3. **섹터 밸런스**: 포트폴리오의 섹터 배분이 적절한지 분석합니다.
        4. **비중 경고**: 특정 종목이 포트폴리오의 30%를 초과하면 경고합니다.
        5. **배당 전략**: 배당주 비율을 확인하고, 배당 관련 조언을 제공합니다.
        6. **실행 제안**: 분석을 바탕으로 구체적인 실행 방안을 제안합니다 (반드시 포함).

        **말투 규칙:**
        - 전문가답고 신뢰감 있는 표준어 사용
        - 존댓말 사용 (~입니다, ~하세요, ~드립니다)
        - 핵심을 짧고 명확하게 전달
        - 근거가 있는 조언 (수치 기반)
        - 예시: "PM(필립모리스)이 목표가 대비 5% 이내입니다. 분할 매도를 고려해보세요."

        **입력 데이터:**
        총 자산 가치: ${safeTotalValue}
        포트폴리오: ${JSON.stringify(safePortfolio)}

        **출력 형식:**
        반드시 아래 JSON 형식으로 응답하세요:
        {
            "advice": [
                { "id": 1, "category": "시장점검", "text": "..." },
                { "id": 2, "category": "목표가", "text": "..." },
                ...
            ]
        }
        - category는 한글로 작성 (시장점검, 목표가, 비중조절, 배당, 해외주식, 실행제안 등)
        - 3~4개의 가장 중요한 조언만 선별하세요
        - 각 조언은 1~2문장으로 간결하게 작성하세요
        - "실행 제안" 카테고리는 반드시 포함하세요
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("[AI Advice] Gemini Response:", text); // Debug Log

        // Robust JSON Extraction
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        let adviceData;
        try {
            adviceData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[AI Advice] JSON Parse Error:", parseError, "Raw Text:", text);
            return NextResponse.json({
                advice: [{
                    id: 1,
                    category: "시스템",
                    text: "AI 분석 결과를 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                }]
            });
        }

        return NextResponse.json(adviceData);

    } catch (error: any) {
        console.error("[AI Advice] Internal Error:", error);
        return NextResponse.json({
            advice: [{
                id: 1,
                category: "시스템",
                text: `서버 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`
            }]
        }); // Return 200 with error advice to prevent client crash
    }
}
