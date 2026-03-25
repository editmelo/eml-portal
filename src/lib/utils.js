import { clsx } from 'clsx'

/** Merge Tailwind class names safely */
export function cn(...inputs) {
  return clsx(inputs)
}

/** Format a number as USD currency */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format ISO date string to readable format */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Get initials from a full name */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Get today's date as YYYY-MM-DD */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Returns the "quote day" key in Eastern Time (America/New_York).
 * The quote flips at 1 AM ET — so before 1 AM it still shows the previous day's quote.
 */
export function quoteDayStr() {
  const now = new Date()
  const nyHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }),
    10
  )
  // Before 1 AM ET → still "yesterday" so the quote doesn't change overnight
  if (nyHour < 1) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toLocaleString('en-CA', { timeZone: 'America/New_York' }).split(',')[0]
  }
  return now.toLocaleString('en-CA', { timeZone: 'America/New_York' }).split(',')[0]
}

/** Simple seeded random from a date string – ensures same quote all day */
export function seededRandom(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) / 4294967295)
}
