'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search, Plus, Minus, Trash2, ShoppingBag, ArrowLeft,
  X, MapPin, Calendar, Package, ExternalLink, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Project } from '@/types/database'
import { formatPrice, getRegionalPrice, FALLBACK_RATES } from '@/lib/utils/currency'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }
const CATEGORIES = ['All','Furniture','Display & Shelving','TV & Digital Displays','Audio / Visual','Lighting','Kitchen & Catering','IT & Connectivity']

type CartItem = {
  id: string
  vendor_product_id: string
  vendor_id: string
  quantity: number
  days: number
  unit_price: number
  total_price: number
  product: any
}

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])

  const [project,    setProject]   = useState<Project | null>(null)
  const [cartItems,  setCartItems] = useState<CartItem[]>([])
  const [loading,    setLoading]   = useState(true)
  const [view,       setView]      = useState<'items' | 'browse'>('items')

  // Browse state
  const [products,  setProducts]  = useState<any[]>([])
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [browseLoading, setBrowseLoading] = useState(false)
  const [cartImport,    setCartImport]    = useState<any[]>([])
  const [importing,     setImporting]     = useState(false)

  const loadData = useCallback(async () => {
    const { data: proj } = await db.from('projects').select('*').eq('id', params.id).single()
    if (!proj) return
    setProject(proj)

    const { data: items } = await db.from('project_items')
      .select('*, vendor_products(*, vendor_profiles(*), product_images(*), regional_pricing(*))')
      .eq('project_id', params.id)

    if (items) {
      setCartItems(items.map((i: any) => ({
        id:                i.id,
        vendor_product_id: i.vendor_product_id,
        vendor_id:         i.vendor_id,
        quantity:          i.quantity,
        days:              i.days,
        unit_price:        i.unit_price,
        total_price:       i.total_price,
        product: {
          ...i.vendor_products,
          vendor_profiles:  Array.isArray(i.vendor_products.vendor_profiles)  ? i.vendor_products.vendor_profiles[0]  : i.vendor_products.vendor_profiles,
          product_images:   Array.isArray(i.vendor_products.product_images)   ? i.vendor_products.product_images       : [],
          regional_pricing: Array.isArray(i.vendor_products.regional_pricing) ? i.vendor_products.regional_pricing     : [],
        },
      })))
    }
    setLoading(false)
  }, [params.id, db])

  useEffect(() => { loadData() }, [loadData])

  // Check if there are cart items to import
  useEffect(() => {
    const checkCart = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: cartItems } = await db.from('cart_items')
        .select('id, quantity, products(id, name, price_eur, price_inr, price_gbp)')
        .eq('user_id', user.id)
        .limit(10)
      setCartImport(cartItems || [])
    }
    checkCart()
  }, [db])

  const importCartToProject = async () => {
    if (!cartImport.length) return
    setImporting(true)
    const days = project?.start_date && project?.end_date
      ? Math.max(1, Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000))
      : 1
    for (const item of cartImport) {
      const prod = Array.isArray(item.products) ? item.products[0] : item.products
      if (!prod) continue
      const price = prod.price_inr || prod.price_eur || 0
      await db.from('project_items').upsert({
        project_id: params.id,
        vendor_product_id: prod.id,
        vendor_id: null,
        quantity: item.quantity,
        days,
        unit_price: price,
        total_price: price * item.quantity * days,
      }, { onConflict: 'project_id,vendor_product_id' })
    }
    // Clear cart
    const { data: { user } } = await db.auth.getUser()
    if (user) await db.from('cart_items').delete().eq('user_id', user.id)
    setCartImport([])
    toast.success(`${cartImport.length} cart items imported to project!`)
    loadData()
    setImporting(false)
  }

  // Load browse products when switching to browse view
  const loadBrowseProducts = useCallback(async () => {
    if (products.length > 0) return // already loaded
    setBrowseLoading(true)
    const { data: prods } = await db.from('vendor_products')
      .select('*, vendor_profiles(*), product_images(*), regional_pricing(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setProducts((prods || []).map((p: any) => ({
      ...p,
      vendor_profiles:  Array.isArray(p.vendor_profiles)  ? p.vendor_profiles[0]  : p.vendor_profiles,
      product_images:   Array.isArray(p.product_images)   ? p.product_images       : [],
      regional_pricing: Array.isArray(p.regional_pricing) ? p.regional_pricing     : [],
    })))
    setBrowseLoading(false)
  }, [db, products.length])

  useEffect(() => {
    if (view === 'browse') loadBrowseProducts()
  }, [view, loadBrowseProducts])

  const addToProject = async (product: any) => {
    const existing = cartItems.find(i => i.vendor_product_id === product.id)
    if (existing) {
      const newQty  = existing.quantity + 1
      const newTotal= existing.unit_price * newQty * existing.days
      await db.from('project_items').update({ quantity: newQty, total_price: newTotal }).eq('id', existing.id)
      setCartItems(ci => ci.map(i => i.id === existing.id ? { ...i, quantity: newQty, total_price: newTotal } : i))
      toast.success('Quantity updated')
      return
    }
    const days  = project?.start_date && project?.end_date
      ? Math.max(1, Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000))
      : 1
    const { data, error } = await db.from('project_items').insert({
      project_id:        params.id,
      vendor_product_id: product.id,
      vendor_id:         product.vendor_profiles?.id || product.vendor_id,
      quantity: 1, days,
      unit_price:  product.price_per_day,
      total_price: product.price_per_day * days,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setCartItems(ci => [...ci, {
      id: data.id, vendor_product_id: product.id,
      vendor_id: product.vendor_profiles?.id || product.vendor_id,
      quantity: 1, days,
      unit_price: product.price_per_day,
      total_price: product.price_per_day * days,
      product,
    }])
    toast.success('Added to project!')
  }

  const removeItem = async (itemId: string) => {
    await db.from('project_items').delete().eq('id', itemId)
    setCartItems(ci => ci.filter(i => i.id !== itemId))
  }

  const updateDays = async (itemId: string, days: number) => {
    if (days < 1) return
    const item  = cartItems.find(i => i.id === itemId)
    if (!item) return
    const total = item.unit_price * item.quantity * days
    await db.from('project_items').update({ days, total_price: total }).eq('id', itemId)
    setCartItems(ci => ci.map(i => i.id === itemId ? { ...i, days, total_price: total } : i))
  }

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return
    const item  = cartItems.find(i => i.id === itemId)
    if (!item) return
    const total = item.unit_price * qty * item.days
    await db.from('project_items').update({ quantity: qty, total_price: total }).eq('id', itemId)
    setCartItems(ci => ci.map(i => i.id === itemId ? { ...i, quantity: qty, total_price: total } : i))
  }

  const cartTotal    = cartItems.reduce((s, i) => s + i.total_price, 0)
  const vendorCount  = new Set(cartItems.map(i => i.vendor_id)).size

  const filteredBrowse = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-8 text-[#6B6B6B] text-sm">Loading…</div>
  if (!project) return <div className="p-8 text-[#6B6B6B] text-sm">Project not found</div>

  const sym = SYM[project.currency || 'EUR']

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDD8CF] px-8 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/projects" className="text-[#6B6B6B] hover:text-navy transition-colors flex-shrink-0">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-navy text-lg truncate">{project.name}</h1>
              <div className="flex items-center gap-3 text-[12px] text-[#6B6B6B]">
                {project.city && <span className="flex items-center gap-1"><MapPin size={10} />{project.city}</span>}
                {project.start_date && <span className="flex items-center gap-1"><Calendar size={10} />{new Date(project.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg p-0.5">
              <button onClick={() => setView('items')}
                className={`px-4 py-2 rounded-md text-[12.5px] font-medium transition-all ${view === 'items' ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
                Project Items ({cartItems.length})
              </button>
              <button onClick={() => setView('browse')}
                className={`px-4 py-2 rounded-md text-[12.5px] font-medium transition-all ${view === 'browse' ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
                + Browse & Add
              </button>
            </div>

            <Link href={`/projects/${params.id}/schedule`}
              className="flex items-center gap-1.5 border border-[#DDD8CF] text-[#6B6B6B] hover:border-navy hover:text-navy font-medium px-3 py-2 rounded-lg text-sm transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Schedule
            </Link>
            {cartItems.length > 0 && (
              <Link href={`/projects/${params.id}/checkout`}
                className="flex items-center gap-2 bg-navy hover:bg-gold text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                <ShoppingBag size={15} />
                Checkout · {sym}{cartTotal.toLocaleString()}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW: Project Items ── */}
      {view === 'items' && (
        <div className="p-8">
          {cartItems.length === 0 ? (
            <div className="bg-white border border-[#DDD8CF] rounded-2xl p-16 text-center max-w-lg mx-auto mt-8">
              <Package size={40} className="mx-auto mb-4 text-[#DDD8CF]" />
              <h2 className="font-display font-bold text-xl text-navy mb-2">No items added yet</h2>
              <p className="text-[#6B6B6B] text-sm mb-6">Add rental products to this project from the catalogue.</p>
              <button onClick={() => setView('browse')}
                className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-navy-light transition-colors inline-flex items-center gap-2">
                <Plus size={16} /> Browse & Add Products
              </button>
            </div>
          ) : (
            <div className="max-w-[900px] mx-auto space-y-4">
              {/* Summary bar */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-[13px]">
                  <span className="text-[#6B6B6B]">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                  <span className="text-[#DDD8CF]">·</span>
                  <span className="text-[#6B6B6B]">{vendorCount} vendor{vendorCount !== 1 ? 's' : ''}</span>
                  {project.budget && (
                    <>
                      <span className="text-[#DDD8CF]">·</span>
                      <span className={cartTotal > project.budget ? 'text-red-600 font-medium' : 'text-[#6B6B6B]'}>
                        Budget: {sym}{cartTotal.toLocaleString()} / {sym}{project.budget.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <button onClick={() => setView('browse')}
                  className="flex items-center gap-1.5 text-[12.5px] text-gold hover:text-gold-light transition-colors font-medium">
                  <Plus size={13} /> Add more products
                </button>
              </div>

              {/* Items list */}
              {cartItems.map(item => {
                const primaryImg = item.product.product_images?.find((i: any) => i.is_primary) || item.product.product_images?.[0]
                const vendor     = item.product.vendor_profiles

                return (
                  <div key={item.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      {/* Image */}
                      <Link href={`/browse/products/${item.vendor_product_id}`}
                        className="w-20 h-20 bg-[#F5F2EC] rounded-lg overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity">
                        {primaryImg
                          ? <img src={primaryImg.url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package size={24} className="text-[#DDD8CF]" />
                            </div>
                        }
                      </Link>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/browse/products/${item.vendor_product_id}`}
                              className="font-display font-semibold text-navy text-[14px] hover:text-gold transition-colors leading-snug">
                              {item.product.name}
                            </Link>
                            {vendor && <p className="text-[12px] text-[#6B6B6B] mt-0.5">by {vendor.company_name}</p>}
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-[#6B6B6B] hover:text-red-500 transition-colors p-1 flex-shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          {/* Qty */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#6B6B6B]">Qty:</span>
                            <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                              <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2.5 py-1.5 text-[#6B6B6B] hover:bg-cream transition-colors text-sm">−</button>
                              <span className="px-3 font-semibold text-navy text-sm">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2.5 py-1.5 text-[#6B6B6B] hover:bg-cream transition-colors text-sm">+</button>
                            </div>
                          </div>

                          {/* Days */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#6B6B6B]">Days:</span>
                            <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                              <button onClick={() => updateDays(item.id, item.days - 1)} className="px-2.5 py-1.5 text-[#6B6B6B] hover:bg-cream transition-colors text-sm">−</button>
                              <span className="px-3 font-semibold text-navy text-sm">{item.days}</span>
                              <button onClick={() => updateDays(item.id, item.days + 1)} className="px-2.5 py-1.5 text-[#6B6B6B] hover:bg-cream transition-colors text-sm">+</button>
                            </div>
                          </div>

                          {/* Unit price */}
                          <span className="text-[12px] text-[#6B6B6B]">
                            {sym}{item.unit_price.toLocaleString()}/day
                          </span>

                          {/* Total */}
                          <span className="font-display font-bold text-navy ml-auto">
                            {sym}{item.total_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Total + checkout */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[#6B6B6B]">Total across {vendorCount} vendor{vendorCount !== 1 ? 's' : ''}</p>
                  <p className="font-display font-extrabold text-2xl text-navy">{sym}{cartTotal.toLocaleString()}</p>
                </div>
                <Link href={`/projects/${params.id}/checkout`}
                  className="bg-navy hover:bg-gold text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base">
                  Proceed to Checkout →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW: Browse & Add ── */}
      {view === 'browse' && (
        <div className="p-8">
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <div className="flex bg-white border border-[#DDD8CF] rounded-lg overflow-hidden flex-1 max-w-[400px]">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products to add…"
                className="flex-1 px-4 py-2.5 text-sm outline-none" />
              {search && <button onClick={() => setSearch('')} className="px-3 text-[#6B6B6B]"><X size={14} /></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap border-[1.5px] flex-shrink-0 transition-all ${category === cat ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {browseLoading ? (
            <div className="text-center py-16 text-[#6B6B6B]">Loading products…</div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredBrowse.map(product => {
                const inCart     = cartItems.find(i => i.vendor_product_id === product.id)
                const primaryImg = product.product_images?.find((i: any) => i.is_primary) || product.product_images?.[0]
                const vendor     = product.vendor_profiles
                const { price, currency } = getRegionalPrice({ ...product, regional_pricing: product.regional_pricing }, project.region || 'IN', FALLBACK_RATES)

                return (
                  <div key={product.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${inCart ? 'border-navy/30 ring-1 ring-navy/10' : 'border-[#DDD8CF]'}`}>
                    <div className="aspect-[4/3] bg-[#F5F2EC] relative overflow-hidden">
                      <Link href={`/browse/products/${product.id}`} className="block w-full h-full">
                        {primaryImg
                          ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} className="text-[#DDD8CF]" />
                            </div>
                        }
                      </Link>
                      {inCart && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded">
                          ✓ Added
                        </span>
                      )}
                    </div>
                    <div className="p-3.5">
                      {product.category && <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>}
                      <Link href={`/browse/products/${product.id}`}
                        className="font-display font-semibold text-navy text-[13.5px] leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors block">
                        {product.name}
                      </Link>
                      {vendor && <p className="text-[11px] text-[#6B6B6B] mb-2">by {vendor.company_name}</p>}
                      <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE4]">
                        <div>
                          <span className="font-bold text-navy text-[13px]">{formatPrice(price, currency)}</span>
                          <span className="text-[11px] text-[#6B6B6B] ml-1">/day</span>
                        </div>
                        <button onClick={() => addToProject(product)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                            inCart ? 'bg-navy/10 text-navy hover:bg-navy/20' : 'bg-navy text-white hover:bg-gold'
                          }`}>
                          <Plus size={13} /> {inCart ? 'Add More' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
