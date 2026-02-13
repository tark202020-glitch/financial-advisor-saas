import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

/**
 * /api/jubot/analyze/portfolio
 * 
 * Phase 2: 포트폴리오 AI 분석 (재무 데이터 통합)
 * - DART 재무 데이터(매출, 영업이익, ROE, 배당) 조회
 * - 최근 뉴스와의 종목 연관성 분석
 * - 종합 AI 인사이트 생성
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// DART 재무 데이터 조회 (Supabase에서)
async function fetchFinancialData(symbols: string[]) {
    const supabase = await createClient();
    const financialMap: Record<string, any> = {};

    for (const symbol of symbols) {
        try {
            // 종목코드 → corp_code 매핑
            const { data: company } = await supabase
                .from('dart_companies')
                .select('corp_code, corp_name')
                .eq('stock_code', symbol)
                .single();

            if (!company) continue;

            // 재무 데이터 (최근 2년)
            const { data: financials } = await supabase
                .from('dart_financials')
                .select('*')
                .eq('corp_code', company.corp_code)
                .in('fs_div', ['CFS', 'OFS'])
                .order('year', { ascending: false })
                .limit(20);

            // 배당 데이터
            const { data: dividends } = await supabase
                .from('dart_dividends')
                .select('*')
                .eq('corp_code', company.corp_code)
                .order('year', { ascending: false })
                .limit(5);

            if (financials && financials.length > 0) {
                const years = [...new Set(financials.map(f => f.year))].sort((a, b) => b - a);
                const latestYear = years[0];

                const getValue = (year: number, keywords: string[]) => {
                    let item = financials.find(f =>
                        f.year === year && f.fs_div === 'CFS' &&
                        keywords.some(k => f.account_nm?.includes(k))
                    );
                    if (!item) {
                        item = financials.find(f =>
                            f.year === year && f.fs_div === 'OFS' &&
                            keywords.some(k => f.account_nm?.includes(k))
                        );
                    }
                    return item?.amount || null;
                };

                const revenue = getValue(latestYear, ['매출액', '수익']);
                const revenuePrev = getValue(latestYear - 1, ['매출액', '수익']);
                const profit = getValue(latestYear, ['영업이익']);
                const profitPrev = getValue(latestYear - 1, ['영업이익']);
                const netIncome = getValue(latestYear, ['당기순이익']);
                const equity = getValue(latestYear, ['자본총계']);

                const roe = netIncome && equity ? ((netIncome / equity) * 100).toFixed(1) : null;
                const revenueGrowth = revenue && revenuePrev && revenuePrev !== 0
                    ? (((revenue - revenuePrev) / Math.abs(revenuePrev)) * 100).toFixed(1) : null;
                const profitGrowth = profit && profitPrev && profitPrev !== 0
                    ? (((profit - profitPrev) / Math.abs(profitPrev)) * 100).toFixed(1) : null;

                // 배당
                const dpsItem = dividends?.find(d =>
                    d.year === latestYear && d.stock_kind?.includes('보통주') && d.category?.includes('주당배당금')
                );

                financialMap[symbol] = {
                    baseYear: latestYear,
                    revenue: revenue ? Math.round(revenue / 100000000) : null, // 억원
                    revenueGrowth,
                    operatingProfit: profit ? Math.round(profit / 100000000) : null,
                    profitGrowth,
                    netIncome: netIncome ? Math.round(netIncome / 100000000) : null,
                    roe,
                    dps: dpsItem?.value_current || null,
                };
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
        const { assets, marketData } = body;

        if (!assets || assets.length === 0) {
            return NextResponse.json({
                success: false,
                error: '포트폴리오 데이터가 없습니다'
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
        아래 사용자의 포트폴리오를 **재무 데이터를 포함하여** 분석하세요.

        **분석 날짜:** ${dateStr}

        **포트폴리오 (재무 데이터 포함):**
        ${portfolioText}

        ${marketData ? `**시장 데이터:** ${JSON.stringify(marketData)}` : ''}

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
        - stock_insights는 보유 종목 전체를 포함하되 중요도 순으로 정렬
        - financials 데이터가 있는 종목은 반드시 재무 분석을 reason에 반영
        - financial_highlight는 핵심 재무 수치 1개를 요약 (없으면 null)
        - signal은 재무 건전성 + 현재가 대비 목표가 + 시장 상황 종합 판단
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
