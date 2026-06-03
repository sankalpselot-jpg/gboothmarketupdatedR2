'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search, Plus, Trash2, ShoppingBag, ArrowLeft,
  X, MapPin, Calendar, Package, ChevronRight, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice, getRegionalPrice, FALLBACK_RATES, REGION_FLAGS, REGION_CURRENCIES } from '@/lib/utils/currency'
import type { Project } from '@/types/database'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }
const CATEGORIES = ['All','Furniture','Display & Shelving','TV & Digital Displays','Audio / Visual','Lighting','Kitchen & Catering','IT & Connectivity']

type CartItem = {
  id: string; vendor_product_id: string; vendor_id: string
  quantity: number; days: number; unit_price: number; total_price: number; product: any
}

export default function ProjectWorkspacePage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])

  const [project,       setProject]       = useState<Project | null>(null)
  const [cartItems,     setCartItems]     = useState<CartItem[]>([])
  const [products,      setProducts]      = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [view,          setView]          = useState<'items' | 'browse'>('items')
  const [search,        setSearch]        = useState('')
  const [category,      setCategory]      = useState('All')

  // Derive rental days from project dates
  const rentalDays = useMemo(() => {
    if (!project?.start_date || !project?.end_date) return 1
    return Math.max(1, Math.ceil(
      (new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000
    ))
  }, [project])

  const projectRegion   = (project?.region   as string) || 'IN'
  const projectCurrency = (project?.currency as string) || REGION_CURRENCIES[projectRegion as keyof typeof REGION_CURRENCIES] || 'EUR'
  const sym             = SYM[projectCurrency] || '₹'

  const loadData = useCallback(async () => {
    const { data: proj } = await db.from('projects').select('*').eq('id', params.id).single()
    if (!proj) return
    setProject(proj)

    const { data: items } = await db.from('project_items')
      .select('*, vendor_products(*, vendor_profiles(*), product_images(*), regional_pricing(*))')
      .eq('project_id', params.id)

    if (items) {
      setCartItems(items.map((i: any) => ({
        id: i.id, vendor_product_id: i.vendor_product_id, vendor_id: i.vendor_id,
        quantity: i.quantity, days: i.days,
        unit_price: i.unit_price, total_price: i.total_price,
        product: {
          ...i.vendor_products,
          vendor_profiles:  Array.isArray(i.vendor_products?.vendor_profiles)  ? i.vendor_products.vendor_profiles[0]  : i.vendor_products?.vendor_profiles,
          product_images:   Array.isArray(i.vendor_products?.product_images)   ? i.vendor_products.product_images       : [],
          regional_pricing: Array.isArray(i.vendor_products?.regional_pricing) ? i.vendor_products.regional_pricing     : [],
        },
      })))
    }
    setLoading(false)
  }, [params.id, db])

  useEffect(() => { loadData() }, [loadData])

  const loadBrowseProducts = useCallback(async () => {
    if (products.length > 0) return
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

  useEffect(() => { if (view === 'browse') loadBrowseProducts() }, [view, loadBrowseProducts])

  const addToProject = async (product: any) => {
    const days = rentalDays
    const existing = cartItems.find(i => i.vendor_product_id === product.id)

    if (existing) {
      const newQty   = existing.quantity + 1
      const newTotal = existing.unit_price * newQty * existing.days
      await db.from('project_items').update({ quantity: newQty, total_price: newTotal }).eq('id', existing.id)
      setCartItems(ci => ci.map(i => i.id === existing.id ? { ...i, quantity: newQty, total_price: newTotal } : i))
      toast.success('Quantity updated')
      return
    }

    const { price } = getRegionalPrice({ ...product, regional_pricing: product.regional_pricing }, projectRegion, FALLBACK_RATES)
    const { data, error } = await db.from('project_items').insert({
      project_id:        params.id,
      vendor_product_id: product.id,
      vendor_id:         product.vendor_profiles?.id || product.vendor_id,
      quantity: 1, days,
      unit_price:  price,
      total_price: price * days,
    }).select().single()

    if (error) { toast.error(error.message); return }
    setCartItems(ci => [...ci, {
      id: data.id, vendor_product_id: product.id,
      vendor_id: product.vendor_profiles?.id || product.vendor_id,
      quantity: 1, days,
      unit_price: price, total_price: price * days, product,
    }])
    toast.success(`Added — ${days} day${days > 1 ? 's' : ''} pre-filled from project dates`)
  }

  const removeItem = async (itemId: string) => {
    await db.from('project_items').delete().eq('id', itemId)
    setCartItems(ci => ci.filter(i => i.id !== itemId))
    toast.success('Removed')
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

  const cartTotal   = cartItems.reduce((s, i) => s + i.total_price, 0)
  const vendorCount = new Set(cartItems.map(i => i.vendor_id)).size

  const filteredBrowse = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-8 text-[#6B6B6B] text-sm">Loading project…</div>
  if (!project) return <div className="p-8 text-[#6B6B6B] text-sm">Project not found</div>

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
              <div className="flex items-center gap-3 text-[12px] text-[#6B6B6B] flex-wrap">
                {project.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-gold" />{project.city}
                  </span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} className="text-gold" />
                    {new Date(project.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    {project.end_date && ` — ${new Date(project.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}`}
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium text-navy">
                  {REGION_FLAGS[projectRegion]} {projectRegion} · {projectCurrency} · {rentalDays}d
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg p-0.5">
              <button onClick={() => setView('items')}
                className={`px-4 py-2 rounded-md text-[12.5px] font-medium transition-all ${view === 'items' ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
                Items ({cartItems.length})
              </button>
              <button onClick={() => setView('browse')}
                className={`px-4 py-2 rounded-md text-[12.5px] font-medium transition-all ${view === 'browse' ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
                + Browse & Add
              </button>
            </div>
            {cartItems.length > 0 && (
              <Link href={`/projects/${params.id}/checkout`}
                className="flex items-center gap-2 bg-navy hover:bg-gold text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                <ShoppingBag size={15} /> Checkout · {sym}{cartTotal.toLocaleString()}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── PROJECT ITEMS VIEW ── */}
      {view === 'items' && (
        <div className="p-8">
          {cartItems.length === 0 ? (
            <div className="bg-white border border-[#DDD8CF] rounded-2xl p-16 text-center max-w-lg mx-auto mt-8">
              <Package size={40} className="mx-auto mb-4 text-[#DDD8CF]" />
              <h2 className="font-display font-bold text-xl text-navy mb-2">No items added yet</h2>
              <p className="text-[#6B6B6B] text-sm mb-6">Browse the catalogue and add rental items to this project.</p>
              <button onClick={() => setView('browse')}
                className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-navy-light transition-colors inline-flex items-center gap-2">
                <Plus size={16} /> Browse Products
              </button>
            </div>
          ) : (
            <div className="max-w-[900px] mx-auto space-y-4">
              {/* Project sync info */}
              {project.start_date && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3">
                  <Info size={15} className="text-blue-500 flex-shrink-0" />
                  <p className="text-[12.5px] text-blue-700">
                    Items are priced in <strong>{projectCurrency}</strong> for {REGION_FLAGS[projectRegion]} {projectRegion} · 
                    Rental duration pre-set to <strong>{rentalDays} day{rentalDays > 1 ? 's' : ''}</strong> based on your event dates.
                    Adjust per item below if needed.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-[13px]">
                  <span className="text-[#6B6B6B]">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                  <span className="text-[#DDD8CF]">·</span>
                  <span className="text-[#6B6B6B]">{vendorCount} vendor{vendorCount !== 1 ? 's' : ''}</span>
                  {project.budget && (
                    <>
                      <span className="text-[#DDD8CF]">·</span>
                      <span className={cartTotal > project.budget ? 'text-red-600 font-semibold' : 'text-green-700 font-medium'}>
                        {sym}{cartTotal.toLocaleString()} / {sym}{Number(project.budget).toLocaleString()} budget
                        {cartTotal > project.budget && ' ⚠ Over budget'}
                      </span>
                    </>
                  )}
                </div>
                <button onClick={() => setView('browse')}
                  className="flex items-center gap-1.5 text-[12.5px] text-gold hover:text-gold-light font-medium transition-colors">
                  <Plus size={13} /> Add more
                </button>
              </div>

              {/* Items */}
              {cartItems.map(item => {
                const primaryImg = item.product.product_images?.find((i: any) => i.is_primary) || item.product.product_images?.[0]
                const vendor     = item.product.vendor_profiles
                return (
                  <div key={item.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      <Link href={`/browse/products/${item.vendor_product_id}`}
                        className="w-20 h-20 bg-[#F5F2EC] rounded-lg overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity">
                        {primaryImg
                          ? <img src={primaryImg.url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-[#DDD8CF]" /></div>
                        }
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/browse/products/${item.vendor_product_id}`}
                              className="font-display font-semibold text-navy text-[14px] hover:text-gold transition-colors leading-snug">
                              {item.product.name}
                            </Link>
                            {vendor && <p className="text-[12px] text-[#6B6B6B] mt-0.5">by {vendor.company_name}</p>}
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-[#6B6B6B] hover:text-red-500 p-1 flex-shrink-0 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#6B6B6B]">Qty:</span>
                            <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                              <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-cream transition-colors text-sm">−</button>
                              <span className="px-3 font-semibold text-navy text-sm min-w-[32px] text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-cream transition-colors text-sm">+</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] text-[#6B6B6B]">Days:</span>
                            <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                              <button onClick={() => updateDays(item.id, item.days - 1)} className="px-2.5 py-1.5 hover:bg-cream transition-colors text-sm">−</button>
                              <span className="px-3 font-semibold text-navy text-sm min-w-[32px] text-center">{item.days}</span>
                              <button onClick={() => updateDays(item.id, item.days + 1)} className="px-2.5 py-1.5 hover:bg-cream transition-colors text-sm">+</button>
                            </div>
                          </div>
                          <span className="text-[12px] text-[#6B6B6B]">{sym}{item.unit_price.toLocaleString()}/day</span>
                          <span className="font-display font-bold text-navy ml-auto">{sym}{item.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Total + checkout */}
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[#6B6B6B]">{vendorCount} vendor{vendorCount !== 1 ? 's' : ''} · {rentalDays} day{rentalDays !== 1 ? 's' : ''}</p>
                  <p className="font-display font-extrabold text-2xl text-navy">{sym}{cartTotal.toLocaleString()}</p>
                </div>
                <Link href={`/projects/${params.id}/checkout`}
                  className="bg-navy hover:bg-gold text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base">
                  Checkout →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BROWSE & ADD VIEW ── */}
      {view === 'browse' && (
        <div className="p-8">
          {/* Project context banner */}
          <div className="bg-navy text-white rounded-xl px-5 py-3.5 mb-5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-white/50">Project:</span>
              <span className="font-semibold">{project.name}</span>
            </div>
            <div className="h-3 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-white/50">Region:</span>
              <span className="font-semibold">{REGION_FLAGS[projectRegion]} {projectRegion}</span>
            </div>
            <div className="h-3 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-white/50">Currency:</span>
              <span className="font-semibold">{projectCurrency}</span>
            </div>
            <div className="h-3 w-px bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-white/50">Duration:</span>
              <span className="font-semibold text-gold">{rentalDays} day{rentalDays > 1 ? 's' : ''} (auto-applied)</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex bg-white border border-[#DDD8CF] rounded-lg overflow-hidden flex-1 min-w-[200px]">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                className="flex-1 px-4 py-2.5 text-sm outline-none" />
              {search && <button onClick={() => setSearch('')} className="px-3 text-[#6B6B6B]"><X size={14} /></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-2.5 rounded-lg text-[12px] font-medium whitespace-nowrap border-[1.5px] flex-shrink-0 transition-all ${category === cat ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'}`}>
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
                const { price, currency } = getRegionalPrice(
                  { ...product, regional_pricing: product.regional_pricing },
                  projectRegion, FALLBACK_RATES
                )
                const totalForProject = price * rentalDays

                return (
                  <div key={product.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${inCart ? 'border-navy/40 ring-1 ring-navy/10' : 'border-[#DDD8CF]'}`}>
                    <div className="aspect-[4/3] bg-[#F5F2EC] relative overflow-hidden">
                      <Link href={`/browse/products/${product.id}`} className="block w-full h-full">
                        {primaryImg
                          ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-[#DDD8CF]" /></div>
                        }
                      </Link>
                      {inCart && (
                        <div className="absolute top-2 right-2 bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ In Project
                        </div>
                      )}
                    </div>
                    <div className="p-3.5">
                      {product.category && <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>}
                      <Link href={`/browse/products/${product.id}`}
                        className="font-display font-semibold text-navy text-[13.5px] leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors block">
                        {product.name}
                      </Link>
                      {vendor && <p className="text-[11px] text-[#6B6B6B] mb-2">by {vendor.company_name}</p>}

                      {/* Project-synced pricing */}
                      <div className="bg-[#F9F6F0] rounded-lg px-3 py-2 mb-3">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#6B6B6B]">{formatPrice(price, currency)}/day × {rentalDays}d</span>
                          <span className="font-bold text-navy">{formatPrice(totalForProject, currency)}</span>
                        </div>
                      </div>

                      <button onClick={() => addToProject(product)}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all ${
                          inCart ? 'bg-navy/10 text-navy hover:bg-navy/20 border border-navy/20' : 'bg-navy text-white hover:bg-gold'
                        }`}>
                        <Plus size={13} /> {inCart ? 'Add Another Unit' : `Add to Project`}
                      </button>
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
