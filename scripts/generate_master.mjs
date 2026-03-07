/**
 * generate_master.mjs
 * 
 * KIS 마스터 데이터 다운로드 및 통합 JSON 생성 스크립트 (Node.js)
 * 
 * Usage: node scripts/generate_master.mjs
 * 
 * KOSPI + KOSDAQ (국내) + NASDAQ + NYSE + AMEX (해외) 마스터 파일을 다운로드하여
 * public/data/all_stocks_master.json 으로 통합 저장합니다.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createUnzip } from 'zlib';
import { createWriteStream, mkdirSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'public', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ---- Download Helper ----
function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        https.get(url, { rejectUnauthorized: false }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (e) => { reject(e); });
    });
}

// ---- Unzip Helper (using child_process for .zip) ----
async function unzipFile(zipPath, outDir) {
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
        // Use powershell on Windows
        const cmd = `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stdout);
        });
    });
}

// ---- Parse Domestic (KOSPI/KOSDAQ) MST file ----
function parseDomesticMST(filePath) {
    const stocks = [];
    const raw = readFileSync(filePath, { encoding: 'binary' });

    // Convert from CP949 to UTF-8 using TextDecoder
    const buf = Buffer.from(raw, 'binary');
    let text;
    try {
        text = new TextDecoder('euc-kr').decode(buf);
    } catch {
        text = raw;
    }

    const lines = text.split('\n');
    for (const row of lines) {
        if (row.trim().length < 230) continue;

        const part2_len = 228;
        const part1 = row.slice(0, row.length - part2_len);

        const shortCode = part1.slice(0, 9).trim();
        const standardCode = part1.slice(9, 21).trim();
        const name = part1.slice(21).trim();

        if (shortCode && name) {
            stocks.push({
                symbol: shortCode,
                name: name,
                market: 'KR',
                standard_code: standardCode
            });
        }
    }
    return stocks;
}

// ---- Parse Overseas (NASDAQ/NYSE/AMEX) MST file ----
function parseOverseasMST(filePath, exchange) {
    const stocks = [];
    const buf = readFileSync(filePath);
    let text;
    try {
        text = new TextDecoder('euc-kr').decode(buf);
    } catch {
        text = buf.toString('utf-8');
    }

    const lines = text.split('\n');
    for (const row of lines) {
        const trimmed = row.trim();
        if (!trimmed || trimmed.length < 10) continue;

        // KIS overseas master format is tab-separated
        // Fields: 국가코드 | 거래소코드 | 소수점자릿수 | 심볼 | 실시간심볼 | 한글명 | 영문명 | ...
        const cols = trimmed.split('\t');

        if (cols.length >= 7) {
            const symbol = cols[3]?.trim();
            const nameKor = cols[5]?.trim();
            const nameEng = cols[6]?.trim();

            if (!symbol || symbol.length === 0) continue;
            // Skip header-like rows
            if (symbol === 'SYMB' || symbol === 'symbol') continue;

            const name = nameKor || nameEng || symbol;

            stocks.push({
                symbol: symbol,
                name: name,
                market: 'US',
                exchange: exchange
            });
        }
    }
    return stocks;
}

// ---- Main ----
async function main() {
    const allStocks = [];
    const tempDir = path.join(BASE_DIR, '_temp_master');
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const sources = [
        { name: 'KOSPI', url: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip', type: 'domestic' },
        { name: 'KOSDAQ', url: 'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip', type: 'domestic' },
        { name: 'NASDAQ', url: 'https://new.real.download.dws.co.kr/common/master/nasdaq_code.mst.zip', type: 'overseas' },
        { name: 'NYSE', url: 'https://new.real.download.dws.co.kr/common/master/nyse_code.mst.zip', type: 'overseas' },
        { name: 'AMEX', url: 'https://new.real.download.dws.co.kr/common/master/amex_code.mst.zip', type: 'overseas' },
    ];

    for (const src of sources) {
        console.log(`\n📥 Downloading ${src.name}...`);
        const zipPath = path.join(tempDir, `${src.name.toLowerCase()}.zip`);
        const extractDir = path.join(tempDir, src.name.toLowerCase());

        try {
            await download(src.url, zipPath);

            if (!existsSync(extractDir)) mkdirSync(extractDir, { recursive: true });
            await unzipFile(zipPath, extractDir);

            // Find .mst file
            const files = fs.readdirSync(extractDir);
            const mstFile = files.find(f => f.endsWith('.mst'));

            if (!mstFile) {
                console.warn(`  ⚠️ No .mst file found in ${src.name} archive`);
                continue;
            }

            const mstPath = path.join(extractDir, mstFile);
            let stocks;

            if (src.type === 'domestic') {
                stocks = parseDomesticMST(mstPath);
            } else {
                stocks = parseOverseasMST(mstPath, src.name);
            }

            console.log(`  ✅ ${src.name}: ${stocks.length} stocks parsed`);
            allStocks.push(...stocks);

        } catch (e) {
            console.error(`  ❌ Error processing ${src.name}:`, e.message);
        }
    }

    // Cleanup temp directory
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch { }

    // Also keep the old kospi_master.json for backward compatibility
    const kospiOnly = allStocks.filter(s => s.market === 'KR' && !s.exchange);
    const kospiPath = path.join(DATA_DIR, 'kospi_master.json');
    writeFileSync(kospiPath, JSON.stringify(kospiOnly, null, 2), 'utf-8');
    console.log(`\n📄 kospi_master.json: ${kospiOnly.length} stocks saved`);

    // Save unified master
    const outputPath = path.join(DATA_DIR, 'all_stocks_master.json');
    writeFileSync(outputPath, JSON.stringify(allStocks, null, 2), 'utf-8');
    console.log(`📄 all_stocks_master.json: ${allStocks.length} stocks saved`);
    console.log(`\n✅ Complete! Files saved in ${DATA_DIR}`);
}

main().catch(console.error);
