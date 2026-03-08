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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "AI API key is missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const systemInstruction = `당신은 전문적인 금융 포트폴리오 관리자이자 데이터 분석가입니다.
사용자의 지시사항에 맞춘 마크다운 형식의 깔끔한 리포트를 작성해 주세요. 
사용자가 표를 요구하면 반드시 마크다운 표 형식으로 응답해야 하며, 각 항목에 대한 전문가적 식견과 데이터 기반의 코멘트를 덧붙여주세요.`;

        const result = await model.generateContent(`${systemInstruction}\n\n[사용자 요청]\n${prompt}`);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, content: text });

    } catch (err: any) {
        console.error("API /study/generate-dividend error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
