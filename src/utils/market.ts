/**
 * Determine market type based on symbol pattern.
 * Rule:
 * - 6 digits: KR (Domestic)
 * - Alphabet (and others): US (Overseas)
 */
export function getMarketType(symbol: string): 'KR' | 'US' {
    // Check if symbol consists of exactly 6 digits
    // Some KR symbols might be 6 digits + suffix (e.g., preference shares), but standard is 6.
    // User specified "6 digits visible" -> likely wants standard codes.
    // Regex: ^\d{6}$ matches exactly 6 digits.
    // However, some might have .KS or .KQ suffix stored? 
    // If stored with suffix, we should strip it first or handle it.
    // Let's assume input might be raw symbol.

    // Strict 6-digit check for KR
    if (/^\d{6}$/.test(symbol)) {
        return 'KR';
    }

    // Check with suffix .KS/.KQ just in case
    if (/^\d{6}\.(KS|KQ|ks|kq)$/.test(symbol)) {
        return 'KR';
    }

    // Default to US for everything else (Alphabets, ETFs like LIT)
    return 'US';
}
