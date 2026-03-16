const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim().replace(/"/g, '');
        if (key && val) env[key] = val;
    }
});

const BASE_URL = env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443";
const APP_KEY = env.KIS_APP_KEY;
const APP_SECRET = env.KIS_APP_SECRET;

async function getToken() {
    const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            grant_type: "client_credentials",
            appkey: APP_KEY,
            appsecret: APP_SECRET
        })
    });
    const data = await res.json();
    console.log("Token response:", JSON.stringify(data).slice(0, 200));
    if (!data.access_token) {
        throw new Error("Failed to get token: " + JSON.stringify(data));
    }
    return data.access_token;
}

async function getPrice(token, symbol, marketCode) {
    const url = `${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=${marketCode}&FID_INPUT_ISCD=${symbol}`;
    console.log(`\nFetching ${symbol} (market=${marketCode})...`);
    
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`,
            "appkey": APP_KEY,
            "appsecret": APP_SECRET,
            "tr_id": "FHKST01010100",
        },
    });

    console.log(`  Status: ${res.status}`);
    
    if (!res.ok) {
        const text = await res.text();
        console.log(`  Error: ${text.slice(0, 500)}`);
        return null;
    }

    const data = await res.json();
    console.log(`  rt_cd: ${data.rt_cd}, msg_cd: ${data.msg_cd}, msg1: ${data.msg1}`);
    
    if (data.output) {
        console.log(`  stck_prpr (현재가): ${data.output.stck_prpr}`);
        console.log(`  prdy_vrss (전일대비): ${data.output.prdy_vrss}`);
        console.log(`  prdy_ctrt (등락률): ${data.output.prdy_ctrt}`);
        console.log(`  rprs_mrkt_kor_name: ${data.output.rprs_mrkt_kor_name}`);
    } else {
        console.log(`  No output data`);
        console.log(`  Full response: ${JSON.stringify(data).slice(0, 500)}`);
    }
    
    return data;
}

(async () => {
    try {
        console.log("=== KIS API Price Probe ===");
        console.log(`BASE_URL: ${BASE_URL}`);
        console.log(`APP_KEY: ${APP_KEY ? APP_KEY.slice(0, 8) + '...' : 'MISSING'}`);
        
        const token = await getToken();
        
        // Test several symbols with different market codes
        const testCases = [
            { symbol: '005930', market: 'J', name: '삼성전자 (KRX)' },
            { symbol: '005930', market: 'NX', name: '삼성전자 (NXT)' },
            { symbol: '373220', market: 'J', name: 'LG에너지솔루션 (KRX)' },
            { symbol: '069500', market: 'J', name: 'KODEX 200 ETF (KRX)' },
            { symbol: '069500', market: 'NX', name: 'KODEX 200 ETF (NXT)' },
            { symbol: '005380', market: 'J', name: '현대차 (KRX)' },
        ];
        
        for (const tc of testCases) {
            console.log(`\n--- ${tc.name} ---`);
            await getPrice(token, tc.symbol, tc.market);
            // Rate limit delay
            await new Promise(r => setTimeout(r, 300));
        }
        
        console.log("\n=== Done ===");
    } catch (e) {
        console.error("Fatal error:", e);
    }
})();
