import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/collect/news
 * 
 * 뉴스 수집 + AI 요약 파이프라인
 * - 네이버 증권 뉴스 RSS
 * - 한국경제 RSS
 * - 사용자 추가 URL (향후)
 * 
 * Vercel Cron 또는 수동 호출
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// RSS 소스 정의 (2026-02 기준 실제 작동 확인된 소스)
const DEFAULT_RSS_SOURCES = [
    {
        name: '매일경제 증권',
        url: 'https://www.mk.co.kr/rss/40300001/',
        type: 'rss'
    },
    {
        name: '연합뉴스 경제',
        url: 'https://www.yna.co.kr/rss/economy.xml',
        type: 'rss'
    },
];

// RSS XML 파싱 (가벼운 정규식 기반)
function parseRSSItems(xml: string, sourceName: string): Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: string;
}> {
    const items: Array<any> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
        const itemXml = match[1];

        const getTag = (tag: string) => {
            const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
            const m = itemXml.match(tagRegex);
            return (m?.[1] || m?.[2] || '').trim();
        };

        const title = getTag('title');
        const link = getTag('link');
        const pubDate = getTag('pubDate');
        const description = getTag('description').replace(/<[^>]+>/g, '').slice(0, 300);

        if (title) {
            items.push({ title, link, pubDate, description, source: sourceName });
        }
    }

    return items;
}

// AI로 뉴스 요약 및 감성 분석
async function analyzeNewsWithAI(articles: Array<{ title: string; description: string; source: string }>) {
    if (!apiKey || articles.length === 0) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const newsText = articles.map((a, i) =>
        `[${i + 1}] (${a.source}) ${a.title}: ${a.description}`
    ).join('\n');

    const prompt = `
    당신은 주식 시장 전문 분석가입니다.
    아래 오늘의 주요 증권 뉴스를 분석하여 투자자에게 유용한 시장 브리핑을 작성하세요.

    **뉴스 목록:**
    ${newsText}

    **출력 형식 (JSON):**
    {
        "market_summary": "오늘 시장의 전반적인 분위기와 핵심 포인트를 2-3문장으로 요약",
        "key_topics": [
            {
                "topic": "주제명",
                "summary": "이 주제에 대한 1-2문장 요약",
                "sentiment": "positive 또는 negative 또는 neutral",
                "related_symbols": ["005930", "AAPL"]
            }
        ],
        "risk_alerts": ["주의해야 할 리스크 1", "리스크 2"],
        "opportunities": ["포착된 기회 1", "기회 2"],
        "source_articles": [
            {
                "title": "기사 제목",
                "source": "출처",
                "sentiment": "positive/negative/neutral"
            }
        ]
    }

    - key_topics는 3~5개
    - related_symbols는 관련 종목코드 (한국: 6자리 숫자, 미국: 영문 티커)
    - 모든 텍스트는 한국어
    - JSON만 출력하세요 (마크다운 코드블록 없이)
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse JSON
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('[Jubot News] AI analysis failed:', e);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const allArticles: Array<any> = [];

        // 1. Fetch from all RSS sources
        for (const source of DEFAULT_RSS_SOURCES) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const res = await fetch(source.url, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'JubotNewsCollector/1.0' }
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const xml = await res.text();
                    const items = parseRSSItems(xml, source.name);
                    allArticles.push(...items);
                }
            } catch (e) {
                console.warn(`[Jubot] Failed to fetch ${source.name}:`, e);
            }
        }

        if (allArticles.length === 0) {
            return NextResponse.json({
                success: false,
                error: '뉴스를 수집하지 못했습니다',
                articles: [],
                analysis: null
            });
        }

        // 2. AI 분석
        const analysis = await analyzeNewsWithAI(allArticles);

        // 3. 결과 반환 (DB 저장은 클라이언트 또는 별도 호출에서 처리)
        return NextResponse.json({
            success: true,
            collected_at: new Date().toISOString(),
            article_count: allArticles.length,
            articles: allArticles.slice(0, 20), // 최대 20개
            analysis
        });

    } catch (error: any) {
        console.error('[Jubot News] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
