const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim().replace(/"/g, '');
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
    return data.access_token;
}

const TR_ID = 'FHKST66430200';
const PATH = "/uapi/domestic-stock/v1/finance/income-statement";

// Try POST with Body
(async () => {
    console.log("Getting Token...");
    const token = await getToken();

    console.log(`\n--- Probing ${TR_ID} (POST) ---`);

    try {
        const url = `${BASE_URL}${PATH}`;

        const body = {
            FID_COND_MRKT_DIV_CODE: "J",
            FID_INPUT_ISCD: "005930",
            FID_DIV_CLS_CODE: "1"
        };

        console.log(`Trying POST to ${url}...`);

        const res = await fetch(url, {
            method: "POST", // Changed to POST
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${token}`,
                "appkey": APP_KEY,
                "appsecret": APP_SECRET,
                "tr_id": TR_ID,
                "custtype": "P"
            },
            body: JSON.stringify(body)
        });

        console.log(`[${res.status}]`);
        const txt = await res.text();
        console.log(`Body: ${txt.slice(0, 300)}`);

    } catch (e) {
        console.error(e);
    }
})();
