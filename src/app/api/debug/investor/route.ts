import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/kis/client';

const BASE_URL = "https://openapi.koreainvestment.com:9443";
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code2 = searchParams.get('code2') || 'S001';

    try {
        console.log("[DEBUG] Calling getAccessToken()...");
        const token = await getAccessToken();
        console.log("[DEBUG] Token obtained.");

        // TR_ID: FHPTJ04030000 (Investo Time by Market)
        const response = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market?FID_INPUT_ISCD=999&FID_INPUT_ISCD_2=${code2}`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!, // Trying export const
                "appsecret": APP_SECRET!,
                "tr_id": "FHPTJ04030000",
            }
        });

        const text = await response.text();
        return NextResponse.json({
            status: response.status,
            data: JSON.parse(text)
        });

    } catch (e: any) {
        return NextResponse.json({
            error: "Exception",
            message: e.message,
            stack: e.stack
        });
    }
}
