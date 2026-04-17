import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getKsdinfoDividend, getEtfPrice } from "@/lib/kis/client";
import { fetchDividendDisclosures } from "@/lib/opendart";
import { GoogleGenerativeAI } from "@google/generative-ai";

import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // Vercel 실행 제한

function formatNumber(num: number): string {
    return num.toLocaleString('ko-KR');
}

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return dateStr || '-';
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        const adminEmails = ['tark202020@gmail.com', 'tark2020@naver.com'];
        if (authError || !user || !user.email || !adminEmails.includes(user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const userPrompt = body.prompt || '';

        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const todayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
        const displayDate = kstNow.toISOString().slice(0, 10);
        const displayTime = kstNow.toISOString().slice(11, 16);

        // 배당 이력: 최근 6개월 (벌크 조회 시 응답 크기 절감)
        const sixMonthsAgo = new Date(kstNow);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const fromDate = sixMonthsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작 (최적화 버전 - Bulk Dividend)`);

        // ====================================================================
        // 1. LLM Step 1: 사용자 프롬프트에서 필터 조건 추출
        // ====================================================================
        const apiKey = process.env.GEMINI_API_KEY || '';
        let includeKeywords = ['배당'];
        let excludeKeywords: string[] = [];
        let topLimit = 10;

        if (apiKey && userPrompt) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const extractPrompt = `넌 ETF 필터 설정 추출기야. 사용자의 프롬프트를 분석해서 반드시 순수 JSON 형태(문자열 블록 \`\`\`json 등이 없는 형태)로만 응답해.
형식: {"includeKeywords": ["키워드1", "키워드2"], "excludeKeywords": ["제외어1"], "topLimit": 10}
- 프롬프트에 포함되어야 할 종목 키워드(예: 배당, 리츠)를 includeKeywords 로 뽑아. 명시되지 않았다면 ["배당"]으로 해.
- 제외해야 하는 키워드(예: 커버드콜 제외 -> ["커버드콜", "커버드"])가 있다면 excludeKeywords 로 뽑아. 없으면 [].
- 상위 N개를 뽑으라는 지시(예: 상위 30개)가 있다면 topLimit을 그 숫자로 설정해. 단 최종 표시 상한은 10개이므로 topLimit은 최대 10.
- 사용자 프롬프트: ${userPrompt}`;
                const result = await model.generateContent(extractPrompt);
                const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const config = JSON.parse(text);
                if (config.includeKeywords && Array.isArray(config.includeKeywords)) includeKeywords = config.includeKeywords;
                if (config.excludeKeywords && Array.isArray(config.excludeKeywords)) excludeKeywords = config.excludeKeywords;
                if (typeof config.topLimit === 'number') topLimit = Math.min(config.topLimit, 10);
                console.log(`  [LLM] 파싱된 필터 설정:`, config);
            } catch (e) {
                console.error("  [LLM] 필터 추출 실패 (기본값 사용):", e);
            }
        }

        // ====================================================================
        // 2. all_stocks_master.json에서 ETF 후보군 전수 파싱 (API 호출 없음)
        //    → 제한 없이 100개든 500개든 전부 로컬에서 필터링
        // ====================================================================
        const ETF_BRANDS = [
            'KODEX', 'TIGER', 'KBSTAR', 'RISE', 'ARIRANG', 'HANARO', 'ACE', 'SOL',
            'TIMEFOLIO', 'PLUS', 'WOORI', 'KOSEF', '히어로즈', 'KOACT', 'BNK',
            'NAVIGATOR', '파워', 'KIWOOM', 'DAISHIN', 'TRUSTON', 'FOCUS', 'ITF',
            'UNICORN', 'WON', '신한', '마이다스', '에셋플러스', 'TREX', '1Q',
            'HK', 'VITA', '마이티', '더제이',
        ];

        let matchedEtfMap = new Map<string, string>(); // code -> name
        try {
            const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
            if (fs.existsSync(unifiedPath)) {
                const rawData = fs.readFileSync(unifiedPath, 'utf-8');
                const allStocks = JSON.parse(rawData);

                for (const stock of allStocks) {
                    if (!stock.name || !stock.symbol) continue;
                    const nameUpper = stock.name.toUpperCase();

                    // ETF 브랜드명 확인
                    const isEtf = ETF_BRANDS.some(brand => nameUpper.includes(brand.toUpperCase()));
                    if (!isEtf) continue;

                    // 포함 키워드 확인
                    if (includeKeywords.length > 0) {
                        const hasInclude = includeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
                        if (!hasInclude) continue;
                    }

                    // 제외 키워드 확인
                    if (excludeKeywords.length > 0) {
                        const hasExclude = excludeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
                        if (hasExclude) continue;
                    }

                    matchedEtfMap.set(stock.symbol, stock.name);
                }
            }
        } catch (error) {
            console.error("[에러] ETF 후보군 파싱 중 오류 발생:", error);
        }

        console.log(`  [2단계] ETF 후보군 전수 파싱: ${matchedEtfMap.size}개 (API 호출 없음)`);

        // ====================================================================
        // 3. 벌크 배당 조회: 1회 API 호출로 전체 배당 데이터 수집
        //    → sht_cd를 공백으로 보내면 전 종목 배당 데이터 반환
        //    → 로컬에서 ETF 코드와 교차 매칭
        // ====================================================================
        console.log(`  [3단계] 벌크 배당 데이터 조회 시작 (1회 API 호출)...`);

        interface DividendMatch {
            code: string;
            name: string;
            dividendAmount: number;
            dividendPayDate: string;
            recordDate: string;
        }

        const dividendMatches: DividendMatch[] = [];

        try {
            const allDividends = await getKsdinfoDividend({
                gb1: '0',
                f_dt: fromDate,
                t_dt: todayStr,
                sht_cd: '',  // 전체 종목 일괄 조회
            });

            console.log(`  [3단계] 벌크 배당 응답: ${allDividends.length}건`);

            // ETF 코드와 교차 매칭 → 종목별 최신 배당만 추출
            const etfDividendMap = new Map<string, any>();

            for (const d of allDividends) {
                const code = d.sht_cd || '';
                if (!matchedEtfMap.has(code)) continue; // ETF 후보가 아니면 스킵

                const amount = parseFloat(d.per_sto_divi_amt || '0');
                if (amount <= 0) continue;

                const recordDate = d.record_date || '';
                const existing = etfDividendMap.get(code);

                // 종목별 가장 최근 배당만 유지
                if (!existing || recordDate > existing.recordDate) {
                    etfDividendMap.set(code, {
                        code,
                        name: matchedEtfMap.get(code) || code,
                        dividendAmount: amount,
                        dividendPayDate: d.divi_pay_dt || recordDate,
                        recordDate,
                    });
                }
            }

            // Map → Array
            for (const [, match] of etfDividendMap) {
                dividendMatches.push(match);
            }

            // 배당금 높은 순 정렬 (가격 없이 배당금 기준 사전 정렬)
            dividendMatches.sort((a, b) => b.dividendAmount - a.dividendAmount);

        } catch (e) {
            console.error("  [3단계] 벌크 배당 조회 실패:", e);
        }

        console.log(`  [3단계] 배당 이력 매칭된 ETF: ${dividendMatches.length}개`);

        // ====================================================================
        // 4. 상위 후보만 가격 조회 (최대 20개 → API 20회)
        //    → 실시간 아니어도 OK: 전일 종가(stck_prpr) 사용
        //    → 가격 정보로 정확한 수익률 산출 후 최종 TOP 10 확정
        // ====================================================================
        const priceCheckLimit = Math.min(dividendMatches.length, 20);
        const priceCandidates = dividendMatches.slice(0, priceCheckLimit);

        console.log(`  [4단계] 상위 ${priceCandidates.length}개 ETF 가격 조회 시작...`);

        interface FinalEtfResult {
            code: string;
            name: string;
            price: number;
            dividendAmount: number;
            dividendPayDate: string;
            recordDate: string;
            yieldRate: number;
            frequency: string;
            virtualDividend: number;
        }

        const etfResults: FinalEtfResult[] = [];
        const priceChunkSize = 10;

        for (let i = 0; i < priceCandidates.length; i += priceChunkSize) {
            const chunk = priceCandidates.slice(i, i + priceChunkSize);
            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    try {
                        const etfData = await getEtfPrice(item.code);
                        if (!etfData || !etfData.stck_prpr) return null;

                        const price = parseInt(etfData.stck_prpr || '0');
                        if (price <= 0) return null;

                        const yieldRate = (item.dividendAmount / price) * 100;
                        const shares = Math.floor(10000000 / price);
                        const virtualDividend = shares * item.dividendAmount;

                        return {
                            code: item.code,
                            name: item.name,
                            price,
                            dividendAmount: item.dividendAmount,
                            dividendPayDate: item.dividendPayDate,
                            recordDate: item.recordDate,
                            yieldRate,
                            frequency: etfData.etf_dvdn_cycl || '-',
                            virtualDividend,
                        } as FinalEtfResult;
                    } catch (e) {
                        return null;
                    }
                })
            );
            chunkResults.forEach(res => { if (res) etfResults.push(res); });
            if (i + priceChunkSize < priceCandidates.length) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        // 수익률 높은 순 최종 정렬 → TOP N 추출 (최대 10)
        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);
        const finalTopEtfs = etfResults.slice(0, topLimit);

        console.log(`  [4단계] 최종 TOP ${finalTopEtfs.length}개 ETF 확정 (전체 유효: ${etfResults.length}개)`);

        // ====================================================================
        // 5. LLM Step 2: 프롬프트에 맞는 Markdown 렌더링
        // ====================================================================
        let markdown = '';
        if (apiKey && userPrompt && finalTopEtfs.length > 0) {
            console.log(`  [LLM] 사용자 프롬프트 기반 마크다운 작성 지시...`);
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const renderPrompt = `너는 전문 펀드 매니저 겸 애널리스트야. 사용자의 요청(프롬프트)과 백엔드 시스템이 실제 수집한 "제공된 ETF 데이터"를 결합하여 완벽한 마크다운 리포트를 작성해줘.
데이터 상의 금액 및 수치는 있는 그대로 포맷팅해서 작성해야 하며 절대 임의로 상상해서 쓰지 마.
데이터가 부족하면 있는 것만으로 작성해. 표는 사용자가 요청한 양식에 맞춰 그려줘.

[사용자 요청 프롬프트]:
${userPrompt}

[제공된 ETF 데이터 (상위 ${finalTopEtfs.length}개)]:
${JSON.stringify(finalTopEtfs.map(e => ({...e, virtualDividend: Math.round(e.virtualDividend)})), null, 2)}`;

                const response = await model.generateContent(renderPrompt);
                markdown = response.response.text();
            } catch (e) {
                console.error("  [LLM] 마크다운 렌더링 실패 (기본 양식 폴백):", e);
            }
        }

        // 폴백: LLM 실패 시 기본 마크다운 테이블
        if (!markdown) {
            markdown = `# 배당ETF\n> 📅 작성일시: ${displayDate} ${displayTime}\n\n`;
            if (finalTopEtfs.length > 0) {
                markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 배당주기 | 최근배당일 | 가상배당금 |\n|------|------|-----------|--------|--------|-----------|----------|\n`;
                for (const s of finalTopEtfs) {
                    const payDateFmt = formatDate(s.dividendPayDate || s.recordDate);
                    markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(s.dividendAmount)}원 (${payDateFmt}) | ${s.yieldRate.toFixed(2)}% | ${s.frequency} | ${formatDate(s.recordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
                }
            } else {
                markdown += `> 조회된 데이터가 없습니다.\n`;
            }
        }

        // 공시 정보 덧붙이기 (최종 TOP 10만 — API 절약)
        markdown += `\n\n---\n## 📋 배당 관련 공시\n\n`;
        let hasAnyDisclosure = false;
        for (const s of finalTopEtfs) {
            try {
                const disclosures = await fetchDividendDisclosures(s.code);
                if (disclosures.length > 0) {
                    hasAnyDisclosure = true;
                    markdown += `### ${s.name} (${s.code})\n`;
                    for (const d of disclosures) { markdown += `- ${d.date} | [${d.title}](${d.url})\n`; }
                    markdown += `\n`;
                }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 200));
        }
        if (!hasAnyDisclosure) markdown += `> 최근 12개월 내 "배당" 관련 최신 공시가 없습니다.\n`;
        markdown += `\n---\n*본 리포트는 KIS API 전일 종가 데이터를 기반으로 AI가 작성했습니다.*\n`;
        markdown += `*조회 범위: 전체 ETF ${matchedEtfMap.size}개 후보 중 배당 이력 ${dividendMatches.length}개 → 상위 ${finalTopEtfs.length}개 선별*\n`;

        // ====================================================================
        // 6. DB 저장
        // ====================================================================
        const title = `배당ETF_${displayDate} ${displayTime}`;
        const { error: insertError } = await supabase
            .from('study_boards')
            .insert({ topic: 'dividend', title, content: markdown });
        if (insertError) console.error('[배당ETF] 저장 실패:', insertError);

        return NextResponse.json({
            success: true,
            content: markdown,
            title,
            stats: {
                totalCandidates: matchedEtfMap.size,
                dividendMatched: dividendMatches.length,
                finalTop: finalTopEtfs.length,
            },
        });
    } catch (err: any) {
        console.error("API /study/generate-dividend-etf error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
