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
 * 구조:
 *   행(Row) = 구성종목 (ETF별 블록으로 구분)
 *   열(Col) = 날짜별 비중
 *
 * 예시:
 *   | ETF명: TIGER AI (123456) [AI·테크] |            |            |
 *   | 구성종목                            | 2026-03-19 | 2026-03-20 |
 *   | 삼성전자 (005930)                   | 15.20%     | 15.80%     |
 *   | SK하이닉스 (000660)                 | 12.50%     | 11.90%     |
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

        // 1. 시트 존재 확인 및 생성 (reset이면 삭제 후 재생성)
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
            const allRows = buildFullSheet(etfDataList, dateStr);
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

        // 4. 기존 시트에 날짜 열 추가/업데이트
        const result = await updateExistingSheet(sheets, sheetId, grid, etfDataList, dateStr);
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

        // reset 모드: 기존 시트 삭제
        if (reset && existingSheet && existingSheet.properties?.sheetId !== undefined) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{ deleteSheet: { sheetId: existingSheet.properties.sheetId } }],
                },
            });
            console.log(`[Sheets ETF] '${ETF_SHEET_NAME}' 기존 시트 삭제 완료`);
        }

        // 시트가 없거나 삭제된 경우 새로 생성
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

/** 빈 시트에 전체 구조 새로 작성 */
function buildFullSheet(etfDataList: ETFHoldingData[], dateStr: string): string[][] {
    const rows: string[][] = [];

    for (let i = 0; i < etfDataList.length; i++) {
        const etf = etfDataList[i];

        // ETF 구분용 빈 행 (첫 ETF 제외)
        if (i > 0) rows.push([]);

        // ETF 헤더 행
        const catLabel = getCategoryLabel(etf.category);
        rows.push([`■ ${etf.etfName} (${etf.etfSymbol}) [${catLabel}]`]);

        // 열 헤더: 구성종목 | 날짜1 | 날짜2 ...
        rows.push(['구성종목', dateStr]);

        // 보유종목 행
        for (const h of etf.holdings) {
            rows.push([
                `${h.holding_name} (${h.holding_symbol})`,
                `${h.weight_pct.toFixed(2)}%`,
            ]);
        }
    }

    return rows;
}

