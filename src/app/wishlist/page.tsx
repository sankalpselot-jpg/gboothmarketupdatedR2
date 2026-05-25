'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useRegion } from '@/hooks/useRegion'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getPriceForCurrency, TAX_LABELS } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import type { Product, Category } from '@/types/database'

type ProductWithCat = Product & { categories: Category | null }

export default function WishlistPage() {
  const { ids, toggle }           = useWishlist()
  const { user }                  = useAuth()
  const { addItem }               = useCart(user?.id)
  const { currency, region }      = useRegion()
  const [products, setProducts]   = useState<ProductWithCat[]>([])
  const [loading, setLoading]     = useState(false)
  const taxLabel                  = TAX_LABELS[region]
  const supabase                  = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!ids.length) { setProducts([]); return }
    setLoading(true)
    supabase
      .from('products')
      .select('*, categories(*)')
      .in('id', ids)
      .eq('is_active', true)
      .then(({ data }) => {
        const normalised = (data || []).map(p => ({
          ...p,
          categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories,
        })) as ProductWithCat[]
        setProducts(normalised)
        setLoading(false)
      })
  }, [ids, supabase])

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="min-h-screen bg-cream py-10 px-10">
        <div className="max-w-[1100px] mx-auto">
          <h1 className="font-display font-extrabold text-3xl text-navy mb-8">Wishlist</h1>

          {loading && (
            <div className="flex items-center justify-center py-20 text-[#6B6B6B] gap-3">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {!loading && ids.length === 0 && (
            <div className="card p-16 text-center">
              <Heart className="w-14 h-14 mx-auto mb-4 text-[#DDD8CF]" />
              <h2 className="font-display font-bold text-xl text-navy mb-2">Your wishlist is empty</h2>
              <p className="text-[#6B6B6B] mb-6">Save items you are interested in — click the ♡ on any product.</p>
              <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <p className="text-[13px] text-[#6B6B6B] mb-6">
                {products.length} saved item{products.length !== 1 ? 's' : ''}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(p => {
                  const price = getPriceForCurrency(p, currency)
                  return (
                    <div key={p.id} className="card overflow-hidden">
                      <Link href={`/products/${p.slug}`}>
                        <div className="bg-cream-dark aspect-[4/3] flex items-center justify-center overflow-hidden">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            : <svg className="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                          }
                        </div>
                      </Link>
                      <div className="p-4">
                        {p.categories && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold mb-1">{p.categories.name}</p>
                        )}
                        <Link href={`/products/${p.slug}`}>
                          <h3 className="font-display font-semibold text-navy text-[15px] mb-3 leading-snug hover:text-gold transition-colors line-clamp-2">{p.name}</h3>
                        </Link>
                        <div className="flex items-center justify-between pt-3 border-t border-cream-dark">
                          <div>
                            <span className="font-display font-bold text-navy text-lg">{formatPrice(price, currency)}</span>
                            <span className="text-[10px] bg-cream-dark text-[#6B6B6B] px-1.5 py-0.5 rounded ml-1.5">{taxLabel}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggle(p.id)}
                              className="p-2 rounded border border-[#DDD8CF] text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove from wishlist"
                            >
                              <Heart size={15} className="fill-red-500" />
                            </button>
                            <button
                              onClick={() => addItem(p.id)}
                              className="bg-navy text-white text-[12.5px] font-medium px-3.5 py-2 rounded hover:bg-gold transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={() => products.forEach(p => addItem(p.id))}
                  className="btn-primary px-8 py-3"
                >
                  Add All to Cart
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
