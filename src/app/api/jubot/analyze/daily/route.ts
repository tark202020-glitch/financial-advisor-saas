import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/analyze/daily
 * 
 * 일일 시장 브리핑 생성
 * - 뉴스 수집 API에서 데이터 가져와서 종합 브리핑 생성
 * - 시장 지수 데이터와 결합
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// 내부적으로 뉴스 수집 + 시장 데이터를 결합하여 브리핑 생성
async function fetchMarketData(baseUrl: string) {
    try {
        const res = await fetch(`${baseUrl}/api/market-extra`, { next: { revalidate: 0 } });
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn('[Jubot Daily] Market data fetch failed:', e);
    }
    return null;
}

async function fetchNewsAnalysis(baseUrl: string) {
    try {
        const res = await fetch(`${baseUrl}/api/jubot/collect/news`, { next: { revalidate: 0 } });
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn('[Jubot Daily] News fetch failed:', e);
    }
    return null;
}

export async function GET(request: NextRequest) {
    const baseUrl = request.nextUrl.origin;

    try {
        // 1. 뉴스 + 시장 데이터 병렬 수집
        const [newsResult, marketData] = await Promise.all([
            fetchNewsAnalysis(baseUrl),
            fetchMarketData(baseUrl),
        ]);

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'GOOGLE_AI_API_KEY가 설정되지 않았습니다'
            });
        }

        // 2. Gemini로 종합 브리핑 생성
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const newsContext = newsResult?.analysis
            ? JSON.stringify(newsResult.analysis)
            : '뉴스 데이터 없음';

        const marketContext = marketData
            ? JSON.stringify(marketData)
            : '시장 데이터 없음';

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);
        const hour = kstNow.getHours();
        const timeOfDay = hour < 12 ? '오전' : '오후';

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다.
        아래 데이터를 바탕으로 오늘(${dateStr} ${timeOfDay})의 시장 브리핑을 작성하세요.

        **시장 데이터:**
        ${marketContext}

        **뉴스 분석:**
        ${newsContext}

        **출력 형식 (JSON):**
        {
            "briefing_date": "${dateStr}",
            "time_of_day": "${timeOfDay}",
            "headline": "한줄 헤드라인 (20자 이내)",
            "market_overview": "시장 전반 동향 요약 (3-4문장)",
            "key_indices": [
                { "name": "KOSPI", "value": "숫자", "change": "+0.8%", "comment": "한마디 코멘트" }
            ],
            "top_stories": [
                {
                    "title": "핵심 뉴스 제목",
                    "summary": "1-2문장",
                    "impact": "positive/negative/neutral",
                    "related_stocks": ["종목명(코드)"]
                }
            ],
            "watchpoints": [
                "오늘 주목해야 할 포인트 1",
                "포인트 2"
            ],
            "jubot_opinion": "주봇의 종합 의견 (2-3문장, 전문가답게)"
        }

        - top_stories는 3~5개
        - key_indices에서 실제 숫자가 없으면 추정하지 마세요
        - 모든 텍스트는 한국어
        - JSON만 출력하세요 (마크다운 코드블록 없이)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse JSON
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const briefing = JSON.parse(jsonStr);

        return NextResponse.json({
            success: true,
            generated_at: new Date().toISOString(),
            briefing,
            raw_news_count: newsResult?.article_count || 0,
        });

    } catch (error: any) {
        console.error('[Jubot Daily] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
