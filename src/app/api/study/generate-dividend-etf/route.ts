import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getEtfPrice, getStockInfo } from "@/lib/kis/client";

import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // Allow 60 seconds execution limit

// 커버드콜 ETF 필터링 키워드
const COVERED_CALL_KEYWORDS = ['커버드콜', '커버드', 'COVERED', 'CC', '프리미엄', 'PREMIUM', '인컴', 'INCOME'];

// 원하는 키워드 및 식별용 브랜드
const TARGET_KEYWORDS = ['배당', '액티브', '보험', '은행'];
const ETF_BRANDS = [
    'KODEX', 'TIGER', 'KBSTAR', 'ARIRANG', 'HANARO', 'ACE', 'SOL', 
    'TIMEFOLIO', 'TIME', 'PLUS', 'WOORI', '마이티', 'KOSEF', '히어로즈', 
    'KOACT', 'BNK', 'HK', 'NAVIGATOR', '파워', 'TREX'
];

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

        if (authError || !user || user.email !== 'tark202020@gmail.com') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const todayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
        const displayDate = kstNow.toISOString().slice(0, 10);
        const displayTime = kstNow.toISOString().slice(11, 16);

        // 기준일 범위
        const twoYearsAgo = new Date(kstNow);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const fromDate = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작`);

        // ====================================================================
        // 1. 배당 ETF 파싱 및 데이터 확보 (동적 추출)
        // json 파일에서 키워드가 포함된 ETF 종목을 동적으로 필터링하여 후보군으로 구성합니다.
        // ====================================================================
        let matchedEtfs: { code: string, name: string }[] = [];
        try {
            const unifiedPath = path.join(process.cwd(), 'public', 'data', 'all_stocks_master.json');
            if (fs.existsSync(unifiedPath)) {
                const rawData = fs.readFileSync(unifiedPath, 'utf-8');
                const allStocks = JSON.parse(rawData);

                matchedEtfs = allStocks.filter((stock: any) => {
                    if (!stock.name) return false;
                    const nameUpper = stock.name.toUpperCase();
                    
                    // 1. 필수 키워드 포함 확인 ('배당', '액티브', '보험', '은행')
                    const hasKeyword = TARGET_KEYWORDS.some(kw => nameUpper.includes(kw.toUpperCase()));
                    if (!hasKeyword) return false;

                    // 2. 커버드콜 종목 필터링 제외
                    const hasExclude = COVERED_CALL_KEYWORDS.some(kw => nameUpper.includes(kw.toUpperCase()));
                    if (hasExclude) return false;

                    // 3. ETF 브랜드명 확인하여 일반 주식 혼입 방지
                    const isEtf = ETF_BRANDS.some(brand => nameUpper.includes(brand.toUpperCase()));
                    return isEtf;
                }).map((stock: any) => ({ code: stock.symbol, name: stock.name }));
            } else {
                console.warn("[경고] all_stocks_master.json 파일을 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error("[에러] ETF 후보군 파싱 중 오류 발생:", error);
        }

        console.log(`  [1단계] 동적 ETF 후보군 ${matchedEtfs.length}개 파싱 및 설정 완료`);

        // ====================================================================
        // 2. ETF 정보 및 현재가 조회 (Chunk 병렬 처리로 속도 개선)
        // ====================================================================
        console.log(`  [2단계] ETF 현재가 및 정보 조회 시작... (대상: ${matchedEtfs.length}개)`);

        interface EtfCandidate {
            code: string;
            name: string;
            price: number;
            dividendCycle: string;
        }

        const etfCandidates: EtfCandidate[] = [];
        
        // KIS API 초당 호출 제한을 고려하여 10개씩 청크 단위로 병렬 처리
        const chunkSize = 10;
        for (let i = 0; i < matchedEtfs.length; i += chunkSize) {
            const chunk = matchedEtfs.slice(i, i + chunkSize);
            
            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    try {
                        const etfData = await getEtfPrice(item.code);
                        if (!etfData || !etfData.stck_prpr) return null;

                        const price = parseInt(etfData.stck_prpr || '0');
                        if (price <= 0) return null;

                        return {
                            code: item.code,
                            name: item.name,
                            price,
                            dividendCycle: etfData.etf_dvdn_cycl || '-',
                        } as EtfCandidate;
                    } catch (e) {
                        return null;
                    }
                })
            );

            // 유효한 결과만 추가
            chunkResults.forEach(res => {
                if (res) etfCandidates.push(res);
            });
            
            // 청크 간 딜레이 (KIS API Rate Limit: 초당 20건 제한 대비 0.5초 대기)
            if (i + chunkSize < matchedEtfs.length) {
                await new Promise(r => setTimeout(r, 500)); 
            }
        }

        console.log(`  [2단계] 유효 ETF ${etfCandidates.length}개 확보 완료`);

        // ====================================================================
        // 3. ETF 후보들의 실제 배당 이력 조회 → TOP10 선정 (Chunk 병렬 처리)
        // ====================================================================
        console.log(`  [3단계] ETF 실제 배당 이력 조회 중...`);
        const etfResults: any[] = [];
        const divChunkSize = 5; // 배당 이력은 호출 비용이 높을 수 있으므로 5개씩

        for (let i = 0; i < etfCandidates.length; i += divChunkSize) {
            const chunk = etfCandidates.slice(i, i + divChunkSize);
            
            const chunkDivResults = await Promise.all(
                chunk.map(async (etf) => {
                    try {
                        const actualDividends = await getKsdinfoDividend({
                            gb1: '0',
                            f_dt: fromDate,
                            t_dt: todayStr,
                            sht_cd: etf.code,
                        });

                        if (!actualDividends || actualDividends.length === 0) return null;

                        // 가장 최근 배당
                        const sortedDividends = actualDividends
                            .filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0)
                            .sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));

                        if (sortedDividends.length === 0) return null;

                        const latest = sortedDividends[0];
                        const actualAmount = parseFloat(latest.per_sto_divi_amt || '0');
                        const dividendPayDate = latest.divi_pay_dt || latest.record_date || '';
                        const recordDate = latest.record_date || '';

                        // 수익률 = 실제 배당금 / 현재 종가 × 100
                        const yieldRate = (actualAmount / etf.price) * 100;

                        // 배당 횟수 추정
                        let frequency = '-';
                        const cycle = etf.dividendCycle;
                        if (cycle.includes('월')) frequency = '12회';
                        else if (cycle.includes('분기')) frequency = '4회';
                        else if (cycle.includes('반기')) frequency = '2회';
                        else if (cycle.includes('연')) frequency = '1회';

                        // 가상배당금
                        const shares = Math.floor(10000000 / etf.price);
                        const virtualDividend = shares * actualAmount;

                        return {
                            code: etf.code,
                            name: etf.name,
                            price: etf.price,
                            dividendAmount: actualAmount,
                            dividendPayDate,
                            recordDate,
                            yieldRate,
                            frequency,
                            virtualDividend,
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );

            chunkDivResults.forEach(res => {
                if (res) etfResults.push(res);
            });
            
            if (i + divChunkSize < etfCandidates.length) {
                await new Promise(r => setTimeout(r, 600)); 
            }
        }

        // 수익률 높은 순 재정렬 후 상위 10개 추출
        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);
        const top10Etfs = etfResults.slice(0, 10);

        // ====================================================================
        // 4. 마크다운 생성
        // ====================================================================
        let markdown = `# 배당ETF\n`;
        markdown += `> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n`;
        markdown += `---\n\n`;

        markdown += `## 국내 ETF 배당 수익률 TOP 10 (커버드콜 제외, KOSDAQ 포함)\n\n`;
        if (top10Etfs.length > 0) {
            const avgRate = (top10Etfs.reduce((sum, s) => sum + s.yieldRate, 0) / top10Etfs.length).toFixed(2);
            markdown += `> 배당수익률 상위 ETF 중 커버드콜을 제외하고, 실제 지급된 현금배당 내역을 확인하여 정리한 리포트입니다. 수익률은 현재 종가 대비로 산출하였습니다. (평균 ${avgRate}%)\n\n`;

            markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 횟수 | 최근배당일 | 가상배당금 |\n`;
            markdown += `|------|------|-----------|--------|------|-----------|----------|\n`;

            for (const s of top10Etfs) {
                const payDateFormatted = formatDate(s.dividendPayDate || s.recordDate);
                markdown += `| ${s.name} | ${formatNumber(s.price)}원 | ${formatNumber(s.dividendAmount)}원 (${payDateFormatted}) | ${s.yieldRate.toFixed(2)}% | ${s.frequency} | ${formatDate(s.recordDate)} | ${formatNumber(Math.round(s.virtualDividend))}원 |\n`;
            }
        } else {
            markdown += `> 조회된 ETF 데이터가 없습니다.\n`;
        }

        markdown += `\n---\n\n`;
        markdown += `*본 리포트는 KIS(한국투자증권) API 실시간 데이터를 기반으로 자동 생성되었습니다.*\n`;
        markdown += `*주당배당금은 가장 최근 실제 지급된 금액이며, 수익률은 현재 종가 대비로 산출했습니다.*\n`;
        markdown += `*가상배당금은 1,000만원 투자 시 연간 예상 배당금입니다.*\n`;

        // ====================================================================
        // 5. Supabase 저장
        // ====================================================================
        const title = `배당ETF_${displayDate} ${displayTime}`;

        const { error: insertError } = await supabase
            .from('study_boards')
            .insert({ topic: 'dividend', title, content: markdown });

        if (insertError) {
            console.error('[배당ETF분석] Supabase 저장 실패:', insertError);
        } else {
            console.log(`[배당ETF분석] Supabase 저장 완료: ${title}`);
        }

        return NextResponse.json({
            success: true,
            content: markdown,
            title,
            stats: { etfs: etfResults.length },
        });

    } catch (err: any) {
        console.error("API /study/generate-dividend-etf error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
