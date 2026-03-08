import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || user.email !== 'tark202020@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "AI API key is missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // 최신 정보 접근을 위해 가능한 경우 구글 검색 툴을 활성화 (SDK 버전에 따라 지원 방식 상이, 우선 any로 회피)
        const modelObj: any = {
            model: "gemini-2.5-pro",
            tools: [{ googleSearch: {} }]
        };
        const model = genAI.getGenerativeModel(modelObj);

        const todayInfo = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
        const systemInstruction = `당신은 전문적인 금융 포트폴리오 관리자이자 데이터 분석가입니다.
[현재 날짜]: ${todayInfo}

**[매우 중요한 지시사항 - 반드시 지킬 것]**
1. 사용자가 요구하는 주식/ETF 시세 및 배당 기준일 정보는 임의로 지어내지(Hallucination) 마세요.
2. 당신이 가진 지식 또는 인터넷 검색 기능을 통해 **현재 날짜(${todayInfo}) 기준 가장 최신의 실제 데이터**로만 구성하세요.
3. 2023년이나 2024년의 구형 배당 기준일 정보를 출력하면 안 됩니다. 찾을 수 없는 정보라면 "정보 없음"으로 표기하세요.
4. 배당주 및 ETF 리스트를 엄선하여 마크다운 표 형식으로 작성하고, 전문가적인 코멘트를 추가하세요.`;

        const finalPrompt = `[현재 날짜]: ${todayInfo}\n위 날짜를 기준으로 가장 최신의 배당/시세 정보를 파악하여, 아래 사용자 요청을 완벽하게 수행한 마크다운 리포트를 작성하세요. 가상의 과거 데이터(2024년 포함) 표기는 절대 금지합니다.\n\n[사용자 요청]\n${prompt}`;

        const result = await model.generateContent(`${systemInstruction}\n\n${finalPrompt}`);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, content: text });

    } catch (err: any) {
        console.error("API /study/generate-dividend error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