/** 기존 시트에 날짜 열 추가/업데이트 */
async function updateExistingSheet(
    sheets: ReturnType<typeof google.sheets>,
    sheetId: string,
    grid: string[][],
    etfDataList: ETFHoldingData[],
    dateStr: string
): Promise<{ success: boolean; updatedCells?: number; error?: string }> {

    // 기존 grid를 복사하여 수정
    const newGrid = grid.map(row => [...row]);
    let updatedCells = 0;

    // 각 ETF 블록의 시작 행 인덱스를 찾기
    const blockMap = findETFBlocks(newGrid);

    for (const etf of etfDataList) {
        const blockKey = etf.etfSymbol;
        const block = blockMap.get(blockKey);

        if (block) {
            // 기존 블록에 날짜 열 추가/업데이트
            updatedCells += updateBlock(newGrid, block, etf, dateStr);
        } else {
            // 신규 ETF: 시트 하단에 새 블록 추가
            updatedCells += appendNewBlock(newGrid, etf, dateStr);
            // 새로 추가된 블록 반영을 위해 blockMap 재구축
            const newBlockMap = findETFBlocks(newGrid);
            for (const [k, v] of newBlockMap) blockMap.set(k, v);
        }
    }

    // 전체 시트 덮어쓰기 (범위 자동 계산)
    const maxCols = Math.max(...newGrid.map(r => r.length));
    // 모든 행의 길이를 맞추기
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

interface ETFBlock {
    headerRow: number;   // "■ ETF명..." 행
    colHeaderRow: number; // "구성종목 | 날짜1 | 날짜2" 행
    holdingStartRow: number; // 첫 보유종목 행
    holdingEndRow: number;   // 마지막 보유종목 행 (exclusive)
    etfSymbol: string;
}

/** 시트에서 ETF 블록 위치 파악 */
function findETFBlocks(grid: string[][]): Map<string, ETFBlock> {
    const blocks = new Map<string, ETFBlock>();
    let i = 0;

    while (i < grid.length) {
        const cell = (grid[i]?.[0] || '').trim();

        // ETF 헤더 행 감지: "■ " 로 시작
        if (cell.startsWith('■ ')) {
            // 심볼 추출: "(123456)" 패턴
            const symMatch = cell.match(/\((\d{6})\)/);
            if (symMatch) {
                const etfSymbol = symMatch[1];
                const headerRow = i;
                const colHeaderRow = i + 1;
                const holdingStartRow = i + 2;

                // 보유종목 행의 끝 탐색
                let endRow = holdingStartRow;
                while (endRow < grid.length) {
                    const nextCell = (grid[endRow]?.[0] || '').trim();
                    // 빈 행이거나 다른 ETF 헤더면 종료
                    if (nextCell === '' || nextCell.startsWith('■ ')) break;
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

/** 기존 블록에 날짜 열 추가/업데이트 */
function updateBlock(grid: string[][], block: ETFBlock, etf: ETFHoldingData, dateStr: string): number {
    let updatedCells = 0;

    // 열 헤더 행에서 날짜 위치 확인
    const colHeaderRow = grid[block.colHeaderRow] || ['구성종목'];

    // 날짜 열 인덱스 찾기 (이미 있으면 해당 열, 없으면 새 열)
    let dateColIndex = colHeaderRow.findIndex(
        (val, idx) => idx > 0 && val.trim() === dateStr
    );

    if (dateColIndex === -1) {
        // 새 날짜 열 추가
        dateColIndex = colHeaderRow.length;
        colHeaderRow.push(dateStr);
        grid[block.colHeaderRow] = colHeaderRow;
        updatedCells++;
    }

    // 기존 보유종목의 심볼 → 행 인덱스 맵
    const existingHoldingRows = new Map<string, number>();
    for (let r = block.holdingStartRow; r < block.holdingEndRow; r++) {
        const cellVal = (grid[r]?.[0] || '').trim();
        const match = cellVal.match(/\((\d{6})\)/);
        if (match) {
            existingHoldingRows.set(match[1], r);
        }
    }

    // 각 보유종목의 비중 기입
    for (const h of etf.holdings) {
        const rowIdx = existingHoldingRows.get(h.holding_symbol);

        if (rowIdx !== undefined) {
            // 기존 종목: 해당 날짜 열에 비중 업데이트
            while (grid[rowIdx].length <= dateColIndex) grid[rowIdx].push('');
            grid[rowIdx][dateColIndex] = `${h.weight_pct.toFixed(2)}%`;
            updatedCells++;
        } else {
            // 신규 종목: 블록 끝에 행 삽입
            const newRow: string[] = [`${h.holding_name} (${h.holding_symbol})`];
            while (newRow.length <= dateColIndex) newRow.push('');
            newRow[dateColIndex] = `${h.weight_pct.toFixed(2)}%`;

            grid.splice(block.holdingEndRow, 0, newRow);
            block.holdingEndRow++;

            // 삽입으로 인해 이후 블록들의 행 인덱스 조정 필요
            // (updateExistingSheet에서 전체 grid를 덮어쓰므로 OK)
            updatedCells++;
        }
    }

    return updatedCells;
}

/** 신규 ETF 블록을 시트 하단에 추가 */
function appendNewBlock(grid: string[][], etf: ETFHoldingData, dateStr: string): number {
    let updatedCells = 0;

    // 빈 구분 행
    if (grid.length > 0) grid.push([]);

    // ETF 헤더
    const catLabel = getCategoryLabel(etf.category);
    grid.push([`■ ${etf.etfName} (${etf.etfSymbol}) [${catLabel}]`]);
    updatedCells++;

    // 열 헤더
    grid.push(['구성종목', dateStr]);
    updatedCells++;

    // 보유종목 행
    for (const h of etf.holdings) {
        grid.push([
            `${h.holding_name} (${h.holding_symbol})`,
            `${h.weight_pct.toFixed(2)}%`,
        ]);
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
