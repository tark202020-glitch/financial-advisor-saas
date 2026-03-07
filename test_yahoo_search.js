const https = require('https');

const options = {
    hostname: 'query1.finance.yahoo.com',
    port: 443,
    path: '/v1/finance/search?q=SPY&quotesCount=5&newsCount=0',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(JSON.parse(data));
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
