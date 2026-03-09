import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getDividendRateRanking, getKsdinfoDividend, getDomesticPrice } from "@/lib/kis/client";

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

        // 기준일 범위: 최근 1년
        const oneYearAgo = new Date(kstNow);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const fromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

        // 미래 배당일 조회용 (오늘 ~ 6개월 후)
        const sixMonthsLater = new Date(kstNow);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const futureDate = sixMonthsLater.toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`\n▶ [배당분석] 시작 - 기간: ${fromDate} ~ ${todayStr}`);

        // ====================================================================
        // 1. 국내 주식 배당률 상위 (코스피만)
        // ====================================================================
        console.log(`  [주식] 코스피 배당률 상위 조회 중...`);
        const stockRankings = await getDividendRateRanking({
            gb1: '1',       // 코스피만
            upjong: '0001', // 종합
            gb2: '6',       // 보통주만
            gb3: '2',       // 현금배당
            f_dt: fromDate,
            t_dt: todayStr,
            gb4: '0',       // 전체(결산+중간)
        });

        console.log(`  [주식] 배당률 상위 ${stockRankings.length}건 조회 완료`);

        // 상위 15개 가져와서 현재가 보강 후 TOP10 선정
        const stockTop = stockRankings.slice(0, 15);
        const stockResults: any[] = [];

        for (const item of stockTop) {
            if (stockResults.length >= 10) break;

            const code = item.sht_cd;
            const dividendAmount = parseFloat(item.per_sto_divi_amt || '0');
            // KIS API divi_rate는 실제 %의 1000배로 반환 (예: 3800 = 3.8%)
            const rawRate = parseFloat(item.divi_rate || '0');
            const dividendRate = rawRate / 1000;
            const recordDate = item.record_date || '';

            console.log(`  [DEBUG] ${code}: rawRate=${rawRate}, dividendRate=${dividendRate}%, dividendAmt=${dividendAmount}`);

            if (dividendAmount <= 0 || dividendRate <= 0) continue;

            // 현재가 조회
            await new Promise(r => setTimeout(r, 300));

            let price = 0;
            let stockName = code;
            try {
                const priceData = await getDomesticPrice(code);
                if (priceData) {
                    price = parseInt(priceData.stck_prpr || '0');
                    stockName = (priceData as any).hts_kor_isnm || code;
                }
            } catch (e) {
                console.warn(`  [주식] 현재가 조회 실패: ${code}`);
            }

            if (price <= 0) continue;

            // 가상배당금 계산 (1000만원 투자시)
            const investAmount = 10000000;
            const shares = Math.floor(investAmount / price);
            const virtualDividend = shares * dividendAmount;

            stockResults.push({
                code,
                name: stockName,
                price,
                dividendAmount,
                dividendRate,
                recordDate,
                virtualDividend,
            });
        }

        // ====================================================================
        // 2. 예탁원 배당일정 조회 (미래 배당일 정보 보강)
        // ====================================================================
        console.log(`  [배당일정] 예탁원 배당일정 조회 중... (${todayStr} ~ ${futureDate})`);
        let dividendSchedule: any[] = [];
        try {
            dividendSchedule = await getKsdinfoDividend({
                gb1: '0',
                f_dt: todayStr,
                t_dt: futureDate,
            });
            console.log(`  [배당일정] ${dividendSchedule.length}건 조회 완료`);
        } catch (e) {
            console.warn(`  [배당일정] 조회 실패:`, e);
        }

        // 배당일정 매핑 (종목코드 → 최근배당일)
        const scheduleMap = new Map<string, string>();
        for (const s of dividendSchedule) {
            const scode = s.sht_cd;
            const payDate = s.divi_pay_dt || s.record_date || '';
            if (scode && payDate) {
                if (!scheduleMap.has(scode) || payDate < (scheduleMap.get(scode) || '')) {
                    scheduleMap.set(scode, payDate);
                }
            }
        }

        // 주식 결과에 배당일 보강
        for (const stock of stockResults) {
            const nextDividendDate = scheduleMap.get(stock.code);
            stock.nextDividendDate = nextDividendDate || stock.recordDate;
        }

        // ====================================================================
        // 3. 마크다운 생성 (주식만)
        // ====================================================================
        let markdown = `# 배당주식\n`;
        markdown += `> 📅 작성일시: ${displayDate} ${displayTime} | 📊 데이터: KIS API 실시간 조회\n\n`;
        markdown += `---\n\n`;

        // 국내 주식 배당률 TOP 10
        markdown += `## 국내 주식 배당 수익률 TOP 10 (코스피)\n\n`;
        if (stockResults.length > 0) {
            const avgRate = (stockResults.reduce((sum, s) => sum + s.dividendRate, 0) / stockResults.length).toFixed(2);
            markdown += `> 코스피 상장 주식 중 현금배당 수익률 기준 상위 ${stockResults.length}종목입니다. 평균 배당수익률 ${avgRate}%로, 안정적인 배당 파이프라인을 구축할 수 있는 종목들입니다.\n\n`;

            markdown += `| 종목 | 종가 | 주당배당금 | 수익률 | 최근배당일 | 가상배당금 |\n`;
            markdown += `|------|------|-----------|--------|-----------|----------|\n`;

            for (const s of stockResults) {
                const nameDisplay = s.name;
                const priceDisplay = `${formatNumber(s.price)}원`;
                const divDisplay = `연 ${formatNumber(s.dividendAmount)}원`;
                const rateDisplay = `${s.dividendRate.toFixed(2)}%`;
                const dateDisplay = formatDate(s.nextDividendDate);
                const virtualDisplay = `${formatNumber(Math.round(s.virtualDividend))}원`;

                markdown += `| ${nameDisplay} | ${priceDisplay} | ${divDisplay} | ${rateDisplay} | ${dateDisplay} | ${virtualDisplay} |\n`;
            }
        } else {
            markdown += `> 조회된 데이터가 없습니다.\n`;
        }

        markdown += `\n---\n\n`;
        markdown += `*본 리포트는 KIS(한국투자증권) API 실시간 데이터를 기반으로 자동 생성되었습니다.*\n`;
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
