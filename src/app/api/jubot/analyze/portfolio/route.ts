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

        // Phase 2: DART 재무 데이터 + 공시 + 배당 수집
        const domesticSymbols = assets
            .filter((a: any) => a.category !== 'US' && a.symbol)
            .map((a: any) => a.symbol);

        const financialMap = await fetchFinancialData(domesticSymbols);

        // Phase 3: 공시 및 배당 데이터 수집
        const { fetchDisclosures, fetchDividends } = await import('@/lib/opendart');
        const disclosureMap: Record<string, any> = {};
        const dividendMap: Record<string, any> = {};

        for (const sym of domesticSymbols) {
            try {
                const [disc, div] = await Promise.all([
                    fetchDisclosures(sym),
                    fetchDividends(sym),
                ]);
                if (disc) disclosureMap[sym] = disc;
                if (div) dividendMap[sym] = div;
            } catch {
                // 개별 종목 실패 무시
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const portfolioText = JSON.stringify(assets.map((a: any) => {
            const fin = financialMap[a.symbol] || null;
            const disc = disclosureMap[a.symbol] || null;
            const div = dividendMap[a.symbol] || null;
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
                financials: fin ? {
                    year: fin.baseYear,
                    revenue_억: fin.revenue,
                    revenue_growth: fin.revenueGrowth ? `${fin.revenueGrowth}%` : null,
                    op_profit_억: fin.operatingProfit,
                    profit_growth: fin.profitGrowth ? `${fin.profitGrowth}%` : null,
                    roe: fin.roe ? `${fin.roe}%` : null,
                    dps: fin.dps,
                } : null,
                // 최근 공시 목록
                recentDisclosures: disc?.disclosures || [],
                // 배당 정보
                dividend: div ? {
                    year: div.year,
                    dps: div.dps,
                    payoutRatio: div.payoutRatio,
                    totalDividend: div.dps && a.quantity ? div.dps * a.quantity : null,
                } : null,
            };
        }));

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다. 
        아래는 사용자 포트폴리오에서 **주요 이슈가 감지된 종목** 목록입니다.

        **분석 날짜:** ${dateStr}
        **포트폴리오 현황:** 총 ${allAssetsSummary?.totalCount || '?'}종목 보유, 이슈 감지 ${allAssetsSummary?.issueCount || assets.length}종목
        ${allAssetsSummary?.zeroPrice?.length > 0 ? `**현재가 0원 종목:** ${allAssetsSummary.zeroPrice.join(', ')}` : ''}

        **이슈 종목 (재무+공시+배당 데이터 포함):**
        ${portfolioText}

        ${marketData ? `**시장 데이터:** ${JSON.stringify(marketData)}` : ''}

        ⚠️ **분석 우선순위 (반드시 이 순서대로 분석):**

        📌 **1순위: 공시 분석 및 향후 일정**
        - 각 종목의 recentDisclosures(최근 6개월 공시)를 분석하고, 주가에 크게 영향을 주는 공시가 있으면 반드시 reason에 언급
        - 예상되는 향후 공시 일정 (정기 보고서, 주총, 실적발표 등)이 있다면 action에 구체적 날짜와 함께 언급
        - 예시: "3월 중 2025년 사업보고서 공시 예정이니 재무제표 확인 필요"

        📌 **2순위: 배당 정보** 
        - dividend 데이터가 있는 종목은 배당금액(dps)과 보유수량 기반 예상 배당금(totalDividend)을 확인
        - 배당금 총액이 1만원 이상인 경우 반드시 action에 배당일정과 금액을 명시
        - 예시: "2025년 배당금 주당 2,000원, 보유 50주 기준 약 10만원 수령 예정 (배당기준일 확인 필요)"

        📌 **3순위: 구체적 액션 조언**
        - "언제" + "어떤 이벤트가 있을 예정이니" + "구체적으로 무엇을 확인/실행하세요" 형태로 작성
        - 추상적 조언 금지! 실제 행동 가능한 조언만 작성
        - 예시: "2월 말 4분기 실적 발표 예정이므로 영업이익 적자 지속 여부를 확인 후 손절 판단하세요"

        📌 **4순위: 가격/수익률 분석**
        - 기존: 현재가 0원, 손실 -15%, 목표가 근접, 수익 +30% 등

        **출력 형식 (JSON):**
        {
            "portfolio_summary": "전체 포트폴리오 종합 평가 (2-3문장)",
            "risk_level": "low/medium/high",
            "stock_insights": [
                {
                    "symbol": "종목코드",
                    "name": "종목명",
                    "signal": "buy/hold/sell/watch",
                    "reason": "공시/배당/재무 기반 근거 (2-3문장, 공시 내용 우선 언급)",
                    "action": "구체적 날짜 포함 액션 조언 (예: 'X월 X일 실적발표 확인하세요')",
                    "priority": "high/medium/low",
                    "financial_highlight": "핵심 재무/공시/배당 포인트 1문장",
                    "upcoming_events": "향후 예상 공시/이벤트 일정 (있으면 작성, 없으면 null)",
                    "dividend_info": "배당 관련 정보 (있으면 작성, 없으면 null)"
                }
            ],
            "sector_analysis": "업종 관련 코멘트 (1-2문장)",
            "overall_recommendation": "전체 권고사항 (2-3문장, 시기별 체크포인트 포함)"
        }

        규칙:
        - stock_insights에는 전달받은 이슈 종목만 포함 (추가 금지)
        - 공시 데이터가 있으면 reason 첫 문장에 반드시 공시 내용 언급
        - action은 절대 추상적 조언 금지 ("모니터링하세요" X → "3월 실적발표에서 영업이익 확인 후 -20% 손절 판단" O)
        - 배당금 총액 1만원 이상인 종목은 dividend_info에 금액과 일정 반드시 명시
        - upcoming_events는 향후 1-3개월 내 예상 이벤트 (정기보고서/주총/배당기준일 등)
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
