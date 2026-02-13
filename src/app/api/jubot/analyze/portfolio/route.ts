import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/analyze/portfolio
 * 
 * Phase 2: 포트폴리오 AI 분석 (재무 데이터 통합)
 * - OpenDART API 직접 호출로 재무 데이터(매출, 영업이익, ROE, 배당) 조회
 * - 최근 뉴스와의 종목 연관성 분석
 * - 종합 AI 인사이트 생성
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// OpenDART API 직접 호출로 재무 데이터 조회
async function fetchFinancialData(symbols: string[]) {
    const { fetchCompanySummary } = await import('@/lib/opendart');
    const financialMap: Record<string, any> = {};

    for (const symbol of symbols) {
        try {
            const summary = await fetchCompanySummary(symbol);
            if (summary) {
                financialMap[symbol] = summary;
            }
        } catch (e) {
            console.warn(`[Jubot] DART fetch failed for ${symbol}:`, e);
        }
    }

    return financialMap;
}

export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API 키 없음' });
        }

        const body = await request.json();
        const { assets, marketData, allAssetsSummary } = body;

        // 이슈 종목이 0건이면 빈 결과 반환 (AI 호출 불필요)
        if (!assets || assets.length === 0) {
            return NextResponse.json({
                success: true,
                analysis: {
                    portfolio_summary: `보유 ${allAssetsSummary?.totalCount || 0}개 종목에 특별한 이슈가 발견되지 않았습니다. 현재 포트폴리오는 안정적으로 유지되고 있습니다.`,
                    risk_level: 'low',
                    stock_insights: [],
                    sector_analysis: '현재 포트폴리오에 긴급한 업종 리스크는 없습니다.',
                    overall_recommendation: '특별한 이슈가 없으므로 기존 투자 전략을 유지하세요.',
                },
                financial_data_loaded: 0,
            });
        }

        // Phase 2: DART 재무 데이터 수집
        const domesticSymbols = assets
            .filter((a: any) => a.category !== 'US' && a.symbol)
            .map((a: any) => a.symbol);

        const financialMap = await fetchFinancialData(domesticSymbols);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const portfolioText = JSON.stringify(assets.map((a: any) => {
            const fin = financialMap[a.symbol] || null;
            return {
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
                // Phase 2: 재무 데이터 추가
                financials: fin ? {
                    year: fin.baseYear,
                    revenue_억: fin.revenue,
                    revenue_growth: fin.revenueGrowth ? `${fin.revenueGrowth}%` : null,
                    op_profit_억: fin.operatingProfit,
                    profit_growth: fin.profitGrowth ? `${fin.profitGrowth}%` : null,
                    roe: fin.roe ? `${fin.roe}%` : null,
                    dps: fin.dps,
                } : null,
            };
        }));

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다.
        아래는 사용자 포트폴리오에서 **주요 이슈가 감지된 종목만** 추출한 목록입니다.
        이 종목들만 집중 분석하세요.

        **분석 날짜:** ${dateStr}

        **전체 포트폴리오 현황:** 총 ${allAssetsSummary?.totalCount || '?'}종목 보유, 이슈 감지 ${allAssetsSummary?.issueCount || assets.length}종목
        ${allAssetsSummary?.zeroPrice?.length > 0 ? `**현재가 0원 종목:** ${allAssetsSummary.zeroPrice.join(', ')}` : ''}

        **이슈 종목 (재무 데이터 포함):**
        ${portfolioText}

        ${marketData ? `**시장 데이터:** ${JSON.stringify(marketData)}` : ''}

        **⚠️ 중요: 주요 이슈가 있는 종목만 선별하세요**
        아래 기준 중 하나 이상 해당하는 종목만 stock_insights에 포함하세요:
        1. 현재가가 0원 (거래 불가/상폐 의심) → signal: "sell", priority: "high"
        2. 손실률 -15% 초과 (심각한 손실) → priority: "high"
        3. 목표 상한가의 90% 이상 도달 (매도 타이밍) → signal: "sell" 또는 "watch"
        4. 목표 하한가 이하 하락 (손절 검토) → priority: "high"
        5. 수익률 +30% 초과 (차익실현 검토)
        6. 재무 데이터 급격 변동 (영업이익 적자 전환, 매출 -20% 이상 감소 등)
        7. 최근 뉴스 이슈 (newsCount > 0인 종목 중 시장 영향력 큰 이슈)
        
        해당 사항이 없는 종목은 제외하세요. 특별한 이슈가 없는 안정 보유 종목은 포함하지 마세요.

        **출력 형식 (JSON):**
        {
            "portfolio_summary": "전체 포트폴리오에 대한 종합 평가 (2-3문장, 재무 데이터 기반 분석 포함)",
            "risk_level": "low/medium/high",
            "stock_insights": [
                {
                    "symbol": "종목코드",
                    "name": "종목명",
                    "signal": "buy/hold/sell/watch",
                    "reason": "근거 설명 (재무 데이터 + 시장 상황 기반, 2-3문장)",
                    "action": "구체적 행동 제안",
                    "priority": "high/medium/low",
                    "financial_highlight": "핵심 재무 포인트 1문장 (예: 매출 성장률 15%, ROE 12.5%)"
                }
            ],
            "sector_analysis": "업종 분산 관련 코멘트 (1-2문장)",
            "overall_recommendation": "전체적인 권고사항 (2-3문장, 구체적으로)"
        }

        규칙:
        - stock_insights는 이슈가 있는 종목만 포함 (없으면 빈 배열)
        - financials 데이터가 있는 종목은 반드시 재무 분석을 reason에 반영
        - financial_highlight는 핵심 재무 수치 1개를 요약 (없으면 null)
        - signal은 재무 건전성 + 현재가 대비 목표가 + 시장 상황 종합 판단
        - priority가 high인 종목은 반드시 3개 이하
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
            financial_data_loaded: Object.keys(financialMap).length,
        });

    } catch (error: any) {
        console.error('[Jubot Portfolio] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
