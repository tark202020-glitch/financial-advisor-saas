import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * /api/jubot/collect/news
 * 
 * 주봇 1.0 — 뉴스 수집 + AI 요약 파이프라인
 * - 매일경제 증권 RSS
 * - 연합뉴스 경제 RSS
 * - 네이버 경제 RSS (NEW)
 * - 인베스팅닷컴 한국 RSS (NEW)
 * 
 * 전문가 우선 노출: 박시동, 이광수
 */

const apiKey = process.env.GOOGLE_AI_API_KEY;

// 주목해야 할 전문가 목록
const EXPERT_NAMES = ['박시동', '이광수'];

// RSS 소스 정의 (주봇 1.0 기준)
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
    {
        name: '네이버 경제',
        url: 'https://rss.news.naver.com/economic.xml',
        type: 'rss'
    },
    {
        name: '인베스팅닷컴',
        url: 'https://kr.investing.com/rss/news.rss',
        type: 'rss'
    },
];

const MAX_ITEMS_PER_SOURCE = 10;

// RSS XML 파싱 (가벼운 정규식 기반)
function parseRSSItems(xml: string, sourceName: string): Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    source: string;
    isExpert: boolean;
    expertName: string | null;
}> {
    const items: Array<any> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < MAX_ITEMS_PER_SOURCE) {
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
            // 전문가 기사 판별
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

            items.push({ title, link, pubDate, description, source: sourceName, isExpert, expertName });
        }
    }

    return items;
}

// AI로 뉴스 요약 및 감성 분석
async function analyzeNewsWithAI(
    articles: Array<{ title: string; description: string; source: string }>,
    expertArticles: Array<{ title: string; description: string; source: string; expertName: string | null }>
) {
    if (!apiKey || articles.length === 0) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const newsText = articles.map((a, i) =>
        `[${i + 1}] (${a.source}) ${a.title}: ${a.description}`
    ).join('\n');

    const expertText = expertArticles.length > 0
        ? `\n\n⭐ **전문가 기사 (우선 분석 필수):**\n` + expertArticles.map((a, i) =>
            `[전문가${i + 1}] (${a.source}, ${a.expertName}) ${a.title}: ${a.description}`
        ).join('\n')
        : '';

    const prompt = `
    당신은 주식 시장 전문 분석가입니다.
    아래 오늘의 주요 증권 뉴스를 분석하여 투자자에게 유용한 시장 브리핑을 작성하세요.

    **뉴스 목록:**
    ${newsText}
    ${expertText}

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
        "expert_opinions": [
            {
                "expert_name": "전문가 이름",
                "title": "기사/칼럼 제목",
                "summary": "전문가 의견 요약 (1-2문장)",
                "source": "출처"
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

    규칙:
    - key_topics는 3~5개
    - related_symbols는 관련 종목코드 (한국: 6자리 숫자, 미국: 영문 티커)
    - ⭐ 전문가(박시동, 이광수) 기사가 있으면 expert_opinions에 반드시 포함하고, top_stories에도 우선 배치
    - 전문가 기사가 없으면 expert_opinions는 빈 배열 []
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
        const expertArticles: Array<any> = [];

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

                    // 전문가 기사 별도 분류
                    for (const item of items) {
                        if (item.isExpert) {
                            expertArticles.push(item);
                        }
                        allArticles.push(item);
                    }
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
                expert_articles: [],
                analysis: null
            });
        }

        // 2. AI 분석
        const analysis = await analyzeNewsWithAI(allArticles, expertArticles);

        // 3. 결과 반환
        return NextResponse.json({
            success: true,
            collected_at: new Date().toISOString(),
            article_count: allArticles.length,
            expert_count: expertArticles.length,
            articles: allArticles.slice(0, 30), // 최대 30개
            expert_articles: expertArticles,
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
