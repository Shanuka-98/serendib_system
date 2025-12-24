/**
 * Utility helper functions for the application
 */

/**
 * Format booking ID to a professional reference number
 * Example: 9 -> "SER-2024-000009"
 * @param {number} bookingId - The booking ID
 * @param {string} year - Optional year (defaults to current year)
 * @returns {string} Formatted booking reference
 */
export const formatBookingRef = (bookingId, year = null) => {
  const currentYear = year || new Date().getFullYear()
  const paddedId = String(bookingId).padStart(6, '0')
  return `SER-${currentYear}-${paddedId}`
}

/**
 * Format currency for LKR
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0
  }).format(amount || 0)
}
