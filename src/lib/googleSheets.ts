import { google } from 'googleapis';

/**
 * Google Sheets API 헬퍼
 *
 * MSCI 데이터를 Google Sheets에 누적 저장합니다.
 * 서비스 계정 인증을 사용합니다.
 */

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
        throw new Error('Google Sheets credentials not configured');
    }

    return new google.auth.JWT({
        email,
        key: privateKey,
        scopes: SCOPES,
    });
}

/**
 * MSCI 데이터를 Google Sheets에 행 추가 (append)
 *
 * 시트 컬럼: 날짜 | 종목명 | 종목코드 | MSCI비중(%) | 시총(조원) | KOSPI보정비율(%) | 차이(p)
 */
export async function appendMSCIToSheets(
    data: Array<{
        name: string;
        code: string;
        msciWeight: number;
        marketCapTrillion: number;
        adjustedRatio: number;
        diff: number;
    }>,
    dateStr: string
): Promise<{ success: boolean; updatedRange?: string; error?: string }> {
    const sheetId = process.env.MSCI_GOOGLE_SHEET_ID;
    if (!sheetId) {
        return { success: false, error: 'MSCI_GOOGLE_SHEET_ID not configured' };
    }

    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // 헤더가 없으면 먼저 추가
        const headerCheck = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "'시트1'!A1:G1",
        });

        if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: "'시트1'!A1:G1",
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['날짜', '종목명', '종목코드', 'MSCI비중(%)', '시총(조원)', 'KOSPI보정비율(%)', '차이(p)']],
                },
            });
        }

        // 데이터 행 구성
        const rows = data.map(item => [
            dateStr,
            item.name,
            item.code,
            item.msciWeight.toFixed(2),
            item.marketCapTrillion > 0 ? Math.round(item.marketCapTrillion).toString() : '-',
            item.adjustedRatio.toFixed(2),
            (item.diff > 0 ? '+' : '') + item.diff.toFixed(2),
        ]);

        // 합계 행 추가
        const totalMsci = data.reduce((s, d) => s + d.msciWeight, 0);
        const totalMcap = data.reduce((s, d) => s + d.marketCapTrillion, 0);
        const totalAdj = data.reduce((s, d) => s + d.adjustedRatio, 0);
        const totalDiff = data.reduce((s, d) => s + d.diff, 0);
        rows.push([
            dateStr,
            '합계',
            '-',
            totalMsci.toFixed(2),
            totalMcap > 0 ? Math.round(totalMcap).toString() : '-',
            totalAdj.toFixed(2),
            (totalDiff > 0 ? '+' : '') + totalDiff.toFixed(2),
        ]);

        // 빈 구분 행 추가 (날짜별 시각적 구분)
        rows.push(['', '', '', '', '', '', '']);

        // Append
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: "'시트1'!A:G",
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: rows,
            },
        });

        console.log(`[GoogleSheets] MSCI data appended: ${rows.length} rows, range: ${result.data.updates?.updatedRange}`);

        return {
            success: true,
            updatedRange: result.data.updates?.updatedRange || undefined,
        };
    } catch (error: any) {
        console.error('[GoogleSheets] Append failed:', error.message);
        return { success: false, error: error.message };
    }
}
