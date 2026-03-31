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

// ======== ETF 보유종목 — V3: 행=날짜, 열=종목, ETF별 개별 시트 탭 ========

const MAX_HOLDING_SLOTS = 20; // 최대 20개 종목 슬롯 (현재 TOP10이지만 여유 확보)


interface ETFHoldingData {
    etfName: string;
    etfSymbol: string;
    category: string;
    holdings: Array<{
        holding_symbol: string;
        holding_name: string;
        weight_pct: number;
    }>;
}

/**
 * ETF별 시트 탭 이름 생성 (Google Sheets 탭 이름 규칙 준수)
 * - 최대 100자, /, \, ?, *, [, ] 사용 불가
 */
function getETFSheetName(etfName: string, etfSymbol: string): string {
    const safeName = etfName
        .replace(/[\/\\?*\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const tabName = `${safeName}_${etfSymbol}`;
    return tabName.slice(0, 100);
}



/**
 * 헤더 행 생성
 * 날짜 | #1 종목명 | #1 코드 | #1 비중(%) | #2 종목명 | #2 코드 | #2 비중(%) | ... | #20
 */
function buildHeaderRow(): string[] {
    const header: string[] = ['날짜'];
    for (let i = 1; i <= MAX_HOLDING_SLOTS; i++) {
        header.push(`#${i} 종목명`, `#${i} 코드`, `#${i} 비중(%)`);
    }
    return header;
}

/**
 * 날짜별 데이터 행 생성
 * - holdings 배열의 순서대로 3열씩 배치 (비중 내림차순으로 정렬되어 들어옴)
 * - 빈 슬롯은 공란 처리
 */
function buildDateRow(dateStr: string, holdings: ETFHoldingData['holdings']): string[] {
    const row: string[] = [dateStr];
    for (let i = 0; i < MAX_HOLDING_SLOTS; i++) {
        if (i < holdings.length) {
            row.push(
                holdings[i].holding_name,
                holdings[i].holding_symbol,
                holdings[i].weight_pct.toFixed(2)
            );
        } else {
            row.push('', '', '');
        }
    }
    return row;
}

/**
 * ETF별 시트 탭 확인 및 생성
 * - reset=true 시 기존 탭 삭제 후 재생성
 */
async function ensureETFSheet(
    sheets: ReturnType<typeof google.sheets>,
    sheetId: string,
    tabName: string,
    reset: boolean = false
): Promise<void> {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingSheet = meta.data.sheets?.find(s => s.properties?.title === tabName);

    if (reset && existingSheet && existingSheet.properties?.sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
                requests: [{ deleteSheet: { sheetId: existingSheet.properties.sheetId } }],
            },
        });
        console.log(`[Sheets ETF] '${tabName}' 기존 탭 삭제 완료`);
    }

    if (!existingSheet || reset) {
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: tabName } } }],
                },
            });
            console.log(`[Sheets ETF] '${tabName}' 탭 생성`);
        } catch (e: any) {
            if (!e.message?.includes('already exists')) {
                throw e;
            }
        }
    }
}

/**
 * ETF 보유종목 데이터를 Google Sheets에 저장합니다.
 *
 * ★ V3 구조: 행=날짜, 열=종목, ETF별 개별 시트 탭
 *
 * 각 ETF에 대해 독립된 시트 탭을 생성하고:
 *   - 행 1: 헤더 (날짜 | #1 종목명 | #1 코드 | #1 비중(%) | ... | #20)
 *   - 행 2~: 날짜별 데이터 (매일 1행 추가, 비중 내림차순)
 *   - 동일 날짜 중복 실행 시 기존 행 업데이트 (덮어쓰기)
 *
 * 예시 (시트 탭 "TIGER AI반도체_365040"):
 *   | 날짜       | #1 종목명 | #1 코드 | #1 비중(%) | #2 종목명  | #2 코드 | #2 비중(%) | ...
 *   |------------|----------|---------|-----------|-----------|---------|-----------|----
 *   | 2026-03-20 | 삼성전자  | 005930  | 25.44     | SK하이닉스 | 000660  | 15.38     | ...
 *   | 2026-03-21 | 삼성전자  | 005930  | 25.44     | SK하이닉스 | 000660  | 15.38     | ...
 *   | 2026-03-23 | 삼성전자  | 005930  | 25.40     | SK하이닉스 | 000660  | 15.23     | ...
 */
export async function appendETFHoldingsHorizontal(
    etfDataList: ETFHoldingData[],
    dateStr: string,
    reset: boolean = false
): Promise<{ success: boolean; updatedCells?: number; error?: string }> {
    const sheetId = process.env.MSCI_GOOGLE_SHEET_ID;
    if (!sheetId) {
        return { success: false, error: 'MSCI_GOOGLE_SHEET_ID not configured' };
    }

    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        let totalUpdatedCells = 0;

        for (const etf of etfDataList) {
            const tabName = getETFSheetName(etf.etfName, etf.etfSymbol);

            // 1. 시트 탭 확인/생성
            await ensureETFSheet(sheets, sheetId, tabName, reset);

            // 2. 기존 데이터 읽기
            let existingData: string[][] = [];
            try {
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId: sheetId,
                    range: `'${tabName}'`,
                });
                existingData = res.data.values || [];
            } catch {
                existingData = [];
            }

            // 3. 시트가 비어있으면 헤더 + 첫 데이터 행 작성
            if (existingData.length === 0) {
                const header = buildHeaderRow();
                const dataRow = buildDateRow(dateStr, etf.holdings);

                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: `'${tabName}'!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [header, dataRow] },
                });
                totalUpdatedCells += header.length + dataRow.length;
                console.log(`[Sheets ETF] '${tabName}' 신규 생성: 헤더 + 1행`);
                continue;
            }

            // 4. 동일 날짜 행이 있으면 업데이트, 없으면 추가
            let dateRowIndex = -1;
            for (let r = 1; r < existingData.length; r++) {
                if ((existingData[r]?.[0] || '').trim() === dateStr) {
                    dateRowIndex = r;
                    break;
                }
            }

            const dataRow = buildDateRow(dateStr, etf.holdings);

            if (dateRowIndex >= 0) {
                // 기존 날짜 행 덮어쓰기
                const rowNum = dateRowIndex + 1; // Google Sheets는 1-indexed
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: `'${tabName}'!A${rowNum}`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [dataRow] },
                });
                totalUpdatedCells += dataRow.length;
                console.log(`[Sheets ETF] '${tabName}' 기존 행 업데이트 (행 ${rowNum})`);
            } else {
                // 새 날짜 행 추가 (append)
                await sheets.spreadsheets.values.append({
                    spreadsheetId: sheetId,
                    range: `'${tabName}'!A:A`,
                    valueInputOption: 'RAW',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: [dataRow] },
                });
                totalUpdatedCells += dataRow.length;
                console.log(`[Sheets ETF] '${tabName}' 새 행 추가 (${dateStr})`);
            }
        }

        console.log(`[Sheets ETF] 전체 완료: ${etfDataList.length}개 ETF, ${totalUpdatedCells}셀 업데이트`);
        return { success: true, updatedCells: totalUpdatedCells };

    } catch (error: any) {
        console.error('[Sheets ETF] 저장 실패:', error.message);
        return { success: false, error: error.message };
    }
}
