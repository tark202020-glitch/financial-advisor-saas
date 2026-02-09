
import { NextRequest, NextResponse } from 'next/server';
import { getFinancialRatio, getGrowthRatio, getAccessToken, BASE_URL, APP_KEY, APP_SECRET, fetchGenericFinance } from '@/lib/kis/client';

export async function GET(request: NextRequest) {
    const symbol = '005930'; // Samsung
    const token = await getAccessToken();

    // Profit Ratio (FHKST66430400) - Not in standard client functions yet?
    // Let's call it manually using generic fetch style
    const profitRes = await fetch(`${BASE_URL}/uapi/domestic-stock/v1/finance/profit-ratio?FID_COND_MRKT_DIV_CODE=J&FID_DIV_CLS_CODE=0&fid_input_iscd=${symbol}`, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST66430400",
            "custtype": "P"
        }
    });
    const profitData = await profitRes.json();

    const [financial, growth] = await Promise.all([
        getFinancialRatio(symbol),
        getGrowthRatio(symbol)
    ]);

    return NextResponse.json({
        financial,
        growth,
        profit: profitData.output
    });
}
