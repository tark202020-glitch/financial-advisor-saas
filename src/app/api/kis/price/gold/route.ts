import { NextResponse } from 'next/server';
import { getGoldSpotPrice } from '@/lib/kis/client';

export async function GET() {
    try {
        const data = await getGoldSpotPrice();

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch gold spot price' }, { status: 500 });
        }

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
