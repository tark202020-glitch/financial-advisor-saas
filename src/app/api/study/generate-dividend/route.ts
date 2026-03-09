import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getDomesticPrice, getStockInfo } from "@/lib/kis/client";

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

        // 기준일 범위: 최근 2년 (실제 지급 내역 확보)
        const twoYearsAgo = new Date(kstNow);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const fromDate = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');

        // 최근 1년 (순위 조회용)
        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const rankFromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당분석] 시작 - 순위기간: ${rankFromDate}~${todayStr}, 배당이력: ${fromDate}~${todayStr}`);

        // ====================================================================
        // 1. 국내 주식 배당률 상위 (코스피만) - 순위 기준
        // ====================================================================
        console.log(`  [1단계] 코스피 배당률 상위 조회 중...`);
        const stockRankings = await getDividendRateRanking({
            gb1: '1',       // 코스피만
            upjong: '0001', // 종합
            gb2: '6',       // 보통주만
            gb3: '2',       // 현금배당
            f_dt: rankFromDate,
            t_dt: todayStr,
            gb4: '0',       // 전체(결산+중간)
        });

        console.log(`  [1단계] 배당률 상위 ${stockRankings.length}건 조회 완료`);

        // 상위 50개 후보 확보
        const candidates = stockRankings.slice(0, 50);

        // ====================================================================
        // 2. 각 종목별 실제 배당 이력 조회 (ksdinfo/dividend)
        // ====================================================================
        console.log(`  [2단계] 종목별 실제 배당 이력 조회 중...`);
        const stockResults: any[] = [];

        for (const item of candidates) {
            if (stockResults.length >= 10) break;

            const code = item.sht_cd;

            // 2-1) 종목명 조회
            let stockName = code;
            try {
                const stockInfo = await getStockInfo(code);
                if (stockInfo) {
                    stockName = stockInfo.prdt_abrv_name || stockInfo.prdt_name || code;
                }
            } catch (e) {
                console.warn(`  [종목명] 조회 실패: ${code}`);
            }

            // 2-2) 실제 배당 이력 조회 (최근 2년)
            await new Promise(r => setTimeout(r, 200));
            let actualDividends: any[] = [];
            try {
                actualDividends = await getKsdinfoDividend({
                    gb1: '0',       // 배당전체
                    f_dt: fromDate,
                    t_dt: todayStr,
                    sht_cd: code,   // 특정 종목
                });
            } catch (e) {
                console.warn(`  [배당이력] 조회 실패: ${code}`);
            }

            if (!actualDividends || actualDividends.length === 0) {
                console.log(`  [${stockName}(${code})] 배당 이력 없음 - 건너뜀`);
                continue;
            }

            // 가장 최근 배당 찾기 (record_date 기준 내림차순 정렬)
            const sortedDividends = actualDividends
                .filter((d: any) => parseFloat(d.per_sto_divi_amt || '0') > 0)
                .sort((a: any, b: any) => (b.record_date || '').localeCompare(a.record_date || ''));

            if (sortedDividends.length === 0) {
                console.log(`  [${stockName}(${code})] 유효 배당 이력 없음 - 건너뜀`);
                continue;
            }

            const latestDividend = sortedDividends[0];
            const actualDividendAmount = parseFloat(latestDividend.per_sto_divi_amt || '0');
            const dividendPayDate = latestDividend.divi_pay_dt || latestDividend.record_date || '';
            const recordDate = latestDividend.record_date || '';
            const dividendKind = latestDividend.divi_kind || '';

            console.log(`  [${stockName}(${code})] 최근배당: ${actualDividendAmount}원, 기준일: ${recordDate}, 지급일: ${dividendPayDate}, 종류: ${dividendKind}`);

            // 2-3) 현재가(종가) 조회
            await new Promise(r => setTimeout(r, 200));
            let price = 0;
            try {
                const priceData = await getDomesticPrice(code);
                if (priceData) {
                    price = parseInt(priceData.stck_prpr || '0');
                }
            } catch (e) {
                console.warn(`  [현재가] 조회 실패: ${code}`);
            }

            if (price <= 0) continue;

            // 수익률 = 실제 배당금 / 현재 종가 × 100
            const yieldRate = (actualDividendAmount / price) * 100;

            // 가상배당금 계산 (1000만원 투자시)
            const investAmount = 10000000;
            const shares = Math.floor(investAmount / price);
            const virtualDividend = shares * actualDividendAmount;

            stockResults.push({
                code,
                name: stockName,
                price,
                dividendAmount: actualDividendAmount,
                dividendPayDate,
                recordDate,
                yieldRate,
                dividendKind,
                virtualDividend,
            });
        }

        // 수익률 높은 순으로 재정렬
        stockResults.sort((a, b) => b.yieldRate - a.yieldRate);

        // ====================================================================
        // 3. 마크다운 생성
        // ====================================================================
        let markdown = `# 배당주식\n`;
        markdown += `> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n`;
        markdown += `---\n\n`;

        markdown += `## 국내 주식 배당 수익률 TOP 10 (코스피)\n\n`;
        if (stockResults.length > 0) {
            const avgRate = (stockResults.reduce((sum, s) => sum + s.yieldRate, 0) / stockResults.length).toFixed(2);
            markdown += `> 현재 기준 배당수익률 상위 50개 종목을 선정한 후, 실제 지급된 현금배당 내역을 확인하여 정리한 리포트입니다. 수익률은 현재 종가 대비로 산출하였습니다. (평균 ${avgRate}%)\n\n`;

            markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 최근배당일 | 가상배당금 |\n`;
            markdown += `|------|------|-----------|--------|-----------|----------|\n`;

            for (const s of stockResults) {
                const nameDisplay = s.name;
                const priceDisplay = `${formatNumber(s.price)}원`;
                // 주당배당금: 실제 금액 + 지급 시기
                const payDateFormatted = formatDate(s.dividendPayDate || s.recordDate);
                const divDisplay = `${formatNumber(s.dividendAmount)}원 (${payDateFormatted})`;
                // 수익률: 종가 대비
                const rateDisplay = `${s.yieldRate.toFixed(2)}%`;
                // 최근배당일
                const dateDisplay = formatDate(s.recordDate);
                const virtualDisplay = `${formatNumber(Math.round(s.virtualDividend))}원`;

                markdown += `| ${nameDisplay} | ${priceDisplay} | ${divDisplay} | ${rateDisplay} | ${dateDisplay} | ${virtualDisplay} |\n`;
            }
        } else {
            markdown += `> 조회된 데이터가 없습니다.\n`;
        }

        markdown += `\n---\n\n`;
        markdown += `*본 리포트는 KIS(한국투자증권) API 실시간 데이터를 기반으로 자동 생성되었습니다.*\n`;
        markdown += `*주당배당금은 가장 최근 실제 지급된 금액이며, 수익률은 현재 종가 대비로 산출했습니다.*\n`;
        markdown += `*가상배당금은 1,000만원 투자 시 연간 예상 배당금입니다.*\n`;

        // ====================================================================
        // 4. Supabase 저장
        // ====================================================================
        const title = `배당주식_${displayDate} ${displayTime}`;

        const { error: insertError } = await supabase
            .from('study_boards')
            .insert({
                topic: 'dividend',
                title,
                content: markdown,
            });

        if (insertError) {
            console.error('[배당분석] Supabase 저장 실패:', insertError);
        } else {
            console.log(`[배당분석] Supabase 저장 완료: ${title}`);
        }

        return NextResponse.json({
            success: true,
            content: markdown,
            title,
            stats: {
                stocks: stockResults.length,
            }
        });

    } catch (err: any) {
        console.error("API /study/generate-dividend error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
