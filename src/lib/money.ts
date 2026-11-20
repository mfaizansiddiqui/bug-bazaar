const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/**
 * Formats integer cents for display: 1299 → "$12.99".
 * Prices stay in cents everywhere else, so there are no floating-point rounding errors
 * (0.1 + 0.2 !== 0.3). Division happens only here, at the display layer.
 */
export function formatCents(cents: number): string {
  return usd.format(cents / 100)
}
