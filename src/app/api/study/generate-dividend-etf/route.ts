import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getEtfPrice, getStockInfo } from "@/lib/kis/client";

// 커버드콜 ETF 필터링 키워드
const COVERED_CALL_KEYWORDS = ['커버드콜', '커버드', 'COVERED', 'CC', '프리미엄', 'PREMIUM', '인컴', 'INCOME'];

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

        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const rankFromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작`);

        // ====================================================================
        // 1. 전체 배당률 상위 (코스피+코스닥) - 가능한 많이 확보
        // ====================================================================
        console.log(`  [1단계] 전체 배당률 상위 조회 중...`);
        const allRankings = await getDividendRateRanking({
            gb1: '0',       // 전체 (코스피+코스닥)
            upjong: '0001',
            gb2: '0',       // 전체
            gb3: '2',       // 현금배당
            f_dt: rankFromDate,
            t_dt: todayStr,
            gb4: '0',
        });

        console.log(`  [1단계] 전체 ${allRankings.length}건 조회 완료`);

        // ====================================================================
        // 2. ETF만 필터링하여 50개 확보
        //    → getEtfPrice API는 ETF 전용으로, ETF가 아닌 종목은 에러 반환
        // ====================================================================
        console.log(`  [2단계] ETF 필터링 시작 (getEtfPrice API로 ETF 여부 확인)...`);

        interface EtfCandidate {
            code: string;
            name: string;
            price: number;
            dividendCycle: string;
        }

        const etfCandidates: EtfCandidate[] = [];

        for (const item of allRankings) {
            if (etfCandidates.length >= 50) break;

            const code = item.sht_cd;

            // ETF 전용 API로 조회 → 성공하면 ETF
            await new Promise(r => setTimeout(r, 150));
            try {
                const etfData = await getEtfPrice(code);
                if (!etfData || !etfData.stck_prpr) continue;

                const price = parseInt(etfData.stck_prpr || '0');
                if (price <= 0) continue;

                const etfName = etfData.bstp_kor_isnm || '';
                const dividendCycle = etfData.etf_dvdn_cycl || '-';

                // ETF 이름이 비어있으면 getStockInfo로 보강
                let finalName = etfName;
                if (!finalName || finalName.length < 2) {
                    try {
                        const stockInfo = await getStockInfo(code);
                        if (stockInfo) {
                            finalName = stockInfo.prdt_abrv_name || stockInfo.prdt_name || code;
                        }
                    } catch (e) { /* ignore */ }
                }

                // 커버드콜 제외
                const nameUpper = finalName.toUpperCase();
                if (COVERED_CALL_KEYWORDS.some(kw => nameUpper.includes(kw.toUpperCase()))) {
                    console.log(`  [커버드콜 제외] ${finalName}(${code})`);
                    continue;
                }

                etfCandidates.push({
                    code,
                    name: finalName,
                    price,
                    dividendCycle,
                });

                console.log(`  [ETF 확인] ${finalName}(${code}) - ${price}원, 배당주기: ${dividendCycle} (${etfCandidates.length}/50)`);

            } catch (e) {
                // getEtfPrice 실패 → ETF가 아님 → 건너뜀
                continue;
            }
        }

        console.log(`  [2단계] ETF ${etfCandidates.length}개 확보 완료`);

        // ====================================================================
        // 3. ETF 후보들의 실제 배당 이력 조회 → TOP10 선정
        // ====================================================================
        console.log(`  [3단계] ETF 실제 배당 이력 조회 중...`);
        const etfResults: any[] = [];

        for (const etf of etfCandidates) {
            if (etfResults.length >= 10) break;

            // 실제 배당 이력 조회
            await new Promise(r => setTimeout(r, 200));
            let actualDividends: any[] = [];
            try {
                actualDividends = await getKsdinfoDividend({
                    gb1: '0',
                    f_dt: fromDate,
                    t_dt: todayStr,
                    sht_cd: etf.code,
                });
            } catch (e) {
                console.warn(`  [배당이력] 조회 실패: ${etf.code}`);
                continue;
            }

            if (!actualDividends || actualDividends.length === 0) {
                console.log(`  [${etf.name}] 배당 이력 없음 - 건너뜀`);
                continue;
            }

            // 가장 최근 배당
            const sortedDividends = actualDividends
                .filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0)
                .sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));

            if (sortedDividends.length === 0) continue;

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

            etfResults.push({
                code: etf.code,
                name: etf.name,
                price: etf.price,
                dividendAmount: actualAmount,
                dividendPayDate,
                recordDate,
                yieldRate,
                frequency,
                virtualDividend,
            });

            console.log(`  [결과] ${etf.name}: ${actualAmount}원, ${yieldRate.toFixed(2)}%`);
        }

        // 수익률 높은 순 재정렬
        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);

        // ====================================================================
        // 4. 마크다운 생성
        // ====================================================================
        let markdown = `# 배당ETF\n`;
        markdown += `> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n`;
        markdown += `---\n\n`;

        markdown += `## 국내 ETF 배당 수익률 TOP 10 (커버드콜 제외, KOSDAQ 포함)\n\n`;
        if (etfResults.length > 0) {
            const avgRate = (etfResults.reduce((sum, s) => sum + s.yieldRate, 0) / etfResults.length).toFixed(2);
            markdown += `> 배당수익률 상위 ETF 중 커버드콜을 제외하고, 실제 지급된 현금배당 내역을 확인하여 정리한 리포트입니다. 수익률은 현재 종가 대비로 산출하였습니다. (평균 ${avgRate}%)\n\n`;

            markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 횟수 | 최근배당일 | 가상배당금 |\n`;
            markdown += `|------|------|-----------|--------|------|-----------|----------|\n`;

            for (const s of etfResults) {
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
