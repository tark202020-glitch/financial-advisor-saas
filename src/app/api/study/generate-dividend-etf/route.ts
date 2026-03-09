import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getDomesticPrice, getStockInfo, getEtfPrice } from "@/lib/kis/client";

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

        // 기준일 범위: 최근 2년
        const twoYearsAgo = new Date(kstNow);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const fromDate = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        // 최근 1년 (순위 조회용)
        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const rankFromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당ETF분석] 시작 - 순위기간: ${rankFromDate}~${todayStr}`);

        // ====================================================================
        // 1. 전체 배당률 상위 (코스피+코스닥) - 50개 후보 확보
        // ====================================================================
        console.log(`  [1단계] 전체 배당률 상위 조회 중...`);
        const rankings = await getDividendRateRanking({
            gb1: '0',       // 전체 (코스피+코스닥)
            upjong: '0001', // 종합
            gb2: '0',       // 전체
            gb3: '2',       // 현금배당
            f_dt: rankFromDate,
            t_dt: todayStr,
            gb4: '0',       // 전체
        });

        console.log(`  [1단계] 배당률 상위 ${rankings.length}건 조회 완료`);

        // 상위 50개 후보 확보
        const candidates = rankings.slice(0, 50);

        // ====================================================================
        // 2. 각 종목별 ETF 확인 + 실제 배당 이력 조회
        // ====================================================================
        console.log(`  [2단계] 종목별 ETF 확인 + 실제 배당 이력 조회 중...`);
        const etfResults: any[] = [];

        for (const item of candidates) {
            if (etfResults.length >= 10) break;

            const code = item.sht_cd;

            // 2-1) 종목 정보 조회 → ETF인지 확인
            let stockName = code;
            let isETF = false;
            try {
                const stockInfo = await getStockInfo(code);
                if (stockInfo) {
                    stockName = stockInfo.prdt_abrv_name || stockInfo.prdt_name || code;
                    // ETF 구분: scty_grp_id_cd가 'EF'이거나 etf_dvsn_cd가 존재하면 ETF
                    const sctyGrp = stockInfo.scty_grp_id_cd || '';
                    const etfDvsn = stockInfo.etf_dvsn_cd || '';
                    isETF = sctyGrp === 'EF' || etfDvsn !== '' ||
                        stockName.includes('ETF') || stockName.includes('ETN') ||
                        stockName.includes('리츠') || stockName.includes('REIT');
                }
            } catch (e) {
                console.warn(`  [종목정보] 조회 실패: ${code}`);
            }

            if (!isETF) {
                continue; // ETF가 아니면 건너뜀
            }

            // 커버드콜 필터
            const nameUpper = stockName.toUpperCase();
            const isCoveredCall = COVERED_CALL_KEYWORDS.some(kw => nameUpper.includes(kw.toUpperCase()));
            if (isCoveredCall) {
                console.log(`  [커버드콜 제외] ${stockName}`);
                continue;
            }

            // 2-2) 실제 배당 이력 조회 (최근 2년)
            await new Promise(r => setTimeout(r, 200));
            let actualDividends: any[] = [];
            try {
                actualDividends = await getKsdinfoDividend({
                    gb1: '0',
                    f_dt: fromDate,
                    t_dt: todayStr,
                    sht_cd: code,
                });
            } catch (e) {
                console.warn(`  [배당이력] 조회 실패: ${code}`);
            }

            if (!actualDividends || actualDividends.length === 0) {
                console.log(`  [${stockName}(${code})] 배당 이력 없음 - 건너뜀`);
                continue;
            }

            // 가장 최근 배당 찾기
            const sortedDividends = actualDividends
                .filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0)
                .sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));

            if (sortedDividends.length === 0) continue;

            const latestDividend = sortedDividends[0];
            const actualDividendAmount = parseFloat(latestDividend.per_sto_divi_amt || '0');
            const dividendPayDate = latestDividend.divi_pay_dt || latestDividend.record_date || '';
            const recordDate = latestDividend.record_date || '';

            console.log(`  [${stockName}(${code})] 최근배당: ${actualDividendAmount}원, 지급일: ${dividendPayDate}`);

            // 2-3) ETF 현재가 + 배당주기 조회
            await new Promise(r => setTimeout(r, 200));
            let price = 0;
            let etfDividendCycle = '-';
            try {
                const etfData = await getEtfPrice(code);
                if (etfData) {
                    price = parseInt(etfData.stck_prpr || '0');
                    etfDividendCycle = etfData.etf_dvdn_cycl || '-';
                }
                // ETF API 실패 시 일반 주가 API로 폴백
                if (price <= 0) {
                    const priceData = await getDomesticPrice(code);
                    if (priceData) {
                        price = parseInt(priceData.stck_prpr || '0');
                    }
                }
            } catch (e) {
                console.warn(`  [현재가] 조회 실패: ${code}`);
            }

            if (price <= 0) continue;

            // 배당 횟수 추정
            let frequency = '-';
            if (etfDividendCycle.includes('월')) frequency = '12회';
            else if (etfDividendCycle.includes('분기')) frequency = '4회';
            else if (etfDividendCycle.includes('반기')) frequency = '2회';
            else if (etfDividendCycle.includes('연')) frequency = '1회';

            // 수익률 = 실제 배당금 / 현재 종가 × 100
            const yieldRate = (actualDividendAmount / price) * 100;

            // 가상배당금 (1000만원 투자시)
            const investAmount = 10000000;
            const shares = Math.floor(investAmount / price);
            const virtualDividend = shares * actualDividendAmount;

            etfResults.push({
                code,
                name: stockName,
                price,
                dividendAmount: actualDividendAmount,
                dividendPayDate,
                recordDate,
                yieldRate,
                frequency,
                virtualDividend,
            });
        }

        // 수익률 높은 순으로 재정렬
        etfResults.sort((a, b) => b.yieldRate - a.yieldRate);

        // ====================================================================
        // 3. 마크다운 생성
        // ====================================================================
        let markdown = `# 배당ETF\n`;
        markdown += `> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n`;
        markdown += `---\n\n`;

        markdown += `## 국내 ETF 배당 수익률 TOP 10 (커버드콜 제외, KOSDAQ 포함)\n\n`;
        if (etfResults.length > 0) {
            const avgRate = (etfResults.reduce((sum, s) => sum + s.yieldRate, 0) / etfResults.length).toFixed(2);
            markdown += `> 현재 기준 배당수익률 상위 50개 종목을 선정한 후, ETF만 필터링하고 커버드콜을 제외하여 실제 지급된 현금배당 내역을 확인한 리포트입니다. 수익률은 현재 종가 대비로 산출하였습니다. (평균 ${avgRate}%)\n\n`;

            markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 횟수 | 최근배당일 | 가상배당금 |\n`;
            markdown += `|------|------|-----------|--------|------|-----------|----------|\n`;

            for (const s of etfResults) {
                const nameDisplay = s.name;
                const priceDisplay = `${formatNumber(s.price)}원`;
                const payDateFormatted = formatDate(s.dividendPayDate || s.recordDate);
                const divDisplay = `${formatNumber(s.dividendAmount)}원 (${payDateFormatted})`;
                const rateDisplay = `${s.yieldRate.toFixed(2)}%`;
                const freqDisplay = s.frequency;
                const dateDisplay = formatDate(s.recordDate);
                const virtualDisplay = `${formatNumber(Math.round(s.virtualDividend))}원`;

                markdown += `| ${nameDisplay} | ${priceDisplay} | ${divDisplay} | ${rateDisplay} | ${freqDisplay} | ${dateDisplay} | ${virtualDisplay} |\n`;
            }
        } else {
            markdown += `> 조회된 ETF 데이터가 없습니다.\n`;
        }

        markdown += `\n---\n\n`;
        markdown += `*본 리포트는 KIS(한국투자증권) API 실시간 데이터를 기반으로 자동 생성되었습니다.*\n`;
        markdown += `*주당배당금은 가장 최근 실제 지급된 금액이며, 수익률은 현재 종가 대비로 산출했습니다.*\n`;
        markdown += `*가상배당금은 1,000만원 투자 시 연간 예상 배당금입니다.*\n`;

        // ====================================================================
        // 4. Supabase 저장
        // ====================================================================
        const title = `배당ETF_${displayDate} ${displayTime}`;

        const { error: insertError } = await supabase
            .from('study_boards')
            .insert({
                topic: 'dividend',
                title,
                content: markdown,
            });

        if (insertError) {
            console.error('[배당ETF분석] Supabase 저장 실패:', insertError);
        } else {
            console.log(`[배당ETF분석] Supabase 저장 완료: ${title}`);
        }

        return NextResponse.json({
            success: true,
            content: markdown,
            title,
            stats: {
                etfs: etfResults.length,
            }
        });

    } catch (err: any) {
        console.error("API /study/generate-dividend-etf error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
