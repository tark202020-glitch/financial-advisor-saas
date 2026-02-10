import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = "https://openapi.koreainvestment.com:9443";
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;

async function getToken() {
    const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        }),
    });
    const data = await res.json();
    return data.access_token;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    const excd = searchParams.get('excd') || 'NAS';

    try {
        const token = await getToken();
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const today = kst.toISOString().slice(0, 10).replace(/-/g, "");

        const headers: any = {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
        };

        // Test multiple possible API endpoints
        const endpoints = [
            {
                name: "dailyprice (no hyphen)",
                url: `${BASE_URL}/uapi/overseas-price/v1/quotations/dailyprice?AUTH=&EXCD=${excd}&SYMB=${symbol}&GUBN=0&BYMD=${today}&MODP=1`,
                tr_id: "HHDFS76240000"
            },
            {
                name: "daily-price (with hyphen)",
                url: `${BASE_URL}/uapi/overseas-price/v1/quotations/daily-price?AUTH=&EXCD=${excd}&SYMB=${symbol}&GUBN=0&BYMD=${today}&MODP=1`,
                tr_id: "HHDFS76240000"
            },
            {
                name: "inquire-daily-chartprice",
                url: `${BASE_URL}/uapi/overseas-price/v1/quotations/inquire-daily-chartprice?FID_COND_MRKT_DIV_CODE=N&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${today}&FID_INPUT_DATE_2=${today}&FID_PERIOD_DIV_CODE=D`,
                tr_id: "FHKST03030100"
            },
        ];

        const results: any[] = [];

        for (const ep of endpoints) {
            try {
                const res = await fetch(ep.url, {
                    method: "GET",
                    headers: { ...headers, "tr_id": ep.tr_id },
                });
                const rawText = await res.text();
                results.push({
                    name: ep.name,
                    status: res.status,
                    url: ep.url,
                    tr_id: ep.tr_id,
                    preview: rawText.slice(0, 2000),
                });
            } catch (e: any) {
                results.push({
                    name: ep.name,
                    error: e.message,
                });
            }
        }

        return NextResponse.json({ symbol, excd, today, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
