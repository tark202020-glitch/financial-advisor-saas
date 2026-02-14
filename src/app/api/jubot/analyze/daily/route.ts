import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

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
        const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';

        // 0. 캐시 확인 (오늘 생성된 브리핑이 있는지)
        if (!forceRefresh) {
            try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // 한국 시간 기준 오늘 날짜 (YYYY-MM-DD)
                    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
                    const todayStr = kstNow.toISOString().slice(0, 10);
                    const startOfDay = `${todayStr}T00:00:00+09:00`;
                    const endOfDay = `${todayStr}T23:59:59+09:00`;

                    const { data: cached } = await supabase
                        .from('jubot_analysis')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('analysis_type', 'daily_briefing')
                        .gte('created_at', startOfDay) // UTC 변환은 Supabase가 처리하거나, ISO string 사용
                        // 간단하게 오늘 날짜의 데이터 중 최신 1개
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (cached) {
                        return NextResponse.json({
                            success: true,
                            generated_at: cached.created_at,
                            briefing: cached.content,
                            cached: true
                        });
                    }
                }
            } catch (cacheErr) {
                console.warn('[Jubot Daily] Cache check failed:', cacheErr);
            }
        }

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

        // 전문가 기사 컨텍스트 (주봇 1.0)
        const expertContext = newsResult?.expert_articles && newsResult.expert_articles.length > 0
            ? `\n\n⭐ **전문가(박시동, 이광수) 기사:**\n${JSON.stringify(newsResult.expert_articles)}`
            : '';

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
        ${expertContext}

        **출력 형식 (JSON):**
        {
            "briefing_date": "${dateStr}",
            "time_of_day": "${timeOfDay}",
            "headline": "한줄 헤드라인 (20자 이내)",
            "market_overview": "시장 전반 동향 요약 (3-4문장)",
            "key_indices": [
                { "name": "KOSPI", "value": "숫자", "change": "+0.8%", "comment": "한마디 코멘트" }
            ],
            "expert_opinions": [
                {
                    "expert_name": "전문가 이름",
                    "title": "기사/칼럼 제목",
                    "summary": "전문가 의견 요약 (1-2문장)",
                    "source": "출처"
                }
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

        규칙:
        - top_stories는 3~5개
        - key_indices에서 실제 숫자가 없으면 추정하지 마세요
        - ⭐ 전문가(박시동, 이광수) 기사가 있으면 expert_opinions에 반드시 포함하고 top_stories에도 우선 배치
        - 전문가 기사가 없으면 expert_opinions는 빈 배열 []
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

        // 3. DB 저장 (옵션)
        const saveToDb = request.nextUrl.searchParams.get('save') === 'true';
        let savedData = null;

        if (saveToDb) {
            try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();

                // Cron 실행 시에는 user가 없을 수 있음 -> 서비스 롤 사용 고려하거나
                // 현재 구조상 RLS 때문에 익명 저장이 어려울 수 있음.
                // 일단은 user 세션이 있어야 저장되는 구조이지만, Cron은 인증 헤더가 다름.
                // Vercel Cron은 Authorization 헤더를 통해 인증할 수 있음.
                // 여기서는 간단히, user가 없어도 저장을 시도하되, RLS 정책이 허용하는지 확인 필요.
                // *중요*: jubot_analysis 테이블의 RLS가 'authenticated'만 허용한다면 Cron에서 실패할 수 있음.
                // Cron 전용 User ID를 환경변수로 두거나, Service Role Key를 사용해야 함.
                // 이번 구현에서는 'user' 체크를 우회하고 Service Role을 사용하거나
                // 단순히 로직만 추가함 (Task 범위 고려).

                // *기존 코드 포맷 유지*
                // user가 있으면 user_id 사용, 없으면... 에러?
                // 일반적으로 Cron Job은 백엔드 로직이므로 Service Role Client가 필요함.
                // 하지만 createClient()는 쿠키 기반 클라이언트임.
                // 여기서는 일단 user check를 하고, 없다면 로그만 남기고 진행 (추후 고도화 필요).

                if (user) {
                    const { data, error } = await supabase
                        .from('jubot_analysis')
                        .insert({
                            user_id: user.id,
                            analysis_type: 'daily_briefing',
                            content: briefing,
                            data_sources: {
                                news_count: newsResult?.article_count || 0,
                                market_data: !!marketData
                            }
                        })
                        .select()
                        .single();

                    if (error) console.error('[Jubot Daily] DB Save Error:', error);
                    else savedData = data;
                } else {
                    console.warn('[Jubot Daily] No user session found. Skipping DB save for Cron.');
                    // TODO: Implement Service Role client for Cron jobs if needed.
                }

            } catch (dbError) {
                console.error('[Jubot Daily] DB Save Exception:', dbError);
            }
        }

        return NextResponse.json({
            success: true,
            generated_at: new Date().toISOString(),
            briefing,
            raw_news_count: newsResult?.article_count || 0,
            saved: savedData
        });

    } catch (error: any) {
        console.error('[Jubot Daily] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
