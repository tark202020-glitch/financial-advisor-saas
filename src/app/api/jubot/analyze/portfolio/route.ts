import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/analyze/portfolio
 * 
 * 내 종목 AI 분석
 * - 포트폴리오 종목의 뉴스/재무 기반 분석
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API 키 없음' });
        }

        const body = await request.json();
        const { assets, marketData } = body;

        if (!assets || assets.length === 0) {
            return NextResponse.json({
                success: false,
                error: '포트폴리오 데이터가 없습니다'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const portfolioText = JSON.stringify(assets.map((a: any) => ({
            name: a.name,
            symbol: a.symbol,
            category: a.category,
            sector: a.sector,
            currentPrice: a.currentPrice,
            avgPrice: a.avgPrice,
            quantity: a.quantity,
            changeRate: a.changeRate,
            targetUpper: a.targetPriceUpper,
            targetLower: a.targetPriceLower,
            profitRate: a.avgPrice > 0
                ? ((a.currentPrice - a.avgPrice) / a.avgPrice * 100).toFixed(1)
                : '0',
        })));

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다.
        아래 사용자의 포트폴리오를 분석하여 종목별 인사이트를 제공하세요.

        **분석 날짜:** ${dateStr}

        **포트폴리오:**
        ${portfolioText}

        ${marketData ? `**시장 데이터:** ${JSON.stringify(marketData)}` : ''}

        **출력 형식 (JSON):**
        {
            "portfolio_summary": "전체 포트폴리오에 대한 종합 평가 (2-3문장)",
            "risk_level": "low/medium/high",
            "stock_insights": [
                {
                    "symbol": "종목코드",
                    "name": "종목명",
                    "signal": "buy/hold/sell/watch",
                    "reason": "근거 설명 (1-2문장)",
                    "action": "구체적 행동 제안",
                    "priority": "high/medium/low"
                }
            ],
            "sector_analysis": "업종 분산 관련 코멘트 (1문장)",
            "overall_recommendation": "전체적인 권고사항 (2문장)"
        }

        규칙:
        - stock_insights는 보유 종목 중 중요도가 높은 순서로 정렬
        - signal은 현재 상황에 맞는 판단
        - priority가 high인 종목은 반드시 3개 이하
        - 목표가 근접 종목은 priority: "high"
        - 모든 텍스트는 한국어, 전문가답게 간결하게
        - JSON만 출력 (마크다운 코드블록 없이)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const analysis = JSON.parse(jsonStr);

        return NextResponse.json({
            success: true,
            generated_at: new Date().toISOString(),
            analysis,
        });

    } catch (error: any) {
        console.error('[Jubot Portfolio] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
