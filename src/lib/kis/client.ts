import { KisTokenResponse, KisDomStockPrice, KisOvStockPrice, KisResponse, KisDomIndexPrice, KisWebSocketApprovalResponse, KisIndexChartResponse, KisMarketCapItem } from './types';
import { getUSExchangeCode } from './exchange';
import { kisRateLimiter } from './rateLimiter';
export { kisRateLimiter };

export const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
export const APP_KEY = process.env.KIS_APP_KEY;
export const APP_SECRET = process.env.KIS_APP_SECRET;
const CANO = process.env.KIS_CANO;
const ACNT_PRDT_CD = process.env.KIS_ACNT_PRDT_CD || "01";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

import { getStoredToken, saveToken } from './tokenManager';

export async function getAccessToken(): Promise<string> {
    // 1. In-Memory Cache (Fastest)
    if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
        return cachedToken;
    }

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("KIS API Keys are missing in .env.local");
    }

    // 2. Supabase Cache (Persistent)
    const storedToken = await getStoredToken();
    if (storedToken) {
        // console.log("[KIS] Using Token from Supabase");
        cachedToken = storedToken;
        // Assume valid for at least 5 mins (buffer checked in manager)
        // We don't know exact expiry here without querying DB again or changing manager return type.
        // Let's set memory expiry to 5 mins to force re-check with DB occasionally, or just rely on DB check next time if memory invalid.
        // Actually, if we just set cachedToken, we need tokenExpiresAt.
        // Let's set it to Date.now() + 1 hour safely, or just 10 minutes to be safe.
        // Better: Manager returns expiry? No, string.
        // Let's just set it to +5 minutes so we re-verify with DB often enough but not every request.
        tokenExpiresAt = Date.now() + (5 * 60 * 1000);
        return cachedToken;
    }

    console.log("Fetching new KIS Access Token...");

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET,
        }),
    }));

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch token:", errorText);
        throw new Error(`Failed to fetch KIS token: ${response.status} ${response.statusText}`);
    }

    const data: KisTokenResponse = await response.json();

    cachedToken = data.access_token;
    // expires_in is usually seconds (86400).
    const expiresIn = data.expires_in;
    tokenExpiresAt = Date.now() + (expiresIn * 1000);

    // 3. Save to Supabase
    // Run in background (don't await to speed up response?) 
    // Vercel might kill bg tasks. Better await.
    await saveToken(cachedToken, expiresIn);

    return cachedToken;
}

export async function getDomesticPrice(symbol: string): Promise<KisDomStockPrice | null> {
    const token = await getAccessToken();

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST01010100", // Current Price Inquiry TR ID
        },
    }));

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch DOM price for ${symbol}: ${text}`);
    }

    const data: KisResponse<KisDomStockPrice> = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (DOM): ${data.msg1}`);
        throw new Error(`KIS API Error (DOM): ${data.msg1} (Code: ${data.msg_cd})`);
    }

    return data.output;
}

export async function getOverseasPrice(symbol: string): Promise<KisOvStockPrice | null> {
    const token = await getAccessToken();
    // Assuming NASDAQ (NAS) for US stocks simplification. Real implementation might need exchange code logic.
    // DNAS: Dollar NASDAQ
    const exchangeCode = getUSExchangeCode(symbol);

    // Helper for fetching
    const fetchPrice = async (exch: string) => {
        return await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=${exch}&SYMB=${symbol}`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "HHDFS00000300",
            },
        }));
    };

    // 1. Initial Request
    let response = await fetchPrice(exchangeCode);
    let data: KisResponse<KisOvStockPrice> = await response.json();

    // 2. Retry Logic (Aggressive)
    // Retry if:
    // a) rt_cd is 0 but output is empty (Success but no data)
    // b) rt_cd is NOT 0 (Error, potentially "Symbol not found" due to wrong exchange)
    const shouldRetry = (data.rt_cd === "0" && (!data.output || !data.output.last || data.output.last === "")) ||
        (data.rt_cd !== "0");

    if (shouldRetry) {
        console.warn(`[KIS] Failed/Empty for ${symbol} (${exchangeCode}). Retrying with alternate exchange...`);

        const altExchange = exchangeCode === 'NYS' ? 'NAS' : 'NYS'; // Toggle
        const altResponse = await fetchPrice(altExchange);
        const altData: KisResponse<KisOvStockPrice> = await altResponse.json();

        // If alt worked, use it. 
        // We accept altData if it is Success AND has data.
        if (altData.rt_cd === "0" && altData.output && altData.output.last) {
            data = altData;
        } else {
            // If alt also failed, logging it but we will return original error/empty below unless alt error is more descriptive?
            // Let's keep original data if alt failed too, or maybe altData is better?
            // If original was "Error" and alt is "Error", both are bad.
            // If original was "Empty" and alt is "Error", probably original was better (wrong exchange but no error).
            // Actually, if retry failed, we probably want to return null.
        }
    }

    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (OV) for ${symbol}: ${data.msg1} (Code: ${data.rt_cd})`);
        throw new Error(`KIS API Error (OV) for ${symbol}: ${data.msg1} (Code: ${data.rt_cd})`);
    }

    return data.output;
}

