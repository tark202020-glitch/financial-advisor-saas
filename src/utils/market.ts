/**
 * Determine market type based on symbol pattern.
 * Rule:
 * - 6 digits: KR (Domestic)
 * - 5 digits + 1 alphabet (length 6): KR (Domestic)
 * - Alphabet (and others without enough digits): US (Overseas)
 */
export function getMarketType(symbol: string): 'KR' | 'US' {
    if (!symbol || typeof symbol !== 'string') return 'US';

    // Strip suffix for checking
    const clean = symbol.replace(/\.(KS|KQ|ks|kq)$/, '');

    // Rule:
    // KR: Length 6 AND (All Digits OR At least 5 Digits for codes like 0080G0)
    if (clean.length === 6) {
        // Count digits
        const digitCount = (clean.match(/\d/g) || []).length;
        if (digitCount >= 5) {
            return 'KR';
        }
    }

    // Default to US for everything else (Alphabets, shorter/longer codes)
    return 'US';
}
