
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET } from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol') || '000240';
    const token = await getAccessToken();

    // inquire-price-2 API (FHKST01010200)
    const priceRes = await fetch(
        `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price-2?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST01010200",
            "custtype": "P"
        }
    });
    const priceData = await priceRes.json();
    const output = priceData.output || {};

    const dividendFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(output)) {
        if (key.includes('divi') || key.includes('dvid') || key.includes('dryy') || key.includes('stck_d') || key.includes('hts_d') || key.includes('bstp_d') || key.includes('ssts') || key.includes('dvdn') || key.includes('배당')) {
            dividendFields[key] = value;
        }
    }

    return NextResponse.json({
        symbol,
        api: 'inquire-price-2 (FHKST01010200)',
        dividendFields,
        allFieldKeys: Object.keys(output).sort(),
        allFieldCount: Object.keys(output).length,
        rawSample: Object.fromEntries(Object.entries(output).slice(0, 30)),
    });
}
