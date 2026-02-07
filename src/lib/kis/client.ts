import { KisTokenResponse, KisDomStockPrice, KisOvStockPrice, KisResponse, KisDomIndexPrice, KisWebSocketApprovalResponse, KisIndexChartResponse } from './types';
import { getUSExchangeCode } from './exchange';
import { kisRateLimiter } from './rateLimiter';

const BASE_URL = (process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443").replace(/\/$/, "");
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_APP_SECRET;
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
        console.error(`Failed to fetch DOM price for ${symbol}:`, await response.text());
        return null;
    }

    const data: KisResponse<KisDomStockPrice> = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (DOM): ${data.msg1}`);
        return null;
    }

    return data.output;
}

export async function getOverseasPrice(symbol: string): Promise<KisOvStockPrice | null> {
    const token = await getAccessToken();
    // Assuming NASDAQ (NAS) for US stocks simplification. Real implementation might need exchange code logic.
    // DNAS: Dollar NASDAQ
    const exchangeCode = getUSExchangeCode(symbol);

    // Initial Request
    let response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=${exchangeCode}&SYMB=${symbol}`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "HHDFS00000300",
        },
    }));

    let data: KisResponse<KisOvStockPrice> = await response.json();

    // 2. Self-Healing: If Output is Empty (e.g. WMT might be NAS in KIS despite being NYSE), Try Alternate Exchange
    if (data.rt_cd === "0" && (!data.output || !data.output.last || data.output.last === "")) {
        console.warn(`[KIS] Empty data for ${symbol} (${exchangeCode}). Retrying with alternate exchange...`);

        const altExchange = exchangeCode === 'NYS' ? 'NAS' : 'NYS'; // Toggle
        response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=${altExchange}&SYMB=${symbol}`, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY!,
                "appsecret": APP_SECRET!,
                "tr_id": "HHDFS00000300",
            },
        }));

        const altData: KisResponse<KisOvStockPrice> = await response.json();
        /* If alt worked, use it */
        if (altData.rt_cd === "0" && altData.output && altData.output.last) {
            data = altData;
        }
    }

    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (OV): ${data.msg1}`);
        return null;
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

export async function getMarketInvestorTrend(symbol: string = "0001"): Promise<any[] | null> {
    const token = await getAccessToken();

    // TR_ID: FHKUP03500300 (Upjong/Index Daily Investor Net Buying)
    // URL: /uapi/domestic-stock/v1/quotations/inquire-daily-index-investor
    const response = await kisRateLimiter.add(() => fetch(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-index-investor?FID_COND_MRKT_DIV_CODE=U&FID_INPUT_ISCD=${symbol}&FID_INPUT_DATE_1=&FID_INPUT_DATE_2=&FID_PERIOD_DIV_CODE=D`, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY!,
            "appsecret": APP_SECRET!,
            "tr_id": "FHKUP03500300",
        },
    }));

    if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to fetch Market Investor Trend for ${symbol}:`, text);
        // Fallback: If 404/500, maybe standard stock API works for 0001? (We probed valid JSON but maybe empty).
        // Let's assume this path is correct for KIS "Inquire Daily Index Investor".
        throw new Error(`HTTP Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data.rt_cd !== "0") {
        console.error(`KIS API Error (Market Investor): ${data.msg1}`);
        throw new Error(`KIS Error: ${data.msg1} (Code: ${data.msg_cd})`);
    }

    // Index Investor TR returns 'output' as list (unlike Stock which uses output2) or verify.
    // Based on similar Index Chart TRs, it might be output2.
    // Let's check both.
    const result = data.output2 || data.output;
    return result;
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

export async function getInvestorOpinion(symbol: string): Promise<any | null> {
    return await fetchGenericFinance("FHKST663300C0", "/uapi/domestic-stock/v1/quotations/invest-opinion", symbol);
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


async function fetchGenericFinance(tr_id: string, path: string, symbol: string): Promise<any | null> {
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