export async function getDomesticIndex(symbol: string): Promise<KisDomIndexPrice | null> {
    const token = await getAccessToken();

    // Date needed for Chart API (YYYYMMDD)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // 0001 = KOSPI, 1001 = KOSDAQ
    // TR ID: FHKUP03500100 (Daily Chart)
    // URL: inquire-daily-indexchartprice
    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${today}&FID_INPUT_DATE_2=${today}&FID_PERIOD_DIV_CODE=D`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKUP03500100",
        },
    }));

    if (!response.ok) {
        console.error(`Failed to fetch DOM Index for ${symbol}:`, await response.text());
        return null;
    }

    // Note: This API returns output1 (Snapshot) and output2 (Array) at the root, NOT inside 'output'
    // So we cast to KisIndexChartResponse directly
    const data: KisIndexChartResponse = await response.json();

    console.log(`[DEBUG] Index ${symbol} Raw:`, JSON.stringify(data, null, 2));

    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (DOM Index): ${data.msg1}`);
        return null;
    }

    return data.output1;
}

export async function getDomesticIndexHistory(symbol: string, startDate: string, endDate: string): Promise<any[] | null> {
    const token = await getAccessToken();

    // TR ID: FHKUP03500100 (Daily Chart)
    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${startDate}&FID_INPUT_DATE_2=${endDate}&FID_PERIOD_DIV_CODE=D`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKUP03500100",
        },
    }));

    if (!response.ok) {
        console.error(`Failed to fetch DOM Index History for ${symbol}:`, await response.text());
        return null;
    }

    const data: KisIndexChartResponse = await response.json();

    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (DOM Index History): ${data.msg1}`);
        return null;
    }

    // output2 contains the daily list
    return data.output2 || [];
}

let cachedApprovalKey: string | null = null;

export async function getWebSocketApprovalKey(): Promise<string> {
    if (cachedApprovalKey) {
        return cachedApprovalKey;
    }

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("KIS API Keys are missing");
    }

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/oauth2/Approval`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            secretkey: APP_SECRET,
        }),
    }));

    if (!response.ok) {
        console.error("Failed to get WS Approval Key:", await response.text());
        throw new Error("Failed to get WS Approval Key");
    }

    const data: KisWebSocketApprovalResponse = await response.json();
    cachedApprovalKey = data.approval_key;
    return cachedApprovalKey;
}

export async function getInvestorTrend(symbol: string = "005930"): Promise<any[] | null> {
    const token = await getAccessToken();

    // TR_ID: FHKST01010900 (Daily Investor Net Buying)
    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST01010900",
        },
    }));

    if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to fetch Investor Trend for ${symbol}:`, text);
        throw new Error(`HTTP Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (Investor): ${data.msg1}`);
        throw new Error(`KIS Error: ${data.msg1} (Code: ${data.msg_cd})`);
    }

    // Debugging: Log available keys to find the correct list
    // console.log(`[KIS-DEBUG] Investor Trend Keys: ${Object.keys(data).join(', ')}`);

    // Inquire Daily Investor typically uses 'output2' for the daily list history
    // But sometimes 'output' if it is a snapshot.
    const result = data.output2 || data.output;

    if (!result) {
        console.error(`[KIS-ERR] No 'output2' or 'output' in response:`, JSON.stringify(data).slice(0, 200));
        throw new Error("KIS Response missing output data");
    }

    return result;
}

