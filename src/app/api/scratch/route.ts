import { NextRequest, NextResponse } from "next/server";
import { getDividendRateRanking, getKsdinfoDividend } from "@/lib/kis/client";

export async function GET(req: NextRequest) {
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const todayStr = kstNow.toISOString().slice(0, 10).replace(/-/g, '');
    const oneYearAgo = new Date(kstNow);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const rankFromDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

    try {
        const ranking0 = await getDividendRateRanking({ gb1: '0', gb2: '0', gb3: '2', f_dt: rankFromDate, t_dt: todayStr, gb4: '0' });
        
        return NextResponse.json({
            ranking0: ranking0.slice(0, 50).map(i => ({ code: i.sht_cd, name: i.hts_kor_isnm, yield: i.stck_divy })),
            rankingCount: ranking0.length
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
