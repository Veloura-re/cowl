/**
 * Format a number with thousand separators (commas)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

/**
 * Format currency with symbol and thousand separators
 * @param value - The value to format
 * @param symbol - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrencyValue(value: number, symbol: string = '$', decimals: number = 2): string {
    return `${symbol}${formatNumber(value, decimals)}`
}