export async function getMarketInvestorTrendDaily(symbol: string = "0001"): Promise<any[] | null> {
    const token = await getAccessToken();

    // TR_ID: FHPTJ04040000 (Market Investor Daily)

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // 1 Month ago
    const past = new Date();
    past.setMonth(past.getMonth() - 1);
    const pastStr = past.toISOString().slice(0, 10).replace(/-/g, "");

    const mrktCode = symbol === '0001' ? 'KSP' : (symbol === '1001' ? 'KSQ' : 'KSP');

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor-daily-by-market?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${pastStr}&FID_INPUT_ISCD_1=${mrktCode}&FID_INPUT_DATE_2=${todayStr}&FID_INPUT_ISCD_2=${symbol}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHPTJ04040000",
        },
    }));

    if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to fetch Market Investor Trend for ${symbol}:`, text);
        // Fallback or empty
        return [];
    }

    const data = await response.json();
    // Return output
    return data.output || [];
}

export async function getMarketInvestorTrendRealTime(symbol: string = "0001"): Promise<any[] | null> {
    const token = await getAccessToken();

    // Use Daily API (FHPTJ04040000) to get "Accumulated" data for the day.
    // Time API (FHPTJ04030000) returns 1-minute snapshot which is too small.

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Check if ETF
    if (symbol === 'ETF') {
        // ETF Market Code unknown for this API. Return empty to avoid error/confusion.
        return [];
    }

    let iscd = "0001";
    let mrktCode = "KSP";

    if (symbol === '0001') { // KOSPI
        iscd = "0001";
        mrktCode = "KSP";
    } else if (symbol === '1001') { // KOSDAQ
        iscd = "1001";
        mrktCode = "KSQ";
    }

    // TR_ID: FHPTJ04040000 (Market Investor Daily)
    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor-daily-by-market?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${iscd}&FID_INPUT_DATE_1=${todayStr}&FID_INPUT_ISCD_1=${mrktCode}&FID_INPUT_DATE_2=${todayStr}&FID_INPUT_ISCD_2=${iscd}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHPTJ04040000",
        },
        cache: 'no-store'
    }));

    if (!response.ok) {
        console.warn(`[KIS] RealTime (Daily) Investor failed:`, await response.text());
        return null;
    }

    const data = await response.json();
    let output = data.output || [];

    // Sort by date descending (though we only asked for today, just in case)
    if (output.length > 0) {
        // If today is holiday or pre-market, it might be empty.
        // If empty, frontend will show 0 or -.
        return output;
    }

    return [];
}

export async function getOverseasIndex(symbol: string): Promise<KisOvStockPrice | null> {
    const token = await getAccessToken();
    const exchangeCode = getUSExchangeCode(symbol);

    // Use Index Chart API to get latest price (Minute Chart)
    // TR_ID: FHKST03030200
    // URL: inquire-time-indexchartprice

    // Initial Request
    let response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/overseas-price/v1/quotations/inquire-time-indexchartprice?FID_COND_MRKT_DIV_CODE=N&FID_INPUT_ISCD=${symbol}&FID_HOUR_CLS_CODE=0&FID_PW_DATA_INCU_YN=Y`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST03030200",
        },
    }));

    if (!response.ok) {
        // const text = await response.text(); 
        // console.error...
        return null;
    }

    const data = await response.json();

    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (OV Index): ${data.msg1}`);
        return null;
    }

    const output1 = data.output1;
    const output2 = data.output2;

    if (!output1) return null;

    let date = '';
    let time = '';

    // Attempt to find Date/Time in output2 (Time Series)
    if (output2 && output2.length > 0) {
        // Log keys of the first item to debug
        // logDebug({ symbol, output2_keys: Object.keys(output2[0]) });

        const latest = output2[0];

        date = latest.stck_bsop_date || latest.ymd || latest.ac_date || latest.xymd || '';
        time = latest.stck_cntg_hour || latest.hms || latest.ac_time || latest.xhms || '';

        if (output2.length > 1) {
            const lastItem = output2[output2.length - 1];
            const lastDate = lastItem.stck_bsop_date || lastItem.ymd || lastItem.ac_date || lastItem.xymd || '';
            if (lastDate > date) {
                date = lastDate;
                time = lastItem.stck_cntg_hour || lastItem.hms || lastItem.ac_time || lastItem.xhms || '';
            }
        }
    } else {
        // Fallback: Use Current Server Time (Korea Time)
        // KIS API didn't return time series (maybe closed or restricted).
        // generating 'YYYYMMDD' and 'HHMMSS'
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kst = new Date(now.getTime() + kstOffset); // UTC+9 (Approx, server might be UTC)

        // Actually, just use ISO string parts if server is in UTC.
        // Let's assume server is UTC.
        // We want to show "mm/dd hh:mm" in Frontend.
        // Let's provide standard format or parts.

        // Formating manually to match YYYYMMDD HHMMSS
        const yyyy = kst.getUTCFullYear().toString();
        const mm = (kst.getUTCMonth() + 1).toString().padStart(2, '0');
        const dd = kst.getUTCDate().toString().padStart(2, '0');
        const hh = kst.getUTCHours().toString().padStart(2, '0');
        const min = kst.getUTCMinutes().toString().padStart(2, '0');
        const ss = kst.getUTCSeconds().toString().padStart(2, '0');

        date = `${yyyy}${mm}${dd}`;
        time = `${hh}${min}${ss}`;
    }

    return {
        last: output1.ovrs_nmix_prpr,
        diff: output1.ovrs_nmix_prdy_vrss,
        rate: output1.ovrs_nmix_prdy_ctrt || output1.prdy_ctrt, // Handle aliasing if needed
        tvol: '0',
        date: date,
        time: time,
        isDelay: true
    } as KisOvStockPrice;
}

export interface KisFinancialStats {
    per: string;
    pbr: string;
    eps: string;
    bps: string;
    market_cap: string; // hts_avls (Market Cap)
    sector_name: string; // bstp_kor_isnm
}

export async function getFinancialStats(symbol: string): Promise<KisFinancialStats | null> {
    const priceData = await getDomesticPrice(symbol);
    if (!priceData) return null;

    // KIS "Inquire Price" (FHKST01010100) returns these fields in 'output':
    // per, pbr, eps, bps, hts_avls (Market Cap), bstp_kor_isnm (Sector)
    // We already have `KisDomStockPrice` interface, let's verify if it has them.
    // If not, we might need to cast or extend the interface in `types.ts`.
    // Returning what we have.

    // Note: client.ts:52 getDomesticPrice returns KisDomStockPrice.
    // We might need to check if that interface includes PER/PBR or raw output has them.
    // Based on KIS docs, they are in the response. I'll cast to any for now to extract specific fields safely.
    const raw = priceData as any;

    return {
        per: raw.per || '-',
        pbr: raw.pbr || '-',
        eps: raw.eps || '-',
        bps: raw.bps || '-',
        market_cap: raw.hts_avls || '-',
        sector_name: raw.bstp_kor_isnm || '-'
    };
}

// Phase 6: Advanced Financials (TR IDs provided by User)
// Note: These paths are estimated. If 500/404, they return null.

// Phase 6: Advanced Financials (Official URLs provided by User)

export async function getIncomeStatement(symbol: string): Promise<any | null> {
    // TR_ID: FHKST66430200 (Income Statement)
    // URL: /uapi/domestic-stock/v1/finance/income-statement
    return await fetchGenericFinance("FHKST66430200", "/uapi/domestic-stock/v1/finance/income-statement", symbol);
}

export async function getFinancialRatio(symbol: string): Promise<any | null> {
    // TR_ID: FHKST66430300 (Financial Ratio / 재무비율)
    // URL: /uapi/domestic-stock/v1/finance/financial-ratio
    return await fetchGenericFinance("FHKST66430300", "/uapi/domestic-stock/v1/finance/financial-ratio", symbol);
}

export async function getGrowthRatio(symbol: string): Promise<any | null> {
    // TR_ID: FHKST66430800 (Growth Ratio / 성장성)
    // URL: /uapi/domestic-stock/v1/finance/growth-ratio
    return await fetchGenericFinance("FHKST66430800", "/uapi/domestic-stock/v1/finance/growth-ratio", symbol);
}

export async function getInvestorOpinion(symbol: string, startDate: string, endDate: string): Promise<any | null> {
    const token = await getAccessToken();
    // TR_ID: FHKST663300C0 (Investment Opinion)
    // URL: invest-opinion

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/invest-opinion?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=16633&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${startDate}&FID_INPUT_DATE_2=${endDate}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST663300C0",
            "custtype": "P"
        },
    }));

    if (!response.ok) {
        console.warn(`[KIS] Failed Invest Opinion for ${symbol}: ${response.status} ${response.statusText}`);
        return null;
    }

    const data = await response.json();
    if (data.rt_cd !== "0") {
        console.warn(`[KIS] Error Invest Opinion ${symbol}: ${data.msg1}`);
        return null;
    }
    return data.output || null;
}

export interface KisCandleData {
    stck_bsop_date: string; // YYYYMMDD
    stck_oprc: string; // Open
    stck_hgpr: string; // High
    stck_lwpr: string; // Low
    stck_clpr: string; // Close
    acml_vol: string; // Volume
}

export async function getDailyPriceHistory(symbol: string): Promise<KisCandleData[] | null> {
    const token = await getAccessToken();

    // TR_ID: FHKST01010400 (Domestic Stock Current Price Daily)
    // URL: inquire-daily-price
    // Period: D (Daily), Date: Today (or empty for latest 30)
    // We want 100 days for MAs (5/20/60/120) -> But limited to 30 usually in one call?
    // KIS "inquire-daily-price" usually returns 30 items.
    // For 120-day MA, we might need "inquire-daily-itemchartprice" (FHKST03010100) which allows range.
    // Let's stick to FHKST01010400 first as it's standard, and maybe use FHKST03010100 for longer history if needed.
    // Actually, FHKST03010100 is better for Charts (returns OHLCV for period).

    // TR_ID: FHKST03010100 (Daily Item Chart Price)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // Start date: 1 year ago for full MA context
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startYMD = startDate.toISOString().slice(0, 10).replace(/-/g, "");

    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=${startYMD}&FID_INPUT_DATE_2=${today}&FID_PERIOD_DIV_CODE=D&FID_ORG_ADJ_PRC=0`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKST03010100",
        },
    }));

    if (!response.ok) {
        console.error(`Failed to fetch Daily History for ${symbol}:`, await response.text());
        return null;
    }

    const data = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (Daily History): ${data.msg1}`);
        return null;
    }

    return data.output2; // List is in output2
}


export async function fetchGenericFinance(tr_id: string, path: string, symbol: string): Promise<any | null> {
    try {
        const token = await getAccessToken();
        const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}${path}?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${symbol}&FID_DIV_CLS_CODE=1`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": tr_id,
                "custtype": "P"
            },
        }));

        if (!response.ok) {
            console.warn(`[KIS] Failed ${tr_id}: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.rt_cd !== "0") {
            console.warn(`[KIS] Error ${tr_id}: ${data.msg1}`);
            return null;
        }
        return data.output || null;
    } catch (e) {
        console.error(`[KIS] Exception ${tr_id}:`, e);
        return null;
    }
}
// ... existing export generic functions

// ... existing export generic functions

// Pre-defined top KOSPI stocks by market cap (fallback for off-market hours)
const TOP_KOSPI_STOCKS: { symbol: string; name: string }[] = [
    { symbol: '005930', name: '삼성전자' },
    { symbol: '000660', name: 'SK하이닉스' },
    { symbol: '373220', name: 'LG에너지솔루션' },
    { symbol: '207940', name: '삼성바이오로직스' },
    { symbol: '005380', name: '현대자동차' },
    { symbol: '000270', name: '기아' },
    { symbol: '068270', name: '셀트리온' },
    { symbol: '005490', name: 'POSCO홀딩스' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '055550', name: '신한지주' },
    { symbol: '105560', name: 'KB금융' },
    { symbol: '003670', name: '포스코퓨처엠' },
    { symbol: '006400', name: '삼성SDI' },
    { symbol: '012330', name: '현대모비스' },
    { symbol: '028260', name: '삼성물산' },
    { symbol: '035720', name: '카카오' },
    { symbol: '066570', name: 'LG전자' },
    { symbol: '051910', name: 'LG화학' },
    { symbol: '003550', name: 'LG' },
    { symbol: '032830', name: '삼성생명' },
    { symbol: '034730', name: 'SK' },
    { symbol: '096770', name: 'SK이노베이션' },
    { symbol: '030200', name: 'KT' },
    { symbol: '000810', name: '삼성화재' },
    { symbol: '086790', name: '하나금융지주' },
    { symbol: '017670', name: 'SK텔레콤' },
    { symbol: '316140', name: '우리금융지주' },
    { symbol: '009150', name: '삼성전기' },
    { symbol: '034020', name: '두산에너빌리티' },
    { symbol: '033780', name: 'KT&G' },
    { symbol: '138040', name: '메리츠금융지주' },
    { symbol: '011200', name: 'HMM' },
    { symbol: '010130', name: '고려아연' },
    { symbol: '018260', name: '삼성에스디에스' },
    { symbol: '036570', name: '엔씨소프트' },
    { symbol: '015760', name: '한국전력' },
    { symbol: '047050', name: '포스코인터내셔널' },
    { symbol: '003490', name: '대한항공' },
    { symbol: '259960', name: '크래프톤' },
    { symbol: '010950', name: 'S-Oil' },
    { symbol: '024110', name: '기업은행' },
    { symbol: '011170', name: '롯데케미칼' },
    { symbol: '090430', name: '아모레퍼시픽' },
    { symbol: '352820', name: '하이브' },
    { symbol: '161390', name: '한국타이어앤테크놀로지' },
    { symbol: '326030', name: 'SK바이오팜' },
    { symbol: '004020', name: '현대제철' },
    { symbol: '267250', name: 'HD현대' },
    { symbol: '009540', name: '한국조선해양' },
    { symbol: '010140', name: '삼성중공업' },
];

export async function getMarketCapRanking(limit: number = 30): Promise<KisMarketCapItem[]> {
    const token = await getAccessToken();

    // TR_ID: FHPST01730000 (Market Cap Ranking)
    // URL: /uapi/domestic-stock/v1/ranking/market-cap
    // NOTE: This API only returns data during market hours (09:00~15:30 KST).
    //       For off-market hours, we use a fallback with pre-defined stocks.

    try {
        const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?FID_COND_MRKT_DIV_CODE=J&FID_COND_SCR_DIV_CODE=20173&FID_INPUT_ISCD=0000&FID_DIV_CLS_CODE=0&FID_BLNG_CLS_CODE=0&FID_TRGT_CLS_CODE=111111111&FID_TRGT_XCLS_CODE=000000000&FID_INPUT_PRICE_1=&FID_INPUT_PRICE_2=&FID_VOL_CLS_CODE=&FID_INPUT_DATE_1=`, {
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

        if (response.ok) {
            const data = await response.json();
            if (data.rt_cd === "0" && Array.isArray(data.output) && data.output.length > 0) {
                console.log(`[MarketCapRanking] Live data: ${data.output.length} items`);
                return data.output.slice(0, limit);
            }
            console.warn(`[MarketCapRanking] API returned rt_cd="${data.rt_cd}", msg="${data.msg1}" — likely off-market hours. Using fallback.`);
        } else {
            console.warn(`[MarketCapRanking] HTTP ${response.status} — Using fallback.`);
        }
    } catch (e) {
        console.warn(`[MarketCapRanking] Exception:`, e, '— Using fallback.');
    }

    // === FALLBACK: Use pre-defined stocks and fetch individual prices ===
    console.log(`[MarketCapRanking] Fallback mode: fetching ${Math.min(limit, TOP_KOSPI_STOCKS.length)} individual stocks...`);
    const fallbackStocks = TOP_KOSPI_STOCKS.slice(0, limit);
    const results: KisMarketCapItem[] = [];

    // Fetch in chunks of 5 to avoid rate limiting
    const chunkSize = 5;
    for (let i = 0; i < fallbackStocks.length; i += chunkSize) {
        const chunk = fallbackStocks.slice(i, i + chunkSize);
        const promises = chunk.map(async (stock) => {
            try {
                const res = await kisRateLimiter.add(() => fetch(
                    `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${stock.symbol}`, {
                    method: "GET",
                    headers: {
                        "content-type": "application/json",
                        "authorization": `Bearer ${token}`,
                        "appkey": APP_KEY!,
                        "appsecret": APP_SECRET!,
                        "tr_id": "FHKST01010100",
                    },
                }));

                if (!res.ok) return null;
                const data = await res.json();
                if (data.rt_cd !== "0") return null;

                const output = data.output;
                return {
                    mksc_shrn_iscd: stock.symbol,
                    mksc_shra: stock.symbol,
                    hts_kor_isnm: stock.name,
                    stck_prpr: output.stck_prpr || '0',
                    prdy_vrss: output.prdy_vrss || '0',
                    prdy_ctrt: output.prdy_ctrt || '0',
                    acml_vol: output.acml_vol || '0',
                    stck_avls: output.hts_avls || '0',
                    lstn_stcn: output.lstn_stcn || '0',
                    per: output.per || '0',
                    pbr: output.pbr || '0',
                } as KisMarketCapItem;
            } catch {
                return null;
            }
        });

        const chunkResults = await Promise.all(promises);
        chunkResults.forEach(r => { if (r) results.push(r); });
    }

    console.log(`[MarketCapRanking] Fallback returned ${results.length} items`);
    return results;
}
