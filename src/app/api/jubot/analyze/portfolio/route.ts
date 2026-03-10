import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/analyze/portfolio
 * 
 * 주봇 1.0: 포트폴리오 AI 분석 (재무 + 공시 + 배당 + 뉴스 + 거래기록 통합)
 * - OpenDART API 직접 호출로 재무 데이터 조회
 * - 뉴스 RSS 수집 및 전문가(박시동, 이광수) 우선 분석
 * - 거래기록(trades) 기반 리뷰 (0순위)
 * - 종합 AI 인사이트 생성
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// OpenDART — 2건씩 병렬 처리로 재무+배당 통합 조회
async function fetchFinancialData(symbols: string[]) {
    const { fetchCompanySummary } = await import('@/lib/opendart');
    const financialMap: Record<string, any> = {};
    const CHUNK_SIZE = 2; // DART API 레이트 리밋 고려

    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        const chunk = symbols.slice(i, i + CHUNK_SIZE);
        const results = await Promise.all(
            chunk.map(async (symbol) => {
                try {
                    const summary = await fetchCompanySummary(symbol);
                    return { symbol, summary };
                } catch (e) {
                    console.log(`[Jubot] DART 재무 조회 실패: ${symbol}`);
                    return { symbol, summary: null };
                }
            })
        );
        for (const { symbol, summary } of results) {
            if (summary) financialMap[symbol] = summary;
        }
        // 청크 간 딜레이 (레이트 리밋 방지)
        if (i + CHUNK_SIZE < symbols.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    return financialMap;
}

// 공시 데이터 — 2건씩 병렬 처리
async function fetchDisclosureData(symbols: string[]) {
    const { fetchDisclosures } = await import('@/lib/opendart');
    const disclosureMap: Record<string, any> = {};
    const CHUNK_SIZE = 2;

    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        const chunk = symbols.slice(i, i + CHUNK_SIZE);
        const results = await Promise.all(
            chunk.map(async (symbol) => {
                try {
                    const disc = await fetchDisclosures(symbol);
                    return { symbol, disc };
                } catch {
                    return { symbol, disc: null };
                }
            })
        );
        for (const { symbol, disc } of results) {
            if (disc) disclosureMap[symbol] = disc;
        }
        if (i + CHUNK_SIZE < symbols.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    return disclosureMap;
}

// 뉴스 수집 (직접 import — 자기 API 재호출 방지)
async function collectNewsDirectly() {
    const DEFAULT_RSS_SOURCES = [
        { name: '매일경제 증권', url: 'https://www.mk.co.kr/rss/40300001/' },
        { name: '연합뉴스 경제', url: 'https://www.yna.co.kr/rss/economy.xml' },
        { name: '인베스팅닷컴', url: 'https://kr.investing.com/rss/news.rss' },
    ];
    const EXPERT_NAMES = ['박시동', '이광수'];
    const allArticles: any[] = [];
    const expertArticles: any[] = [];

    for (const source of DEFAULT_RSS_SOURCES) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(source.url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JubotNewsCollector/1.0)' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const xml = await res.text();
                // 간단한 RSS 파싱
                const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
                let match;
                let count = 0;
                while ((match = itemRegex.exec(xml)) !== null && count < 10) {
                    const itemXml = match[1];
                    const getTag = (tag: string) => {
                        const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
                        const m = itemXml.match(tagRegex);
                        return (m?.[1] || m?.[2] || '').trim();
                    };
                    const title = getTag('title');
                    if (title) {
                        const description = getTag('description').replace(/<[^>]+>/g, '').slice(0, 300);
                        const fullText = `${title} ${description}`;
                        let isExpert = false;
                        let expertName: string | null = null;
                        for (const expert of EXPERT_NAMES) {
                            if (fullText.includes(expert)) {
                                isExpert = true;
                                expertName = expert;
                                break;
                            }
                        }
                        const article = { title, description, source: source.name, isExpert, expertName };
                        allArticles.push(article);
                        if (isExpert) expertArticles.push(article);
                        count++;
                    }
                }
                console.log(`  [뉴스] ${source.name}: ${count}개 수집`);
            }
        } catch (e: any) {
            const reason = e.name === 'AbortError' ? '타임아웃' : '네트워크 오류';
            console.log(`  [뉴스] ${source.name}: ${reason} (스킵)`);
        }
    }

    // 네이버 검색 API 뉴스 추가
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    if (naverClientId && naverClientSecret) {
        const queries = ['주식 증권 시장', '주식 투자 전망'];
        for (const query of queries) {
            try {
                const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=10&sort=date`;
                const res = await fetch(url, {
                    headers: {
                        'X-Naver-Client-Id': naverClientId,
                        'X-Naver-Client-Secret': naverClientSecret,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.items) {
                        for (const item of data.items) {
                            const cleanTitle = (item.title || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
                            const cleanDesc = (item.description || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').slice(0, 300);
                            const fullText = `${cleanTitle} ${cleanDesc}`;
                            let isExpert = false;
                            let expertName: string | null = null;
                            for (const expert of EXPERT_NAMES) {
                                if (fullText.includes(expert)) {
                                    isExpert = true;
                                    expertName = expert;
                                    break;
                                }
                            }
                            const article = { title: cleanTitle, description: cleanDesc, source: '네이버 검색', isExpert, expertName };
                            allArticles.push(article);
                            if (isExpert) expertArticles.push(article);
                        }
                    }
                }
            } catch {
                console.log(`  [뉴스] 네이버 검색 API 오류 (query=${query})`);
            }
        }
        console.log(`  [뉴스] 네이버 검색 API 추가 완료`);
    }

    return { articles: allArticles, expertArticles };
}

export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API 키 없음' });
        }

        const body = await request.json();
        const { assets, marketData, allAssetsSummary } = body;

        // 보유 종목이 없으면 빈 결과 반환
        if (!assets || assets.length === 0) {
            return NextResponse.json({
                success: true,
                analysis: {
                    portfolio_summary: '보유 종목이 없습니다.',
                    risk_level: 'low',
                    stock_insights: [],
                    sector_analysis: '',
                    overall_recommendation: '내 주식일지에 종목을 추가해주세요.',
                },
                financial_data_loaded: 0,
            });
        }

        // ── 국내 종목 필터링 (GOLD 제외 — DART 대상 아님) ──
        const domesticSymbols = assets
            .filter((a: any) => a.category === 'KR' && a.symbol)
            .map((a: any) => a.symbol);

        console.log(`[Jubot] 분석 시작: 총 ${assets.length}종목, 국내 ${domesticSymbols.length}종목`);

        // ── Phase 1+2+3 병렬: 재무+배당 | 공시 | 뉴스 동시 수집 ──
        const [financialMap, disclosureMap, newsResult] = await Promise.all([
            fetchFinancialData(domesticSymbols),
            fetchDisclosureData(domesticSymbols),
            collectNewsDirectly(),
        ]);

        const { articles: newsArticles, expertArticles } = newsResult;
        console.log(`[Jubot] 수집 완료: 재무 ${Object.keys(financialMap).length}건, 공시 ${Object.keys(disclosureMap).length}건, 뉴스 ${newsArticles.length}건`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const portfolioText = JSON.stringify(assets.map((a: any) => {
            const fin = financialMap[a.symbol] || null;
            const disc = disclosureMap[a.symbol] || null;
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
                // 배당 정보 (fetchCompanySummary에서 이미 수집된 dps 활용)
                dividend: fin?.dps ? {
                    dps: fin.dps,
                    totalDividend: fin.dps && a.quantity ? fin.dps * a.quantity : null,
                } : null,
                // 거래기록 포함
                trades: a.trades || [],
            };
        }));

        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kstNow.toISOString().slice(0, 10);

        const prompt = `
        당신은 '주봇'이라는 AI 주식 전문가입니다. 
        아래는 사용자의 **전체 보유 종목** 목록이며, 평가금액이 높은 순서로 정렬되어 있습니다.
        모든 종목에 대해 빠짐없이 분석해주세요.

        **분석 날짜:** ${dateStr}
        **포트폴리오 현황:** 총 ${allAssetsSummary?.totalCount || '?'}종목 보유
        ${allAssetsSummary?.zeroPrice?.length > 0 ? `**현재가 0원 종목:** ${allAssetsSummary.zeroPrice.join(', ')}` : ''}

        **전체 보유 종목 (재무+공시+배당 데이터 포함, 평가금액 순):**
        ${portfolioText}

        ${marketData ? `**시장 데이터:** ${JSON.stringify(marketData)}` : ''}

        ${newsArticles.length > 0 ? `**최근 뉴스 (종목 연관 분석용, ${newsArticles.length}개):**\n${newsArticles.slice(0, 15).map((a: any) => `- (${a.source}) ${a.title}`).join('\n')}` : ''}

        ${expertArticles.length > 0 ? `⭐ **전문가(박시동, 이광수) 기사 (우선 분석):**\n${expertArticles.map((a: any) => `- (${a.source}, ${a.expertName}) ${a.title}: ${a.description}`).join('\n')}` : ''}

        ⚠️ **분석 우선순위 (반드시 이 순서대로 분석):**

        📌 **0순위: 거래기록 리뷰 (최우선)**
        - 각 종목의 trades 데이터를 확인하여 최근 매수/매도 기록이 있으면 반드시 reason 첫 문장에 언급
        - 거래 타이밍이 적절했는지, 수익률 변화는 어떤지 해석
        - 반대로 매도 후 주가가 더 올랐다면 "조금 아쉬운 타이밍" 등 솔직하게 평가
        - 예시: "2/10 50주 매수(52,000원) → 현재가 기준 +3.8%. 매수 타이밍이 적절했습니다"
        - trades가 없는 종목은 이 항목 생략

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
                    "reason": "거래기록/공시/배당/재무 기반 근거 (2-3문장, 거래기록 > 공시 순서로 언급)",
                    "action": "구체적 날짜 포함 액션 조언",
                    "priority": "high/medium/low",
                    "trade_review": "최근 거래기록에 대한 평가 (trades가 있으면 작성, 없으면 null)",
                    "financial_highlight": "핵심 재무/공시/배당 포인트 1문장",
                    "upcoming_events": "향후 예상 공시/이벤트 일정",
                    "dividend_info": "배당 관련 정보",
                    "related_news": "관련 뉴스 요약 (1문장, 뉴스가 있으면 작성, 없으면 null)"
                }
            ],
            "sector_analysis": "업종 관련 코멘트 (1-2문장)",
            "overall_recommendation": "전체 권고사항 (2-3문장, 시기별 체크포인트 포함)"
        }

        규칙:
        - stock_insights에는 전달받은 **모든 종목을 빠짐없이** 포함 (평가금액 순서 유지)
        - trades 데이터가 있으면 trade_review에 반드시 작성하고 reason 첫 문장에 거래 타이밍 평가 포함
        - 공시 데이터가 있으면 reason에 반드시 공시 내용 언급
        - action은 절대 추상적 조언 금지 ("모니터링하세요" X → "3월 실적발표에서 영업이익 확인 후 -20% 손절 판단" O)
        - 배당금 총액 1만원 이상인 종목은 dividend_info에 금액과 일정 반드시 명시
        - ⭐ 전문가(박시동, 이광수) 관련 뉴스가 있으면 해당 종목의 related_news에 우선 반영
        - 모든 텍스트는 한국어, 전문가답게 간결하게
        - 금액 표기 시 원화는 소수점 없이(예: 1,234원), 달러는 소수점 2자리(예: $12.34)로 표기
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
