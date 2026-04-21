import { NextResponse } from 'next/server';
import { getKsdinfoDividend, getEtfPrice } from "@/lib/kis/client";

export async function GET() {
    try {
        const symbol = '472150';
        
        const priceData = await getEtfPrice(symbol);
        
        const kstTemp = new Date(Date.now() + 9 * 60 * 60 * 1000);
        const tDt = kstTemp.toISOString().slice(0, 10).replace(/-/g, '');
        kstTemp.setFullYear(kstTemp.getFullYear() - 1);
        const fDt = kstTemp.toISOString().slice(0, 10).replace(/-/g, '');

        const dividends = await getKsdinfoDividend({
            gb1: '0',
            f_dt: fDt,
            t_dt: tDt,
            sht_cd: symbol,
        });

        return NextResponse.json({ priceData, dividends });
    } catch(e:any) {
        return NextResponse.json({ error: e.message });
    }
}
