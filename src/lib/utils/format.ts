import { formatPrice as _formatPrice } from './currency'
import type { Currency, OrderStatus, QuoteStatus } from '@/types/database'

export { _formatPrice as formatPrice }

// Date formatting
export function fmtDate(date: string | Date, locale = 'en-GB'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function fmtDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function fmtDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Status badge styles
export const ORDER_STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  delivered: { label: 'Delivered', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
}

export const QUOTE_STATUS_STYLES: Record<QuoteStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  sent:     { label: 'Sent',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  accepted: { label: 'Accepted', className: 'bg-green-50 text-green-700 border-green-200' },
  declined: { label: 'Declined', className: 'bg-red-50 text-red-700 border-red-200' },
  expired:  { label: 'Expired',  className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€', GBP: '£', INR: '₹',
}

export function fmtMoney(amount: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOLS[currency]
  if (currency === 'INR') return `${sym}${amount.toLocaleString('en-IN')}`
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
