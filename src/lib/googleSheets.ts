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

// ======== ETF 보유종목 가로(횡방향) 누적 ========

const ETF_SHEET_NAME = 'ETF보유종목';

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
 * ETF 보유종목 데이터를 Google Sheets에 가로(횡방향)으로 누적 저장합니다.
 *
 * ★ 새 구조 (V2 — 셀분리 + 편입/편출 자동 표현):
 *
 *   A열: 종목명 (또는 ETF 헤더)
 *   B열: 종목코드
 *   C열~: 날짜별 비중 (숫자, 단위 없음)
 *
 *   - 편입: 이전 날짜 빈칸 → 오늘 값 출현
 *   - 편출: 이전 날짜 값 → 오늘 빈칸 (행 유지, 값 안 씀)
 *   - 비중변동: 날짜별 숫자 비교로 파악 가능
 *
 * 예시:
 *   | A: 종목명        | B: 코드  | C: 03-19 | D: 03-20 | E: 03-21 |
 *   |------------------|----------|----------|----------|----------|
 *   | ■ TIGER AI (448570) [AI·테크] |   |          |          |          |
 *   | 삼성전자          | 005930   | 19.77    | 19.81    | 20.10    |
 *   | SK하이닉스        | 000660   | 11.62    | 11.64    |          | ← 편출
 *   | 대덕전자          | 353200   |          | 4.74     | 4.80     | ← 편입
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

        // 1. 시트 존재 확인 및 생성
        await ensureETFHoldingsSheet(sheets, sheetId, reset);

        // 2. 시트 전체 데이터 읽기
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `'${ETF_SHEET_NAME}'`,
        });

        const grid: string[][] = existingData.data.values || [];
        let updatedCells = 0;

        // 3. 시트가 비어있으면 전체 새로 작성
        if (grid.length === 0) {
            const allRows = buildFullSheetV2(etfDataList, dateStr);
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `'${ETF_SHEET_NAME}'!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: allRows },
            });
            updatedCells = allRows.reduce((sum, r) => sum + r.length, 0);
            console.log(`[Sheets ETF] 신규 시트 생성: ${allRows.length}행`);
            return { success: true, updatedCells };
        }

        // 4. 기존 시트에 날짜 열 추가/업데이트 (V2)
        const result = await updateExistingSheetV2(sheets, sheetId, grid, etfDataList, dateStr);
        return result;

    } catch (error: any) {
        console.error('[Sheets ETF] 가로 누적 실패:', error.message);
        return { success: false, error: error.message };
    }
}

/** ETF보유종목 시트 존재 확인 및 생성 */
async function ensureETFHoldingsSheet(
    sheets: ReturnType<typeof google.sheets>,
    sheetId: string,
    reset: boolean = false
) {
    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const existingSheet = meta.data.sheets?.find(s => s.properties?.title === ETF_SHEET_NAME);

        if (reset && existingSheet && existingSheet.properties?.sheetId !== undefined) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{ deleteSheet: { sheetId: existingSheet.properties.sheetId } }],
                },
            });
            console.log(`[Sheets ETF] '${ETF_SHEET_NAME}' 기존 시트 삭제 완료`);
        }

        if (!existingSheet || reset) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: ETF_SHEET_NAME } } }],
                },
            });
            console.log(`[Sheets ETF] '${ETF_SHEET_NAME}' 탭 생성`);
        }
    } catch (e: any) {
        if (!e.message?.includes('already exists')) {
            throw e;
        }
    }
}

/** ★ V2: 빈 시트에 전체 구조 새로 작성 (셀 분리) */
function buildFullSheetV2(etfDataList: ETFHoldingData[], dateStr: string): string[][] {
    const rows: string[][] = [];

    for (let i = 0; i < etfDataList.length; i++) {
        const etf = etfDataList[i];

        // ETF 블록 구분용 빈 행 (첫 ETF 제외)
        if (i > 0) rows.push([]);

        // ETF 헤더 행: A열에 ETF 식별 문자열, B열에 코드(파싱용)
        const catLabel = getCategoryLabel(etf.category);
        rows.push([
            `■ ${etf.etfName}`,
            `EF ${etf.etfSymbol}`,
            catLabel,
        ]);

        // 열 헤더: A=종목명, B=코드, C~=날짜
        rows.push(['구성종목', '코드', dateStr]);

        // 보유종목 행: A=이름, B=코드, C=비중(숫자)
        for (const h of etf.holdings) {
            rows.push([
                h.holding_name,
                h.holding_symbol,
                h.weight_pct.toFixed(2),
            ]);
        }
    }

    return rows;
}

/** ★ V2: 기존 시트에 날짜 열 추가/업데이트 */
async function updateExistingSheetV2(
    sheets: ReturnType<typeof google.sheets>,
    sheetId: string,
    grid: string[][],
    etfDataList: ETFHoldingData[],
    dateStr: string
): Promise<{ success: boolean; updatedCells?: number; error?: string }> {

    const newGrid = grid.map(row => [...row]);
    let updatedCells = 0;

    // 각 ETF 블록의 시작 행 인덱스를 찾기
    const blockMap = findETFBlocksV2(newGrid);

    for (const etf of etfDataList) {
        const blockKey = etf.etfSymbol;
        const block = blockMap.get(blockKey);

        if (block) {
            updatedCells += updateBlockV2(newGrid, block, etf, dateStr);
        } else {
            updatedCells += appendNewBlockV2(newGrid, etf, dateStr);
            // 새로 추가된 블록 반영을 위해 blockMap 재구축
            const newBlockMap = findETFBlocksV2(newGrid);
            for (const [k, v] of newBlockMap) blockMap.set(k, v);
        }
    }

    // 전체 시트 덮어쓰기 (열 길이 균등화)
    const maxCols = Math.max(...newGrid.map(r => r.length), 1);
    for (const row of newGrid) {
        while (row.length < maxCols) row.push('');
    }

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${ETF_SHEET_NAME}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: newGrid },
    });

    console.log(`[Sheets ETF] 가로 누적 완료: ${updatedCells}셀 업데이트, ${newGrid.length}행 × ${maxCols}열`);
    return { success: true, updatedCells };
}

interface ETFBlockV2 {
    headerRow: number;       // "■ ETF명" 행
    colHeaderRow: number;    // "구성종목 | 코드 | 날짜1 | 날짜2" 행
    holdingStartRow: number; // 첫 보유종목 행
    holdingEndRow: number;   // 마지막 보유종목 행 (exclusive)
    etfSymbol: string;
}

/** ★ V2: 시트에서 ETF 블록 위치 파악 (B열의 "EF xxxxxx" 패턴으로 감지) */
function findETFBlocksV2(grid: string[][]): Map<string, ETFBlockV2> {
    const blocks = new Map<string, ETFBlockV2>();
    let i = 0;

    while (i < grid.length) {
        const cellA = (grid[i]?.[0] || '').trim();
        const cellB = (grid[i]?.[1] || '').trim();

        // ETF 헤더 행 감지: A열이 "■"로 시작하고 B열이 "EF xxxxxx" 패턴
        if (cellA.startsWith('■')) {
            const symMatch = cellB.match(/^EF\s*(\d{6})/);
            if (symMatch) {
                const etfSymbol = symMatch[1];
                const headerRow = i;
                const colHeaderRow = i + 1;
                const holdingStartRow = i + 2;

                // 보유종목 행의 끝 탐색
                let endRow = holdingStartRow;
                while (endRow < grid.length) {
                    const nextA = (grid[endRow]?.[0] || '').trim();
                    const nextB = (grid[endRow]?.[1] || '').trim();
                    // 빈 행이거나 다른 ETF 헤더면 종료
                    if ((nextA === '' && nextB === '') || nextA.startsWith('■')) break;
                    endRow++;
                }

                blocks.set(etfSymbol, {
                    headerRow,
                    colHeaderRow,
                    holdingStartRow,
                    holdingEndRow: endRow,
                    etfSymbol,
                });

                i = endRow;
                continue;
            }
        }
        i++;
    }

    return blocks;
}

/** ★ V2: 기존 블록에 날짜 열 추가/업데이트 */
function updateBlockV2(grid: string[][], block: ETFBlockV2, etf: ETFHoldingData, dateStr: string): number {
    let updatedCells = 0;

    // 열 헤더 행에서 날짜 위치 확인 (C열부터 날짜)
    const colHeaderRow = grid[block.colHeaderRow] || ['구성종목', '코드'];
    // 열 헤더 길이 보장
    while (colHeaderRow.length < 2) colHeaderRow.push('');

    // 날짜 열 인덱스 찾기 (C열=index2 부터)
    let dateColIndex = -1;
    for (let c = 2; c < colHeaderRow.length; c++) {
        if (colHeaderRow[c]?.trim() === dateStr) {
            dateColIndex = c;
            break;
        }
    }

    if (dateColIndex === -1) {
        // 새 날짜 열 추가
        dateColIndex = colHeaderRow.length;
        colHeaderRow.push(dateStr);
        grid[block.colHeaderRow] = colHeaderRow;
        updatedCells++;
    }

    // 기존 보유종목의 코드 → 행 인덱스 맵 (B열 기반)
    const existingHoldingRows = new Map<string, number>();
    for (let r = block.holdingStartRow; r < block.holdingEndRow; r++) {
        const code = (grid[r]?.[1] || '').trim();
        if (code && /^\d{6}$/.test(code)) {
            existingHoldingRows.set(code, r);
        }
    }

    // 각 보유종목의 비중 기입
    for (const h of etf.holdings) {
        const rowIdx = existingHoldingRows.get(h.holding_symbol);

        if (rowIdx !== undefined) {
            // 기존 종목: 해당 날짜 열에 비중 업데이트
            while (grid[rowIdx].length <= dateColIndex) grid[rowIdx].push('');
            grid[rowIdx][dateColIndex] = h.weight_pct.toFixed(2);
            updatedCells++;
        } else {
            // ★ 편입 종목: 블록 끝에 행 삽입
            const newRow: string[] = [h.holding_name, h.holding_symbol];
            // 이전 날짜 열은 빈칸 유지 (편입 표시: 이전 빈→오늘 값)
            while (newRow.length <= dateColIndex) newRow.push('');
            newRow[dateColIndex] = h.weight_pct.toFixed(2);

            grid.splice(block.holdingEndRow, 0, newRow);
            block.holdingEndRow++;
            updatedCells++;
        }
    }

    // ★ 편출 종목 처리: block 내 기존 종목 중 오늘 데이터에 없는 종목 → 해당 날짜 셀 비워둠
    // (아무것도 안 쓰면 자동으로 빈칸 = 편출)
    // 이미 위에서 해당 종목 행에 값을 안 쓰면 빈칸으로 남으므로 추가 처리 불필요

    return updatedCells;
}

/** ★ V2: 신규 ETF 블록을 시트 하단에 추가 */
function appendNewBlockV2(grid: string[][], etf: ETFHoldingData, dateStr: string): number {
    let updatedCells = 0;

    // 기존 시트의 날짜 열들을 파악 (첫 번째 블록의 열 헤더에서)
    const existingDates: string[] = [];
    for (const row of grid) {
        if ((row[0] || '').trim() === '구성종목') {
            for (let c = 2; c < row.length; c++) {
                const d = (row[c] || '').trim();
                if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
                    existingDates.push(d);
                }
            }
            break;
        }
    }

    // 전체 날짜 목록 = 기존 + 오늘 (중복 제거)
    const allDates = [...existingDates];
    if (!allDates.includes(dateStr)) allDates.push(dateStr);

    // 빈 구분 행
    if (grid.length > 0) grid.push([]);

    // ETF 헤더
    const catLabel = getCategoryLabel(etf.category);
    grid.push([`■ ${etf.etfName}`, `EF ${etf.etfSymbol}`, catLabel]);
    updatedCells++;

    // 열 헤더 (기존 날짜 + 오늘)
    grid.push(['구성종목', '코드', ...allDates]);
    updatedCells++;

    // 보유종목 행 (오늘 날짜 열 위치에만 값, 이전 날짜는 빈칸)
    const todayColIndex = allDates.indexOf(dateStr) + 2; // A=0, B=1, C~=2+
    for (const h of etf.holdings) {
        const row: string[] = [h.holding_name, h.holding_symbol];
        while (row.length <= todayColIndex) row.push('');
        row[todayColIndex] = h.weight_pct.toFixed(2);
        grid.push(row);
        updatedCells++;
    }

    return updatedCells;
}

/** 카테고리 레이블 변환 */
function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        ai: 'AI·테크',
        strategy: '전략',
        dividend: '배당',
    };
    return labels[category] || category;
}
