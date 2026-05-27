import type { Region, Currency } from '@/types/database'

// ── Supported currencies ──────────────────────────────────────
export const CURRENCIES = ['EUR','GBP','USD','INR'] as const
export type SupportedCurrency = typeof CURRENCIES[number]

// ── Region → currency mapping ─────────────────────────────────
export const REGION_CURRENCIES: Record<string, string> = {
  EU: 'EUR', UK: 'GBP', US: 'USD', IN: 'INR',
}

// ── Currency symbols ──────────────────────────────────────────
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', GBP: '£', USD: '$', INR: '₹',
}

// ── Tax rates per region ──────────────────────────────────────
export const TAX_RATES: Record<string, { rate: number; label: string }> = {
  EU:    { rate: 0.20,  label: 'VAT 20%' },
  UK:    { rate: 0.20,  label: 'VAT 20%' },
  US:    { rate: 0.00,  label: 'Tax excl.' },
  IN:    { rate: 0.18,  label: 'GST 18%' },
  OTHER: { rate: 0.00,  label: 'Tax excl.' },
}

export const TAX_LABELS: Record<string, string> = {
  EU: 'ex-VAT', UK: 'ex-VAT', US: 'ex-Tax', IN: 'ex-GST', OTHER: 'ex-Tax',
}

// ── Hardcoded fallback rates (used when DB rates unavailable) ──
export const FALLBACK_RATES: Record<string, Record<string, number>> = {
  EUR: { GBP: 0.85,   USD: 1.08,   INR: 90.00  },
  GBP: { EUR: 1.1765, USD: 1.27,   INR: 106.00 },
  USD: { EUR: 0.9259, GBP: 0.7874, INR: 83.50  },
  INR: { EUR: 0.0111, GBP: 0.0094, USD: 0.0120 },
}

// ── Convert amount between currencies ────────────────────────
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates?: Record<string, Record<string, number>>
): number {
  if (from === to) return amount
  const rateMap = rates || FALLBACK_RATES
  const rate    = rateMap[from]?.[to]
  if (!rate) return amount
  return Math.round(amount * rate * 100) / 100
}

// ── Format price with correct locale ─────────────────────────
export function formatPrice(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency
  if (currency === 'INR') {
    return `${sym}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }
  if (amount % 1 === 0) {
    return `${sym}${amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
  }
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Get price for a vendor product in target currency ─────────
// Uses regional_pricing if available, else converts from base
export function getRegionalPrice(
  product: {
    price_per_day: number
    base_currency?: string
    regional_pricing?: { region: string; currency: string; price: number }[]
  },
  targetRegion: string,
  rates?: Record<string, Record<string, number>>
): { price: number; currency: string; isConverted: boolean } {
  const regional = product.regional_pricing?.find(r => r.region === targetRegion)
  if (regional) {
    return { price: regional.price, currency: regional.currency, isConverted: false }
  }
  // Fallback: convert from base
  const baseCurrency = product.base_currency || 'INR'
  const targetCurrency = REGION_CURRENCIES[targetRegion] || baseCurrency
  const converted = convertCurrency(product.price_per_day, baseCurrency, targetCurrency, rates)
  return { price: converted, currency: targetCurrency, isConverted: true }
}

// ── Legacy compat — used by old admin product pages ───────────
export function getPriceForCurrency(
  product: { price_eur: number; price_gbp: number; price_inr: number },
  currency: string
): number {
  switch (currency) {
    case 'EUR': return product.price_eur
    case 'GBP': return product.price_gbp
    case 'INR': return product.price_inr
    default:    return product.price_eur
  }
}

// ── Normalize to a single reporting currency ──────────────────
export function normalizeToReportingCurrency(
  amount: number,
  fromCurrency: string,
  reportingCurrency = 'INR',
  rates?: Record<string, Record<string, number>>
): number {
  return convertCurrency(amount, fromCurrency, reportingCurrency, rates)
}

// ── Serves regions display string ─────────────────────────────
export function getServesBadges(regions: string[]): string {
  const labels: Record<string, string> = {
    EU: 'EU', UK: 'UK', US: 'USA', IN: 'India', OTHER: 'Other',
  }
  return regions.map(r => labels[r] || r).join(' · ')
}

// ── Region flags ──────────────────────────────────────────────
export const REGION_FLAGS: Record<string, string> = {
  EU: '🇪🇺', UK: '🇬🇧', US: '🇺🇸', IN: '🇮🇳', OTHER: '🌍',
}

export const REGION_LABELS: Record<string, string> = {
  EU: 'Europe', UK: 'United Kingdom', US: 'United States', IN: 'India', OTHER: 'Other',
}
