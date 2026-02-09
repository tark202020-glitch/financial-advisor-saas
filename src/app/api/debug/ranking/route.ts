import { NextResponse } from 'next/server';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET, kisRateLimiter } from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = await getAccessToken();

        // Call the exact same URL as getMarketCapRanking
        const url = `${BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=20173&FID_INPUT_ISCD=0000&FID_DIV_CLS_CODE=0&FID_BLNG_CLS_CODE=0&FID_TRGT_CLS_CODE=111111111&FID_TRGT_XCLS_CODE=000000000&FID_INPUT_PRICE_1=&FID_INPUT_PRICE_2=&FID_VOL_CLS_CODE=&FID_INPUT_DATE_1=`;

        const response = await kisRateLimiter.add(() => fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "FHPST01730000",
                "custtype": "P"
            },
        }));

        const httpStatus = response.status;
        const httpStatusText = response.statusText;
        const rawText = await response.text();

        let parsed: any = null;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            // Not JSON
        }

        return NextResponse.json({
            debug: true,
            timestamp: new Date().toISOString(),
            request: {
                url: url.replace(APP_KEY!, '***').replace(APP_SECRET!, '***'),
                tr_id: "FHPST01730000",
            },
            response: {
                httpStatus,
                httpStatusText,
                rt_cd: parsed?.rt_cd,
                msg_cd: parsed?.msg_cd,
                msg1: parsed?.msg1,
                outputLength: Array.isArray(parsed?.output) ? parsed.output.length : 'NOT_ARRAY',
                outputSample: Array.isArray(parsed?.output) && parsed.output.length > 0
                    ? parsed.output.slice(0, 2)
                    : parsed?.output,
                rawResponsePreview: rawText.slice(0, 1000),
            },
            env: {
                hasAppKey: !!APP_KEY,
                hasAppSecret: !!APP_SECRET,
                baseUrl: BASE_URL,
                tokenPreview: token ? `${token.slice(0, 10)}...${token.slice(-5)}` : 'NO_TOKEN',
            }
        });
    } catch (e: any) {
        return NextResponse.json({
            debug: true,
            error: e.message,
            stack: e.stack?.slice(0, 500),
        }, { status: 500 });
    }
}
