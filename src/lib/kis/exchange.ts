export const NYSE_SYMBOLS = new Set([
    'JPM', 'BAC', 'WMT', 'TGT', 'KO', 'MCD', 'DIS', 'NKE', 'TM', 'TSM', 'HD', 'V', 'MA', 'PFE',
    // 추가 NYSE 종목
    'MMM', 'PG', 'F', 'GE', 'BA', 'LLY', 'PM', 'IBM', 'GEV', 'SOLV', 'ADR',
    'IONQ', 'CRCL', 'BNTX', 'NTRA', 'DNLI',
    'BRK.B', 'JNJ', 'UNH', 'CVX', 'XOM', 'ABBV', 'MRK', 'ABT', 'TMO', 'DHR',
    'CRM', 'ACN', 'LIN', 'RTX', 'HON', 'UNP', 'CAT', 'DE', 'GS', 'MS',
    'SPGI', 'BLK', 'AXP', 'SYK', 'MDT', 'CI', 'ELV', 'CB', 'PLD', 'AMT',
    'NOW', 'UBER', 'SQ', 'SNAP', 'PLTR', 'RIVN', 'LCID', 'NIO',
    'T', 'VZ', 'CMCSA', 'WFC', 'C', 'USB', 'BMY', 'AMGN', 'COP', 'SLB',
]);

export const AMEX_SYMBOLS = new Set([
    'SPY', 'GLD', 'SLV', 'IWM', 'DIA', 'XLF', 'XLE', 'XLK', 'EEM', 'EFA',
    'VTI', 'VEA', 'VWO', 'AGG', 'BND', 'HYG', 'LQD', 'TLT', 'IEF', 'TIP',
    'ARKK', 'ARKG', 'ARKW', 'ARKF',
    // 추가 AMEX ETF
    'LIT', 'OILK', 'PDBC', 'QQQM', 'SCHD', 'JEPI', 'JEPQ', 'DIVO',
    'XLV', 'XLI', 'XLB', 'XLC', 'XLY', 'XLP', 'XLU', 'XLRE',
    'SOXX', 'SMH', 'KWEB', 'MCHI', 'FXI', 'IBIT', 'BITO',
]);

export function getUSExchangeCode(symbol: string): string {
    // Indices often need 'NYS' for inquire-time-indexchartprice or specific handling
    if (symbol === '.DJI' || symbol === '.SPX' || symbol === 'SPX' || symbol === '.INX') {
        return 'NYS';
    }
    if (symbol === '.IXIC' || symbol === 'COMP' || symbol === '.COMP') {
        return 'NAS';
    }

    if (NYSE_SYMBOLS.has(symbol)) return 'NYS'; // REST API often uses NYS or NYA. Let's try NYS first.
    if (AMEX_SYMBOLS.has(symbol)) return 'AMS';
    return 'NAS'; // Default to Nasdaq
}

export function getWSPrefix(symbol: string): string {
    // WS uses specific prefixes like DNAS, DNYS, DAMS
    if (NYSE_SYMBOLS.has(symbol)) return 'DNYS';
    if (AMEX_SYMBOLS.has(symbol)) return 'DAMS';
    return 'DNAS';
}
