'use client'
import { X, ShoppingCart, ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useRegion } from '@/hooks/useRegion'
import { formatPrice, getPriceForCurrency, TAX_LABELS, TAX_RATES } from '@/lib/utils/currency'
import { REGION_FLAGS } from '@/lib/utils/regions'
import type { Product, Category } from '@/types/database'

type Props = {
  product: (Product & { categories?: Category }) | null
  onClose: () => void
}

export default function ProductQuickView({ product, onClose }: Props) {
  const { user }  = useAuth()
  const { addItem } = useCart(user?.id)
  const { currency, region } = useRegion()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!product) return null

  const price    = getPriceForCurrency(product, currency)
  const taxInfo  = TAX_RATES[region]
  const taxLabel = TAX_LABELS[region]
  const taxAmt   = price * taxInfo.rate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[780px] max-h-[90vh] overflow-hidden flex flex-col">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-cream transition-colors"
        >
          <X size={18} className="text-[#6B6B6B]" />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Image */}
          <div className="md:w-5/12 flex-shrink-0 bg-cream-dark flex items-center justify-center min-h-[240px]">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{ minHeight: 240 }}
              />
            ) : (
              <svg className="w-20 h-20 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2"/>
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-7 flex flex-col">
            {/* Category + badge */}
            <div className="flex items-center gap-2 mb-2">
              {product.categories && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-gold">
                  {product.categories.name}
                </span>
              )}
              {product.badge && (
                <span className="text-[10px] font-semibold bg-gold text-white px-2 py-0.5 rounded uppercase">
                  {product.badge}
                </span>
              )}
            </div>

            <h2 className="font-display font-extrabold text-2xl text-navy tracking-tight mb-3 leading-tight">
              {product.name}
            </h2>

            <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed mb-4 flex-1">
              {product.description}
            </p>

            {/* Region tags */}
            <div className="flex gap-1.5 flex-wrap mb-5">
              {product.available_regions.map(r => (
                <span key={r} className={r === 'EU' ? 'tag-eu' : r === 'UK' ? 'tag-uk' : 'tag-in'}>
                  {REGION_FLAGS[r]} {r === 'EU' ? 'Europe' : r === 'UK' ? 'United Kingdom' : 'India'}
                </span>
              ))}
            </div>

            {/* Dimensions */}
            {product.dimensions && (
              <p className="text-[12.5px] text-[#6B6B6B] mb-4">
                📐 {product.dimensions}
              </p>
            )}

            {/* Price */}
            <div className="bg-cream rounded-xl p-4 mb-5 border border-[#DDD8CF]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display font-bold text-3xl text-navy">{formatPrice(price, currency)}</span>
                <span className="text-sm text-[#6B6B6B]">/ event</span>
                <span className="text-[10px] bg-cream-dark text-[#6B6B6B] px-1.5 py-0.5 rounded">{taxLabel}</span>
              </div>
              <p className="text-[12px] text-[#6B6B6B]">
                +{formatPrice(taxAmt, currency)} {taxInfo.label} at checkout
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { addItem(product.id); onClose() }}
                className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-3 rounded font-medium hover:bg-gold transition-colors text-sm"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 border-[1.5px] border-navy text-navy px-4 py-3 rounded font-medium hover:bg-navy hover:text-white transition-colors text-sm"
              >
                <ExternalLink size={15} /> Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
