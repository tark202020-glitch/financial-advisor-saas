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

        // 배당 이력: 최근 1년 (TTM 기준 실제 연간 실지급 배당금의 총합 연산)
        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const fromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작 (최적화 버전 - Bulk Dividend)`);

        // ====================================================================
        // 1. LLM Step 1: 사용자 프롬프트에서 필터 조건 추출
        // ====================================================================
        const apiKey = process.env.GEMINI_API_KEY || '';
        let includeKeywords: string[] = [];
        let excludeKeywords: string[] = [];
        let topLimit = 10;

        if (apiKey && userPrompt) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const extractPrompt = `넌 ETF 필터 설정 추출기야. 사용자의 프롬프트를 분석해서 반드시 순수 JSON 형태(문자열 블록 \`\`\`json 등이 없는 형태)로만 응답해.
형식: {"includeKeywords": ["키워드1", "키워드2"], "excludeKeywords": ["제외어1"], "topLimit": 10}
- 프롬프트에 포함되어야 할 종목 키워드(예: 미국, 리츠)를 includeKeywords 로 뽑아. 사용자가 특정 단어를 반드시 포함해야만 한다고 명시하지 않았다면 빈 배열 []로 해 (모든 ETF 대상).
- 제외해야 하는 키워드가 명시적으로 프롬프트에 있다면 excludeKeywords 로 뽑아. (예시: "리츠 종목은 제외해줘" -> ["리츠", "REITs"]). 사용자가 '제외'나 '빼달라'는 언급을 명확히 하지 않았다면 절대로 임의의 단어를 넣지 말고 무조건 무조건 빈 배열 []로 설정해.
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
        // 2. all_stocks_master.json에서 ETF 후보군 필터링 (불필요한 파생 제거)
        // ====================================================================
        const ETF_BRANDS = [
            'KODEX', 'TIGER', 'KBSTAR', 'RISE', 'ARIRANG', 'HANARO', 'ACE', 'SOL',
            'TIMEFOLIO', 'PLUS', 'WOORI', 'KOSEF', '히어로즈', 'KOACT', 'BNK',
            'NAVIGATOR', '파워', 'KIWOOM', 'DAISHIN', 'TRUSTON', 'FOCUS', 'ITF',
            'UNICORN', 'WON', '신한', '마이다스', '에셋플러스', 'TREX', '1Q',
            'HK', 'VITA', '마이티', '더제이',
        ];

        // 배당이 거의 없는 파생/상품 ETF 키워드
        const JUNK_KEYWORDS = ['레버리지', '인버스', '선물', 'VIX', '2X', '블룸버그', '원유', '천연가스', '금선물', '은선물', '구리', '농산물', '콩', '달러', '엔선물', '유로'];

        let matchedEtfs: { code: string, name: string }[] = [];
        try {
            const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
            if (fs.existsSync(unifiedPath)) {
                const rawData = fs.readFileSync(unifiedPath, 'utf-8');
                const allStocks = JSON.parse(rawData);

                for (const stock of allStocks) {
                    if (!stock.name || !stock.symbol) continue;
                    const nameUpper = stock.name.toUpperCase();

                    const isEtf = ETF_BRANDS.some(brand => nameUpper.includes(brand.toUpperCase()));
                    if (!isEtf) continue;

                    // 파생상품 등 배당 무관 종목 가지치기
                    const isJunk = JUNK_KEYWORDS.some(kw => nameUpper.includes(kw));
                    if (isJunk) continue;

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

                    matchedEtfs.push({ code: stock.symbol, name: stock.name });
                }
            }
        } catch (error) {
            console.error("[에러] ETF 후보군 파싱 중 오류 발생:", error);
        }

        console.log(`  [2단계] 파생 제외 후 순수 ETF 후보군 파싱: ${matchedEtfs.length}개`);

        // ====================================================================
        // 3. 고속 개별 배당 이력 스캔 (Concurrent Scan)
        //    -> rateLimiter (16 req/sec) 를 통해 전체 종목 빠르게 배당 여부만 확인
        // ====================================================================
        console.log(`  [3단계] ${matchedEtfs.length}개 종목 고속 배당 조회 시작...`);

        interface DividendResult {
            code: string;
            name: string;
            dividendAmount: number;
            latestDividend: number;
            payoutCount: number;
            dividendPayDate: string;
            recordDate: string;
        }

        const dividendMatches: DividendResult[] = [];
        
        // KSD API의 엄격한 Rate Limit(초당 N건) 및 한 페이지 반환 개수 제한을 우회하기 위해,
        // 1년 치를 1개월 단위 12개 청크로 쪼개어 순차적 벌크 스캔(sht_cd: '')을 실행합니다.
        const bulkDividends: any[] = [];
        let currentDate = new Date(oneYearAgo);
        const endDate = new Date(kstNow);

        const monthChunks = [];
        while (currentDate <= endDate) {
            const chunkEnd = new Date(currentDate);
            chunkEnd.setMonth(chunkEnd.getMonth() + 1);
            if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());
            
            monthChunks.push({
                f_dt: currentDate.toISOString().slice(0, 10).replace(/-/g, ''),
                t_dt: chunkEnd.toISOString().slice(0, 10).replace(/-/g, ''),
            });
            
            currentDate = new Date(chunkEnd);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log(`  [3단계] 병목 방지를 위해 1달 단위 ${monthChunks.length}개 청크로 벌크 스캔 시작...`);
        for (const chunk of monthChunks) {
            try {
                const res = await getKsdinfoDividend({
                    gb1: '0',
                    f_dt: chunk.f_dt,
                    t_dt: chunk.t_dt,
                    sht_cd: '', // 전체 종목
                });
                if (res && Array.isArray(res)) bulkDividends.push(...res);
                await new Promise(r => setTimeout(r, 150)); // KSD API 요금제 한도 보호를 위한 안전 지연
            } catch (e) {
                console.error(`KSD Bulk Error for ${chunk.f_dt}:`, e);
            }
        }

        // 인메모리 매핑
        const dividendMap = new Map<string, any[]>();
        for (const record of bulkDividends) {
            const code = record.sht_cd;
            if (code) {
                if (!dividendMap.has(code)) dividendMap.set(code, []);
                dividendMap.get(code)!.push(record);
            }
        }

        for (const item of matchedEtfs) {
            const actualDividends = dividendMap.get(item.code) || [];
            if (actualDividends.length === 0) continue;
            
            const sortedDiv = actualDividends
                .filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0)
                .sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));
            
            if (sortedDiv.length === 0) continue;

            const totalAnnualDividend = sortedDiv.reduce((sum: number, d: any) => sum + parseFloat(d.per_sto_divi_amt || '0'), 0);
            const latest = sortedDiv[0];
            
            dividendMatches.push({
                code: item.code,
                name: item.name,
                dividendAmount: totalAnnualDividend,
                latestDividend: parseFloat(latest.per_sto_divi_amt || '0'),
                payoutCount: sortedDiv.length,
                dividendPayDate: latest.divi_pay_dt || latest.record_date || '',
                recordDate: latest.record_date || '',
            } as DividendResult);
        }

        console.log(`  [3단계] 실제 배당 이력 매핑이 확인된 ETF: ${dividendMatches.length}개`);

        // 전체 배당 이력이 확인된 ETF를 대상으로 가격을 모두 조회해야만 정확한 시가배당률을 구할 수 있음
        const priceCandidates = dividendMatches;

        // ====================================================================
        // 4. 추려진 상위 후보군 현재가(전일가) 조회 및 최종 수익률 산출
        // ====================================================================
        console.log(`  [4단계] 상위 ${priceCandidates.length}개 ETF 가격 조회 시작...`);

        interface FinalEtfResult {
            code: string;
            name: string;
            price: number;
            dividendAmount: number;
            latestDividend: number;
            dividendPayDate: string;
            recordDate: string;
            yieldRate: number;
            frequency: string;
            virtualDividend: number;
        }

        const etfResults: FinalEtfResult[] = [];
        const priceChunkSize = 20;

        for (let i = 0; i < priceCandidates.length; i += priceChunkSize) {
            const chunk = priceCandidates.slice(i, i + priceChunkSize);
            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    try {
                        const etfData = await getEtfPrice(item.code);
                        if (!etfData || !etfData.stck_prpr) return null;

                        const price = parseInt(etfData.stck_prpr || '0');
                        if (price <= 0) return null;

                        let annualDiv = item.dividendAmount;
                        const cycleStr = etfData.etf_dvdn_cycl || '';
                        const cycle = parseInt(cycleStr.replace(/[^0-9]/g, ''));
                        
                        // 연환산(Annualized) 로직: 상장된 지 1년이 안 되어 실제 지급 횟수가 연간 기대 횟수보다 부족한 경우 보정
                        if (!isNaN(cycle) && cycle > 0 && cycle <= 12) {
                            const expectedPayouts = Math.floor(12 / cycle);
                            if (item.payoutCount > 0 && item.payoutCount < expectedPayouts) {
                                const avgPayout = item.dividendAmount / item.payoutCount;
                                annualDiv = avgPayout * expectedPayouts;
                            }
                        } else {
                             // 분배주기가 불명확하나 종목명에 명백한 '월배당' 속성이 있는 경우 12회 지급으로 예상 연환산
                             if ((item.name.includes('월배당') || item.name.includes('프리미엄') || item.name.includes('커버드')) && item.payoutCount < 12) {
                                 const avgPayout = item.dividendAmount / item.payoutCount;
                                 annualDiv = avgPayout * 12;
                             }
                        }

                        const yieldRate = (annualDiv / price) * 100;
                        const shares = Math.floor(10000000 / price);
                        const virtualDividend = shares * annualDiv;

                        return {
                            code: item.code,
                            name: item.name,
                            price,
                            dividendAmount: annualDiv, // 연환산 보정된 최종 연금을 UI 표출에 사용
                            latestDividend: item.latestDividend,
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
        }

        // 수익률 높은 순 최종 정렬 → TOP N 추출 (최대 10)
        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);
        const finalTopEtfs = etfResults.slice(0, topLimit);

        console.log(`  [4단계] 최종 TOP ${finalTopEtfs.length}개 ETF 확정 (현재가 유효: ${etfResults.length}개)`);

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
데이터가 부족하면 있는 것만으로 작성해. 표는 사용자가 요청한 양식에 맞춰 그려주되, 사용자가 헤더를 지정하지 않았다면 반드시 아래의 강제 마크다운 표 포맷을 엄수해줘.

[강제 마크다운 헤더 포맷]
| 종목 | 종가 | 연 배당금(최근지급) | 환산수익률 | 배당주기 | 최근배당일 | 가상배당금 |

* 주의사항:
- "연 배당금(최근지급)" 칸에는 반드시 JSON의 dividendAmount 금액과 latestDividend 금액을 조합하여 "[dividendAmount]원 (최근 [latestDividend]원)" 문자열로 합쳐 명시해야 해.
- "환산수익률" 칸에는 yieldRate 치수를 O.OO% 포맷으로 표시해줘.

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
                markdown += `| 종목 | 종가 | 연 배당금 | 수익률 | 배당주기 | 최근배당일 | 가상배당금 |\n|------|------|----------|--------|--------|-----------|----------|\n`;
                for (const s of finalTopEtfs) {
                    const payDateFmt = formatDate(s.dividendPayDate || s.recordDate);
                    markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(s.dividendAmount)}원 (최근 ${formatNumber(s.latestDividend)}원) | ${s.yieldRate.toFixed(2)}% | ${s.frequency} | ${formatDate(s.recordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
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
        markdown += `\n---\n*본 리포트는 전수 검색을 통한 KIS API 전일 종가 기반으로 AI가 작성했습니다.*\n`;
        markdown += `*조회 범위: 전체 ETF ${matchedEtfs.length}개 후보 중 실제 배당 확인 ${dividendMatches.length}개 → 수익 산출 상위 ${finalTopEtfs.length}개 선별*\n`;

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
                totalCandidates: matchedEtfs.length,
                dividendMatched: dividendMatches.length,
                finalTop: finalTopEtfs.length,
            },
        });
    } catch (err: any) {
        console.error("API /study/generate-dividend-etf error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
