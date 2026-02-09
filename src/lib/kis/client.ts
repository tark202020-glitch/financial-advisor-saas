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

export async function getMarketCapRanking(limit: number = 30): Promise<KisMarketCapItem[]> {
    const token = await getAccessToken();

    // TR_ID: FHPST01730000 (Market Cap Ranking)
    // URL: /uapi/domestic-stock/v1/ranking/market-cap
    // Params:
    // FID_COND_MRKT_DIV_CODE=J (J: KOSPI, Q: KOSDAQ)
    // FID_COND_SCR_DIV_CODE=20173
    // FID_INPUT_ISCD=0000 (All)
    // FID_DIV_CLS_CODE=0 (All)
    // FID_BLNG_CLS_CODE=0 (Average?) -> 0: Ordinary
    // FID_TRGT_CLS_CODE=111111111 (Target Class: 1=Include, 0=Exclude. 111111111 includes most)
    // FID_TRGT_XCLS_CODE=000000000 (Exclude Class: 0=None)
    // FID_INPUT_PRICE_1= (Empty)
    // FID_INPUT_PRICE_2= (Empty)
    // FID_VOL_CLS_CODE= (Empty)
    // FID_INPUT_DATE_1= (Empty)

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

    if (!response.ok) {
        console.error(`Failed to fetch Market Cap Ranking:`, await response.text());
        return [];
    }

    const data = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (Ranking): ${data.msg1}`);
        return [];
    }

    return data.output || [];
}
