// Google Sheets 쓰기 테스트 (시트1 탭명 사용)
const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('rag-bighistory-4259f89a6cbd.json', 'utf8'));
const SHEET_ID = '1RoI5JFHGrABGr-sW2V3LXFvgBrwC1Lw4VyDGKlZ6QfE';

async function test() {
    const auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 헤더 + 샘플 데이터 쓰기
    const testData = [
        ['날짜', '종목명', '종목코드', 'MSCI비중(%)', '시총(조원)', 'KOSPI보정비율(%)', '차이(p)'],
        ['2026-03-18', '삼성전자', '005930', '33.61', '520', '32.50', '+1.11'],
        ['2026-03-18', 'SK하이닉스', '000660', '18.99', '200', '19.50', '-0.51'],
    ];

    try {
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: "'시트1'!A:G",
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: testData },
        });

        console.log('✅ Google Sheets 쓰기 성공!');
        console.log('   Range:', result.data.updates.updatedRange);
        console.log('   Rows:', result.data.updates.updatedRows);
    } catch (e) {
        console.log('❌ 실패:', e.message.slice(0, 300));
    }
}

test();
