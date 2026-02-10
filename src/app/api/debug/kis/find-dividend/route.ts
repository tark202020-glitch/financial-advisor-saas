
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, BASE_URL, APP_KEY, APP_SECRET } from '@/lib/kis/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol') || '000240';
    const token = await getAccessToken();

    const headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "appkey": APP_KEY!,
        "appsecret": APP_SECRET!,
        "custtype": "P"
    };

    // Try multiple financial APIs to find dividend data
    const apis = [
        { name: 'invest-indicator (FHKST66430200)', tr_id: 'FHKST66430200', path: '/uapi/domestic-stock/v1/finance/financial-ratio', div: '0' },
        { name: 'invest-indicator-1 (FHKST66430200)', tr_id: 'FHKST66430200', path: '/uapi/domestic-stock/v1/finance/financial-ratio', div: '1' },
        { name: 'other-major-ratio (FHKST66430500)', tr_id: 'FHKST66430500', path: '/uapi/domestic-stock/v1/finance/other-major-ratio', div: '0' },
        { name: 'stability-ratio (FHKST66430600)', tr_id: 'FHKST66430600', path: '/uapi/domestic-stock/v1/finance/stability-ratio', div: '0' },
        { name: 'income-statement (FHKST66430100)', tr_id: 'FHKST66430100', path: '/uapi/domestic-stock/v1/finance/income-statement', div: '0' },
        { name: 'balance-sheet (FHKST66430900)', tr_id: 'FHKST66430900', path: '/uapi/domestic-stock/v1/finance/balance-sheet', div: '0' },
    ];

    const results: Record<string, any> = {};

    for (const api of apis) {
        try {
            const res = await fetch(
                `${BASE_URL}${api.path}?FID_COND_MRKT_DIV_CODE=J&FID_DIV_CLS_CODE=${api.div}&FID_INPUT_ISCD=${symbol}`, {
                headers: { ...headers, tr_id: api.tr_id }
            });
            const data = await res.json();

            if (data.rt_cd === '0' && data.output) {
                const output = Array.isArray(data.output) ? data.output[0] : data.output;
                const fields = output ? Object.keys(output).sort() : [];
                const dividendFields: Record<string, any> = {};

                for (const [key, value] of Object.entries(output || {})) {
                    if (key.includes('divi') || key.includes('dvid') || key.includes('dvdn') || key.includes('stkd') || key.includes('배당')) {
                        dividendFields[key] = value;
                    }
                }

                results[api.name] = {
                    success: true,
                    fieldCount: fields.length,
                    fields,
                    dividendFields,
                    sample: output
                };
            } else {
                results[api.name] = { success: false, error: data.msg1 || data.msg_cd, rt_cd: data.rt_cd };
            }
        } catch (e: any) {
            results[api.name] = { success: false, error: e.message };
        }
    }

    return NextResponse.json({ symbol, results });
}
