import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function generateOrderNumber(): string {
  const prefix = 'BM'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function formatDate(date: string | Date, locale = 'en-GB'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}


/**
 * Supabase returns joined relations as arrays even for single-row joins.
 * This normalises `categories` (and optionally `venues`) to a single object.
 */
export function normaliseProduct<T extends { categories?: unknown; venues?: unknown }>(p: T) {
  return {
    ...p,
    categories: Array.isArray(p.categories) ? p.categories[0] ?? null : p.categories,
    venues:     Array.isArray(p.venues)     ? p.venues[0]     ?? null : p.venues,
  }
}

export function normaliseProducts<T extends { categories?: unknown }>(rows: T[]) {
  return rows.map(normaliseProduct)
}
