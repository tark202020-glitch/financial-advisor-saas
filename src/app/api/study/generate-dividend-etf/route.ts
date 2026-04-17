import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getEtfPrice, getStockInfo } from "@/lib/kis/client";
import { fetchDividendDisclosures } from "@/lib/opendart";
import { GoogleGenerativeAI } from "@google/generative-ai";

import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // Allow 60 seconds execution limit

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

        const twoYearsAgo = new Date(kstNow);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const fromDate = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작`);

        // ====================================================================
        // 1. LLM Step 1: Extract Filter Config
        // ====================================================================
        const apiKey = process.env.GEMINI_API_KEY || '';
        let includeKeywords = ['배당'];
        let excludeKeywords: string[] = [];
        let topLimit = 10;

        if (apiKey && userPrompt) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const extractPrompt = `넌 ETF 필터 설정 추출기야. 사용자의 프롬프트를 분석해서 반드시 순수 JSON 형태(문자열 블록 \`\`\`json 등이 없는 형태)로만 응답해.
형식: {"includeKeywords": ["키워드1", "키워드2"], "excludeKeywords": ["제외어1"], "topLimit": 10}
- 프롬프트에 포함되어야 할 종목 키워드(예: 배당, 리츠)를 includeKeywords 로 뽑아. 명시되지 않았다면 ["배당"]으로 해.
- 제외해야 하는 키워드(예: 커버드콜 제외 -> ["커버드콜", "커버드"])가 있다면 excludeKeywords 로 뽑아. 없으면 [].
- 상위 N개를 뽑으라는 지시(예: 상위 30개)가 있다면 topLimit을 그 숫자로 설정해. (최대 50)
- 사용자 프롬프트: ${userPrompt}`;
                const result = await model.generateContent(extractPrompt);
                const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const config = JSON.parse(text);
                if (config.includeKeywords && Array.isArray(config.includeKeywords)) includeKeywords = config.includeKeywords;
                if (config.excludeKeywords && Array.isArray(config.excludeKeywords)) excludeKeywords = config.excludeKeywords;
                if (typeof config.topLimit === 'number') topLimit = Math.min(config.topLimit, 50); // 안전장치 최대 50
                console.log(`  [LLM] 파싱된 필터 설정:`, config);
            } catch (e) {
                console.error("  [LLM] 필터 추출 실패 (기본값 사용):", e);
            }
        }

        // ====================================================================
        // 2. 배당 ETF 파싱 및 데이터 확보 (동적 추출)
        // ====================================================================
        let matchedEtfs: { code: string, name: string }[] = [];
        try {
            const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
            if (fs.existsSync(unifiedPath)) {
                const rawData = fs.readFileSync(unifiedPath, 'utf-8');
                const allStocks = JSON.parse(rawData);

                const ETF_BRANDS = ['KODEX', 'TIGER', 'KBSTAR', 'RISE', 'ARIRANG', 'HANARO', 'ACE', 'SOL', 'TIMEFOLIO', 'PLUS', 'WOORI', 'KOSEF', '히어로즈', 'KOACT', 'BNK', 'NAVIGATOR', '파워', 'KIWOOM', 'DAISHIN', 'TRUSTON', 'FOCUS', 'ITF', 'UNICORN', 'WON', '신한', '마이다스', '에셋플러스'];

                matchedEtfs = allStocks.filter((stock: any) => {
                    if (!stock.name) return false;
                    const nameUpper = stock.name.toUpperCase();
                    
                    const isEtf = ETF_BRANDS.some(brand => nameUpper.includes(brand.toUpperCase()));
                    if (!isEtf) return false;

                    const hasInclude = includeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
                    if (includeKeywords.length > 0 && !hasInclude) return false;

                    const hasExclude = excludeKeywords.some(kw => nameUpper.includes(kw.toUpperCase()));
                    if (excludeKeywords.length > 0 && hasExclude) return false;

                    return true;
                }).map((stock: any) => ({ code: stock.symbol, name: stock.name }));
            }
        } catch (error) {
            console.error("[에러] ETF 후보군 파싱 중 오류 발생:", error);
        }

        console.log(`  [2단계] 동적 ETF 후보군 ${matchedEtfs.length}개 파싱 완료`);

        // 후보군이 너무 많으면 KIS API가 제한되므로 무작위 추출 또는 단순 커팅
        if (matchedEtfs.length > 60) matchedEtfs = matchedEtfs.slice(0, 60);

        // ====================================================================
        // 3. ETF 정보 및 현재가 조회
        // ====================================================================
        interface EtfCandidate { code: string; name: string; price: number; dividendCycle: string; }
        const etfCandidates: EtfCandidate[] = [];
        
        const chunkSize = 15;
        for (let i = 0; i < matchedEtfs.length; i += chunkSize) {
            const chunk = matchedEtfs.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    try {
                        const etfData = await getEtfPrice(item.code);
                        if (!etfData || !etfData.stck_prpr) return null;
                        const price = parseInt(etfData.stck_prpr || '0');
                        if (price <= 0) return null;
                        return { code: item.code, name: item.name, price, dividendCycle: etfData.etf_dvdn_cycl || '-' } as EtfCandidate;
                    } catch (e) { return null; }
                })
            );
            chunkResults.forEach(res => { if (res) etfCandidates.push(res); });
            if (i + chunkSize < matchedEtfs.length) await new Promise(r => setTimeout(r, 200)); 
        }

        // ====================================================================
        // 4. 배당 이력 조회 -> 수익률 산출
        // ====================================================================
        const etfResults: any[] = [];
        const divChunkSize = 15;
        for (let i = 0; i < etfCandidates.length; i += divChunkSize) {
            const chunk = etfCandidates.slice(i, i + divChunkSize);
            const chunkDivResults = await Promise.all(
                chunk.map(async (etf) => {
                    try {
                        const actualDividends = await getKsdinfoDividend({ gb1: '0', f_dt: fromDate, t_dt: todayStr, sht_cd: etf.code });
                        if (!actualDividends || actualDividends.length === 0) return null;
                        const sortedDividends = actualDividends.filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0).sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));
                        if (sortedDividends.length === 0) return null;

                        const latest = sortedDividends[0];
                        const actualAmount = parseFloat(latest.per_sto_divi_amt || '0');
                        const yieldRate = (actualAmount / etf.price) * 100;

                        return {
                            code: etf.code, name: etf.name, price: etf.price,
                            dividendAmount: actualAmount,
                            dividendPayDate: latest.divi_pay_dt || latest.record_date || '',
                            recordDate: latest.record_date || '',
                            yieldRate,
                            frequency: etf.dividendCycle,
                            virtualDividend: Math.floor(10000000 / etf.price) * actualAmount
                        };
                    } catch (e) { return null; }
                })
            );
            chunkDivResults.forEach(res => { if (res) etfResults.push(res); });
            if (i + divChunkSize < etfCandidates.length) await new Promise(r => setTimeout(r, 200)); 
        }

        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);
        const finalTopEtfs = etfResults.slice(0, topLimit);

        // ====================================================================
        // 5. LLM Step 2: 프롬프트에 맞는 Markdown 렌더링
        // ====================================================================
        let markdown = '';
        if (apiKey && userPrompt && finalTopEtfs.length > 0) {
            console.log(`  [LLM] 사용자 프롬프트 기반 마크다운 작성 지시...`);
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const renderPrompt = `너는 전문 펀드 매니저 겸 애널리스트야. 사용자의 요청(프롬프트)과 백엔드 시스템이 실제 수집한 "제공된 ETF 데이터"를 결합하여 완벽한 마크다운 리포트를 작성해줘.
데이터 상의 금액 및 수치는 있는 그대로 포맷팅해서 작성해야 하며 절대 임의로 상상해서 쓰지 마.
데이터가 부족하면 있는 것만으로 작성해. 표는 사용자가 요청한 양식에 맞춰 그려줘.

[사용자 요청 프롬프트]:
${userPrompt}

[제공된 ETF 데이터 (상위 ${topLimit}개)]:
${JSON.stringify(finalTopEtfs.map(e => ({...e, virtualDividend: Math.round(e.virtualDividend)})), null, 2)}`;
                
                const response = await model.generateContent(renderPrompt);
                markdown = response.response.text();
            } catch (e) {
                console.error("  [LLM] 마크다운 렌더링 실패 (기본 양식 폴백):", e);
            }
        }

        // LLM이 마크다운 작성을 실패했거나 없으면 폴백으로 기본 마크다운 생성
        if (!markdown) {
            markdown = `# 배당ETF\n> 📅 작성일시: ${displayDate} ${displayTime}\n\n`;
            if (finalTopEtfs.length > 0) {
                markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 배당주기 | 최근배당일 | 가상배당금 |\n|------|------|-----------|--------|--------|-----------|----------|\n`;
                for (const s of finalTopEtfs) {
                    const payDateFmt = formatDate(s.dividendPayDate || s.recordDate);
                    markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(s.dividendAmount)}원 (${payDateFmt}) | ${s.yieldRate.toFixed(2)}% | ${s.frequency} | ${formatDate(s.recordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
                }
            } else { markdown += `> 조회된 데이터가 없습니다.\n`; }
        }

        // 공시 정보 덧붙이기 (항상 작동)
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
        markdown += `\n---\n*본 리포트는 KIS API 실시간 데이터를 기반으로 AI가 작성했습니다.*\n`;

        // ====================================================================
        // 6. DB 저장
        // ====================================================================
        const title = `배당ETF_${displayDate} ${displayTime}`;
        const { error: insertError } = await supabase.from('study_boards').insert({ topic: 'dividend', title, content: markdown });
        if (insertError) console.error('[배당ETF] 저장 실패:', insertError);

        return NextResponse.json({ success: true, content: markdown, title, stats: { etfs: etfResults.length } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
