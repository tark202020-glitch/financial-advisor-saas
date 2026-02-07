import { NextResponse } from 'next/server';

const BASE_URL = process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443";
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;

async function getAccessTokenDebug() {
    const response = await fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        }),
    });
    return await response.json();
}

export async function GET() {
    try {
        if (!APP_KEY || !APP_SECRET) {
            return NextResponse.json({ error: "No API Keys" });
        }

        // 1. Get Token
        const tokenRes = await getAccessTokenDebug();
        if (!tokenRes.access_token) {
            return NextResponse.json({ error: "Token Failed", details: tokenRes });
        }
        const token = tokenRes.access_token;

        // 2. Fetch Investor Trend (Market - KOSPI 0001)
        // TR_ID: FHKUP03500300
        const response = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-index-investor?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=0001&FID_INPUT_DATE_1=&FID_INPUT_DATE_2=&FID_PERIOD_DIV_CODE=D`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "FHKUP03500300",
            },
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text;
        }

        return NextResponse.json({
            message: "Debug Investor Trend (FHKUP03500300)",
            status: response.status,
            kis_response: data
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
