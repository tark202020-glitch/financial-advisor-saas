import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getDomesticIndexHistory } from '@/lib/kis/client';

const apiKey = process.env.GOOGLE_AI_API_KEY;

function formatAsKisDate(dateStr: string) {
    return dateStr.replace(/-/g, '');
}

/**
 * POST — Deep Research 작업 시작
 * Body: { startDate, endDate, summary, tradeSummary }
 */
export async function POST(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_AI_API_KEY 미설정' }, { status: 500 });
        }

        const body = await request.json();
        const { startDate, endDate, summary, tradeSummary } = body;

        if (!startDate || !endDate || !summary) {
            return NextResponse.json({ error: 'startDate, endDate, summary 필수' }, { status: 400 });
        }

        // 1. 코스피 지수 기간별 데이터 조회
        let kospiReturn: string = '조회 실패';
        let kospiStartPrice = 0;
        let kospiEndPrice = 0;
        try {
            const kisStart = formatAsKisDate(startDate);
            const kisEnd = formatAsKisDate(endDate);
            const kospiData = await getDomesticIndexHistory('0001', kisStart, kisEnd);

            if (kospiData && kospiData.length > 0) {
                // output2: bstp_nmix_prpr(지수 종가), stck_bsop_date(날짜)
                const sorted = [...kospiData].sort((a: any, b: any) =>
                    (a.stck_bsop_date || '').localeCompare(b.stck_bsop_date || '')
                );
                kospiStartPrice = parseFloat(sorted[0].bstp_nmix_prpr || sorted[0].bstp_nmix_prpr_2 || '0');
                kospiEndPrice = parseFloat(sorted[sorted.length - 1].bstp_nmix_prpr || sorted[sorted.length - 1].bstp_nmix_prpr_2 || '0');

                if (kospiStartPrice > 0) {
                    const ret = ((kospiEndPrice - kospiStartPrice) / kospiStartPrice * 100).toFixed(2);
                    kospiReturn = `${ret}% (${kospiStartPrice.toFixed(2)} → ${kospiEndPrice.toFixed(2)})`;
                }
            }
        } catch (e: any) {
            console.error('[AI Comment] KOSPI fetch error:', e.message);
        }

        // 2. Deep Research 프롬프트 구성
        const prompt = `
당신은 한국의 전문 투자 분석가입니다.
아래 데이터는 개인 투자자의 ${startDate} ~ ${endDate} 기간 포트폴리오 리포트 요약입니다.

## 포트폴리오 성과 요약
- 기간 순수익금: ${summary.pureProfit}원
- 기간 수익률: ${summary.returnRate}%
- 추가 투입금(기간 중 순입금): ${summary.periodInvestmentChange}원
- 기간 총 변동(평가금 변화): ${summary.periodTotalChange}원
- 시작일 투자금: ${summary.startInvestment}원 / 평가금: ${summary.startValuation}원
- 종료일 투자금: ${summary.endInvestment}원 / 평가금: ${summary.endValuation}원

## 동 기간 코스피 지수 변동
- 코스피 수익률: ${kospiReturn}

## 기간 내 매매 내역 요약
- 총 매수액: ${tradeSummary?.totalBuy || 0}원
- 총 매도액: ${tradeSummary?.totalSell || 0}원
- 총 배당금: ${tradeSummary?.totalDividend || 0}원
- 총 거래 건수: ${tradeSummary?.tradeCount || 0}건

## 분석 요청
다음 항목을 포함하여 **한국어로** 깊이 있는 투자 분석 보고서를 작성해주세요:

### 1. 코스피 벤치마크 대비 성과 분석
- 포트폴리오 수익률과 코스피 수익률을 비교 분석
- 초과수익(알파) 또는 부진한 구간에 대한 원인 추정
- 2025년~2026년 한국 주식시장 동향과의 연관성

### 2. 매매 전략 리뷰 및 조언
- 매수/매도 금액의 비율과 타이밍에 대한 평가
- 추가 투자금 투입 전략에 대한 조언
- 분산 투자, 리밸런싱 관점의 제언

### 3. 리스크 평가
- 현재 포트폴리오의 잠재적 리스크 요인
- 시장 환경 변화에 따른 대응 전략

### 4. 향후 실행 제안 (Action Items)
- 구체적이고 실행 가능한 3~5개의 조언
- 각 조언에 우선순위(높음/중간/낮음) 부여

보고서는 전문적이면서도 개인 투자자가 이해하기 쉬운 언어로 작성해주세요.
`;

        // 3. Deep Research 에이전트 시작
        const client = new GoogleGenAI({ apiKey });
        const initialInteraction = await client.interactions.create({
            input: prompt,
            agent: 'deep-research-preview-04-2026',
            background: true,
        });

        console.log(`[AI Comment] Deep Research started. ID: ${initialInteraction.id}`);

        return NextResponse.json({
            interactionId: initialInteraction.id,
            kospiReturn,
            kospiStartPrice,
            kospiEndPrice,
        });

    } catch (error: any) {
        console.error('[AI Comment] POST error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET — Deep Research 결과 polling
 * Query: interactionId
 */
export async function GET(request: NextRequest) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_AI_API_KEY 미설정' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const interactionId = searchParams.get('interactionId');

        if (!interactionId) {
            return NextResponse.json({ error: 'interactionId 필수' }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });
        const interaction = await client.interactions.get(interactionId);

        console.log(`[AI Comment] Poll status: ${interaction.status}`);

        if (interaction.status === 'completed') {
            const outputs = interaction.outputs || [];
            // outputs 요소가 TextContent | ImageContent union이므로 안전하게 text 추출
            const lastOutput = outputs.length > 0 ? outputs[outputs.length - 1] : null;
            const report = lastOutput ? (lastOutput as any).text || '' : '';
            return NextResponse.json({ status: 'completed', report });
        } else if (interaction.status === 'failed' || interaction.status === 'cancelled') {
            return NextResponse.json({ status: 'failed', report: null });
        } else {
            // still running
            return NextResponse.json({ status: 'running', report: null });
        }

    } catch (error: any) {
        console.error('[AI Comment] GET error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
