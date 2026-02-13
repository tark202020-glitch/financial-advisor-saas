/**
 * Format currency based on the currency type.
 * - KRW: No decimal places, includes thousand separators. (e.g., 1,234)
 * - USD: $ prefix, fixed 2 decimal places. (e.g., $ 1,234.56)
 * - Default: Same as KRW.
 */
export function formatCurrency(value: number, currency: 'KRW' | 'USD' | string = 'KRW'): string {
    if (value === 0) return currency === 'USD' ? '$ 0.00' : '0';

    // Handle KRW (and default)
    if (currency === 'KRW' || currency === 'KR') {
        return Math.round(value).toLocaleString('ko-KR');
    }

    // Handle USD
    if (currency === 'USD' || currency === 'US') {
        const parts = value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$ ${parts}`;
    }

    // Fallback
    return Math.round(value).toLocaleString();
}
