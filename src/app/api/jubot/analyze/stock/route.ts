import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

/**
 * /api/jubot/analyze/stock
 * 
 * Phase 2: 종목별 심층 AI 분석
 * - DART 재무 데이터 + 최근 뉴스 + 보유 현황을 종합 분석
 * - 개별 종목 1개에 대한 상세 인사이트 제공
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API 키 없음' });
        }

        const body = await request.json();
        const { symbol, name, category, currentPrice: clientPrice, avgPrice, quantity, targetPriceUpper, targetPriceLower } = body;

        if (!symbol || !name) {
            return NextResponse.json({ success: false, error: '종목 정보가 필요합니다' });
        }

        // 0. 현재가 서버 측 직접 조회 (클라이언트 값이 없거나 0인 경우 보완)
        let currentPrice = clientPrice || 0;
        if (!currentPrice || currentPrice === 0) {
            try {
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                let cleanSymbol = symbol;
                if (symbol.includes('.')) cleanSymbol = symbol.split('.')[0];

                const endpoint = category === 'US'
                    ? `${siteUrl}/api/kis/price/overseas/${cleanSymbol}`
                    : `${siteUrl}/api/kis/price/domestic/${cleanSymbol}`;

                const priceRes = await fetch(endpoint);
                if (priceRes.ok) {
                    const priceData = await priceRes.json();
                    if (category === 'US') {
                        currentPrice = parseFloat(priceData.last || priceData.base || priceData.clos || 0);
                    } else {
                        currentPrice = parseInt(priceData.stck_prpr || priceData.stck_sdpr || 0);
                    }
                }
            } catch (e) {
                console.warn(`[Jubot Stock] KIS price fetch failed for ${symbol}:`, e);
            }
        }

        // 1. DART 재무 데이터 조회 (국내 종목만)
        let financialData: any = null;
        let dividendData: any = null;

        if (category !== 'US') {
            try {
                const supabase = await createClient();

                const { data: company } = await supabase
                    .from('dart_companies')
                    .select('corp_code, corp_name')
                    .eq('stock_code', symbol)
                    .single();

                if (company) {
                    // 재무 데이터
                    const { data: financials } = await supabase
                        .from('dart_financials')
                        .select('*')
                        .eq('corp_code', company.corp_code)
                        .in('fs_div', ['CFS', 'OFS'])
                        .order('year', { ascending: false })
                        .limit(30);

                    // 배당 데이터
                    const { data: dividends } = await supabase
                        .from('dart_dividends')
                        .select('*')
                        .eq('corp_code', company.corp_code)
                        .order('year', { ascending: false })
                        .limit(10);

                    if (financials && financials.length > 0) {
                        const years = [...new Set(financials.map(f => f.year))].sort((a, b) => b - a);

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

                        const toOk = (v: number | null) => v ? Math.round(v / 100000000) : null;

                        // 최근 3개년 데이터
                        financialData = years.slice(0, 3).map(year => ({
                            year,
                            revenue_억: toOk(getValue(year, ['매출액', '수익'])),
                            operating_profit_억: toOk(getValue(year, ['영업이익'])),
                            net_income_억: toOk(getValue(year, ['당기순이익'])),
                            equity_억: toOk(getValue(year, ['자본총계'])),
                        }));
                    }

                    if (dividends && dividends.length > 0) {
                        const dpsItems = dividends.filter(d =>
                            d.stock_kind?.includes('보통주') && d.category?.includes('주당배당금')
                        );
                        dividendData = dpsItems.slice(0, 3).map(d => ({
                            year: d.year,
                            dps: d.value_current,
                        }));
                    }
                }
            } catch (e) {
                console.warn(`[Jubot Stock] DART fetch failed for ${symbol}:`, e);
            }
        }

        // 2. 최근 뉴스 수집 (간략하게 RSS 재수집)
        let relatedNews: string[] = [];
        try {
            const newsRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/jubot/collect/news`);
            const newsData = await newsRes.json();
            if (newsData.success && newsData.analysis?.key_topics) {
                relatedNews = newsData.analysis.key_topics
                    .filter((t: any) => t.related_symbols?.includes(symbol) || t.topic?.includes(name))
                    .map((t: any) => `${t.topic}: ${t.summary} (${t.sentiment})`);
            }
        } catch (e) {
            console.warn('[Jubot Stock] News fetch failed:', e);
        }

        // 3. AI 분석
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);

        const profitRate = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100).toFixed(1) : '0';

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다.
        아래 종목에 대해 심층 분석을 수행하세요.

        **분석 날짜:** ${dateStr}

        **종목 정보:**
        - 종목명: ${name} (${symbol})
        - 시장: ${category === 'US' ? '미국' : '한국'}
        - 현재가: ${currentPrice?.toLocaleString() || '미확인'}
        - 평균 매수가: ${avgPrice?.toLocaleString() || '미확인'}
        - 보유수량: ${quantity || 0}주
        - 수익률: ${profitRate}%
        - 상한 목표가: ${targetPriceUpper?.toLocaleString() || '미설정'}
        - 하한 목표가: ${targetPriceLower?.toLocaleString() || '미설정'}

        ${financialData ? `**재무 데이터 (단위: 억원):**\n${JSON.stringify(financialData, null, 2)}` : '**재무 데이터:** 해당 종목의 DART 재무 데이터 없음'}

        ${dividendData ? `**배당 이력:**\n${JSON.stringify(dividendData)}` : ''}

        ${relatedNews.length > 0 ? `**관련 뉴스:**\n${relatedNews.join('\n')}` : '**관련 뉴스:** 최근 관련 뉴스 없음'}

        **출력 형식 (JSON):**
        {
            "overall_signal": "buy/hold/sell/watch",
            "confidence": "high/medium/low",
            "summary": "종목에 대한 종합 평가 (3-4문장, 재무+시장 상황 근거)",
            "financial_analysis": {
                "revenue_trend": "매출 추이 분석 (1문장)",
                "profitability": "수익성 분석 (1문장)",
                "financial_health": "재무 건전성 평가 (1문장)"
            },
            "news_impact": "관련 뉴스가 종목에 미치는 영향 분석 (1-2문장, 뉴스 없으면 '최근 유의미한 뉴스 없음')",
            "risk_factors": ["리스크 요인 1", "리스크 요인 2"],
            "opportunity_factors": ["기회 요인 1", "기회 요인 2"],
            "target_price_opinion": "현재 설정된 목표가에 대한 의견 (1문장)",
            "action_plan": "구체적인 행동 계획 (2문장, 매수/매도 시점 제안)"
        }

        규칙:
        - 재무 데이터가 있으면 반드시 수치를 기반으로 분석
        - 재무 데이터가 없는 해외 종목은 공개 정보 기반 일반 분석
        - 목표가 근접도를 반영한 판단
        - 모든 텍스트는 한국어, 전문가답게 구체적으로
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
            symbol,
            name,
            current_price: currentPrice, // KIS API에서 조회한 실제 현재가
            generated_at: new Date().toISOString(),
            has_financial_data: !!financialData,
            has_news: relatedNews.length > 0,
            analysis,
            raw_financials: financialData,
            raw_dividends: dividendData,
        });

    } catch (error: any) {
        console.error('[Jubot Stock] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
