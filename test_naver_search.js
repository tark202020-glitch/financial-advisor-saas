const https = require('https');

// Naver Mobile Search API (Supports Korean for both domestic and overseas)
// https://m.stock.naver.com/api/json/search/searchListJson.nhn?keyword=애플
const keyword = encodeURIComponent('애플');

const options = {
    hostname: 'm.stock.naver.com',
    port: 443,
    path: `/api/json/search/searchListJson.nhn?keyword=${keyword}`,
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log(JSON.parse(data));
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw output (first 200 chars):', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
