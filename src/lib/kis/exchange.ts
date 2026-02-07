export const NYSE_SYMBOLS = new Set([
    'JPM', 'BAC', 'WMT', 'TGT', 'KO', 'MCD', 'DIS', 'NKE', 'TM', 'TSM', 'HD', 'V', 'MA', 'PFE'
]);

export const AMEX_SYMBOLS = new Set([
    'AMEX' // Placeholder if any
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
