// ═══════════════════════════════════════════════════
// BWR WORKS — Shared Formatters
// Currency, dates, order IDs — single source of truth
// ═══════════════════════════════════════════════════

/**
 * Format paise to Indian Rupee display string
 * e.g. 13400 → ₹134  |  149900 → ₹1,499
 */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

/**
 * Format paise to Rupee with decimals
 * e.g. 13450 → ₹134.50
 */
export function formatPriceExact(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format date to readable string
 * e.g. 1711785600000 → "30 Mar 2026"
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format date + time
 * e.g. 1711785600000 → "30 Mar 2026, 4:30 PM"
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format order ID for display
 * e.g. "BWR-0001"
 */
export function formatOrderId(id: string): string {
  return id.startsWith('BWR-') ? id : `BWR-${id}`
}
