// ETF 보유종목 가로 누적 테스트 - 시트 삭제 후 재생성
const http = require('http');

const url = 'http://localhost:3000/api/cron/update-etf-holdings?reset=true';

console.log('Calling:', url);
console.log('Started at:', new Date().toLocaleString('ko-KR'));

const req = http.get(url, { timeout: 600000 }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log('\nStatus:', res.statusCode);
        try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch {
            console.log('Raw response:', data.slice(0, 2000));
        }
        console.log('Finished at:', new Date().toLocaleString('ko-KR'));
    });
});

req.on('timeout', () => {
    console.log('Request timed out after 10 minutes');
    req.destroy();
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});
