// Google Sheets 연결 테스트
const { google } = require('googleapis');

const EMAIL = 'jubot-50@rag-bighistory.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDBoIXbZb9uE1F0
uAvRf1DTWeWq6Hzj1ekgpc+wDjBAZEgNDIqbb+wyWEgDsOPukwL/B41tacOgvsHp
awF2SgqBXUL7M7odhpj/aZ5dZ5hL49ZHKR2O3X3gW0oIF4Z4CJ9Xwc10RISSaUbV
vkYjvEbyg0de/HmW6/cL90cLm8MFXE3y2XiaXxavjBcQc/UO8UAVGtEIPyvYOZwF
NELlOCyIf36lSy6ERjnW/GoO2rtkQ3fN7s+xGJJApe2lMHoVGcmG6f9PmFcNRSDM
oSgm9qsWFVlJEBQwA55EBe1oQimQxL5x0GbhvCeVFwVnsYg27/2K06FktZ7+IpOe
Ship4HpdAgMBAAECggEABYZdC2uV0MBAXMI7pBir57vy77N+jMm3wzS3/mAJRG0Y
GTc4ZUMGTFF0jJZpio8rULeYc3zHFjkbM1vYSNXIAvT0SlKphtomV3NeD3A7Sj8Q
CCvGKiNryhEQxbZWIeqtEUX4ZM7nsX3LhaHOQorGw3i3eqBdn87P18mQf2ZMZES3
LBDWVok+wd2c6FLfRiTnAZjkMH+U7+tqbMIDRRHiU0j3hc21mZmV8DJUJKMypOaV
L/3FWg+38zFIjACihbDd4cXAy6OaJlU/LE6eaQ/hvXF7O6Th/y43vxhXAETbBDgN
K/hsK2xCn/JBeyG/WR2RK9QgrrooopC7u2A7YaPLiQKBgQD90f2iu+xXjB0JBgpr
3NZJ4cDJS2wHvECL9ufwPm+Kl3OOA+n+ouELEH+0iznveM/v2yPFWfUeEGL5iIKf
EzL+9/8P9i3ZoQ+3C8SgNx7ayJUsRraQLWjXCu8sfpKEISvebS8TKpumveC/HK4Z
Td/yDVzqqcx2+4FW3YhdMTW/qwKBgQDDSjNlJoOLgzZF52V76hKXH+0Wmy3YVfgx
tYcvdRGLmp+t/gcwhcjocHp433C06EWFZ9jR9hFhuCtxVb2p9AWD1MkuIcfiMFRr
dQxY4zVXppdbIHOTVYkg2T+JP62NvgfYn2GDYIxfaMBYuKNDzmEMqwKN0T83Pmds
7R3l7WrGFwKBgCEYHSr3t7Qeh7aie/9eVu5hKgLU+6vyhrP5KHqxmVeHscBlkD/s
Os13hD8lHBO2O955Qyu7M/OMjWsdunJFTZPi//Wz0nyavHLQbP260iISnyibu7gG
w7GuMksp4a6qqI6iy82C87KE9WXVtnmEJtvnlCLgqtEkr9OEpQAJp4lrAoGBAJa5
LQOTfxFtGrVHC39gwCpdXKoG6JJAf8c12HlbPEhn9XffSIM9rjsfnJavtRga8JUu
+hvKc83cy8K0Lyb9jEgcMY1mSxQawv0QoI/2BFR64fRWDn2XFbgBlFUEjZmJIhsh
n6w7FvwIJ/QRxQhvP138moMEDWtAwahDNcEgxTjPAoGBALtBrHooSmpDhB+/p54l
H7+RmsnE2XhSP5r7uALHM9KHjJ6wtVfzcZAWQ0K/akETvveFS7+Fj0WmoIeeZP/J
23PjgB5Y6TkXzVpHaJm/Cin/sMrn9lyR4vUC1NSxqMiqxvPetwkkq+xP8ZN1W7ut
NeHQCAY1Az9Bban1Jwe9TAoN
-----END PRIVATE KEY-----
`;
const SHEET_ID = '1RoI5JFHGrABGr-sW2V3LXFvgBrwC1Lw4VyDGKlZ6QfE';

async function test() {
    console.log('=== Google Sheets 연결 테스트 ===\n');

    try {
        const auth = new google.auth.JWT({
            email: EMAIL,
            key: PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. 시트 읽기 테스트
        console.log('1. 스프레드시트 접근 테스트...');
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        console.log(`   ✅ 시트 이름: "${meta.data.properties.title}"`);
        console.log(`   탭: ${meta.data.sheets.map(s => s.properties.title).join(', ')}`);

        // 2. 테스트 데이터 쓰기
        console.log('\n2. 테스트 데이터 쓰기...');
        const testData = [
            ['날짜', '종목명', '종목코드', 'MSCI비중(%)', '시총(조원)', 'KOSPI보정비율(%)', '차이(p)'],
            ['2026-03-18', '삼성전자', '005930', '33.61', '520', '32.50', '+1.11'],
            ['2026-03-18', 'SK하이닉스', '000660', '18.99', '200', '19.50', '-0.51'],
        ];

        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: testData },
        });

        console.log(`   ✅ 쓰기 성공: ${result.data.updates.updatedRange}`);
        console.log(`   추가된 행: ${result.data.updates.updatedRows}`);

        console.log('\n=== 모든 테스트 통과 ✅ ===');
    } catch (e) {
        console.log(`   ❌ 실패: ${e.message}`);
        if (e.message.includes('not found')) {
            console.log('   → 스프레드시트 ID를 확인하세요');
        }
        if (e.message.includes('permission') || e.message.includes('403')) {
            console.log('   → 서비스 계정에 편집자 권한을 부여했는지 확인하세요');
        }
        if (e.message.includes('Sheets API') || e.message.includes('enabled')) {
            console.log('   → Google Cloud Console에서 Google Sheets API를 활성화하세요');
        }
    }
}

test();
