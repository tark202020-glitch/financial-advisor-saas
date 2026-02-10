
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET } from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol') || '000240'; // 한국앤컴퍼니 (HTS 결과에 있는 종목)
    const token = await getAccessToken();

    // inquire-price API (FHKST01010100)
    const priceRes = await fetch(
        `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST01010100",
            "custtype": "P"
        }
    });
    const priceData = await priceRes.json();

    // Extract all dividend-related fields
    const output = priceData.output || {};
    const dividendFields: Record<string, any> = {};
    const allFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(output)) {
        allFields[key] = value;
        if (key.includes('divi') || key.includes('dvid') || key.includes('dryy') || key.includes('stck_d') || key.includes('hts_d')) {
            dividendFields[key] = value;
        }
    }

    return NextResponse.json({
        symbol,
        timestamp: new Date().toISOString(),
        dividendFields,
        keyFields: {
            stck_prpr: output.stck_prpr, // 현재가
            per: output.per,
            pbr: output.pbr,
            eps: output.eps,
            bps: output.bps,
            hts_avls: output.hts_avls, // 시가총액
            acml_vol: output.acml_vol, // 거래량
        },
        allFieldKeys: Object.keys(output).sort(),
        allFieldCount: Object.keys(output).length,
    });
}
