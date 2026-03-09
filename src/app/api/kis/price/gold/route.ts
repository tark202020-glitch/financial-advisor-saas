import { NextResponse } from 'next/server';
import { getGoldSpotPrice } from '@/lib/kis/client';

export async function GET() {
    // 🔥 터미널 확인용 로그 추가
    console.log(`\n▶ [API 호출] GOLD(KRX 금현물) 시장 가격 조회 요청 수신`);

    try {
        const data = await getGoldSpotPrice();

        if (!data) {
            console.error(`  [오류] ❌ 금 시세 데이터 반환 실패 (null)`);
            return NextResponse.json({ error: 'Failed to fetch gold spot price' }, { status: 500 });
        }

        console.log(`  [완료] ✅ 금 시세 데이터 조회 성공 (현재가: ${data.stck_prpr})`);

        // Return formatted gold data
        return NextResponse.json({
            symbol: 'GOLD_4020000',
            name: 'KRX 금현물 (1g)',
            market: 'GOLD',
            stck_prpr: data.stck_prpr,
            prdy_vrss: data.prdy_vrss,
            prdy_ctrt: data.prdy_ctrt,
            stck_bsop_date: data.stck_bsop_date,
            stck_cntg_hour: data.stck_cntg_hour,
            bstp_kor_isnm: 'KRX 금현물',
            rprs_mrkt_kor_name: 'KRX 금현물',
        });
    } catch (error: any) {
        console.error('[Gold API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
