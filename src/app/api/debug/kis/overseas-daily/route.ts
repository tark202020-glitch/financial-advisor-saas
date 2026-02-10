import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = "https://openapi.koreainvestment.com:9443";
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;

async function getToken() {
    // Reuse existing token logic or get fresh
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

        const url = `${BASE_URL}/uapi/overseas-price/v1/quotations/daily-price?AUTH=&EXCD=${excd}&SYMB=${symbol}&GUBN=0&BYMD=${today}&MODP=1`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "HHDFS76240000",
            },
        });

        const rawText = await response.text();

        return NextResponse.json({
            status: response.status,
            url,
            excd,
            symbol,
            today,
            rawResponsePreview: rawText.slice(0, 3000),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
