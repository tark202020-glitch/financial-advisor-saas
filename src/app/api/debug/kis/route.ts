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

        // 2. Fetch Index (KOSPI 0001) - CORRECT URL (Daily Chart for Snapshot)
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const response = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=0001&FID_INPUT_DATE_1=${today}&FID_INPUT_DATE_2=${today}&FID_PERIOD_DIV_CODE=D`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY,
                "appsecret": APP_SECRET,
                "tr_id": "FHKUP03500100",
            },
        });

        const data = await response.json();

        return NextResponse.json({
            message: "Debug Raw Response (Fixed Endpoint)",
            status: response.status,
            kis_response: data
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
