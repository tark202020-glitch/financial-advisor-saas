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

        console.log(`\n▶ [배당ETF분석] 시작`);

        // ====================================================================
        // 1. 배당 ETF 파싱 및 데이터 확보
        // KIS 배당률 랭킹 API는 주식만 반환하므로, 주요 배당 ETF들의 고정 후보군을 사용합니다.
        // ====================================================================
        const DIVIDEND_ETF_CANDIDATES = [
            '161510', // PLUS 고배당주
            '200020', // KODEX 고배당
            '279530', // KODEX 고배당주
            '325020', // KODEX 배당가치
            '211560', // TIGER 배당성장
            '466940', // TIGER 은행고배당플러스TOP10
            '484880', // SOL 금융지주플러스고배당
            '411060', // TIGER 은행
            '091220', // KODEX 은행
            '139260', // TIGER 200 금융
            '140700', // KODEX 보험
            '367800', // TIGER 100 플러스배당
            '332610', // KODEX 배당성장
            '332620', // KODEX 고배당가치
            '104530', // KODEX 고배당
            '429000', // TIGER 배당프리미엄액티브
            '329200', // TIGER 부동산인프라고배당
            '339160', // TIGER 부동산인프라
            '400970', // KODEX 한국부동산리츠
            '460330', // TIGER 미국배당다우존스
            '458760', // ACE 미국배당다우존스
            '446720', // SOL 미국배당다우존스
            '379760', // TIGER 배당가치
            '306540', // HANARO 고배당
            '227830', // ARIRANG 고배당저변동50
            '266160', // KBSTAR 고배당
            '287330', // KBSTAR 고배당저변동
            '376410', // TIGER 200 배당성장
            '315960', // KBSTAR 대형고배당10TR
            '433330', // KODEX 미국배당프리미엄액티브
            '415580', // TIMEFOLIO Korea플러스배당액티브
            '441680', // TIGER 배당프리미엄액티브
            '379800', // KODEX 배당가치
            '379810', // KODEX 고배당
            '453860', // KODEX 배당성장채권혼합
            '452360', // ARIRANG 고배당주채권혼합
            '251600'  // PLUS 고배당주채권혼합
        ];

        console.log(`  [1단계] ETF 후보군 ${DIVIDEND_ETF_CANDIDATES.length}개 설정 완료`);

        // ====================================================================
        // 2. ETF 정보 및 현재가 조회
        // ====================================================================
        console.log(`  [2단계] ETF 현재가 및 정보 조회 시작...`);

        interface EtfCandidate {
            code: string;
            name: string;
            price: number;
            dividendCycle: string;
        }

        const etfCandidates: EtfCandidate[] = [];

        for (const code of DIVIDEND_ETF_CANDIDATES) {
            await new Promise(r => setTimeout(r, 150));
            try {
                // getStockInfo를 통해 정확한 ETF 이름을 가져옵니다
                const stockInfo = await getStockInfo(code);
                let etfName = stockInfo ? (stockInfo.prdt_abrv_name || stockInfo.prdt_name || code) : code;

                const etfData = await getEtfPrice(code);
                if (!etfData || !etfData.stck_prpr) continue;

                const price = parseInt(etfData.stck_prpr || '0');
                if (price <= 0) continue;

                const dividendCycle = etfData.etf_dvdn_cycl || '-';

                // 커버드콜 제외
                const nameUpper = etfName.toUpperCase();
                if (COVERED_CALL_KEYWORDS.some(kw => nameUpper.includes(kw.toUpperCase()))) {
                    console.log(`  [커버드콜 제외] ${etfName}(${code})`);
                    continue;
                }

                etfCandidates.push({
                    code,
                    name: etfName,
                    price,
                    dividendCycle,
                });

                console.log(`  [ETF 확인] ${etfName}(${code}) - ${price}원, 배당주기: ${dividendCycle}`);

            } catch (e) {
                console.warn(`  [ETF 조회 실패] ${code}`);
                continue;
            }
        }

        console.log(`  [2단계] 유효 ETF ${etfCandidates.length}개 확보 완료`);

        // ====================================================================
        // 3. ETF 후보들의 실제 배당 이력 조회 → TOP10 선정
        // ====================================================================
        console.log(`  [3단계] ETF 실제 배당 이력 조회 중...`);
        const etfResults: any[] = [];

        for (const etf of etfCandidates) {
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
