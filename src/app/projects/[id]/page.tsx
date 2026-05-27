'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Filter, X, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Project, VendorProduct, VendorProfile, ProductImage } from '@/types/database'

type ProductWithVendor = VendorProduct & {
  vendor_profiles: VendorProfile
  product_images: ProductImage[]
}
type CartItem = {
  id: string
  vendor_product_id: string
  vendor_id: string
  quantity: number
  days: number
  unit_price: number
  total_price: number
  product: ProductWithVendor
}

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }
const CATEGORIES = [
  'All','Booth Structures','Lounge Furniture','Tables & Chairs',
  'Reception Counters','Flooring','Lighting','A/V & Electronics',
  'Signage & Graphics',
]

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])

  const [project,   setProject]   = useState<Project | null>(null)
  const [products,  setProducts]  = useState<ProductWithVendor[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [cartOpen,  setCartOpen]  = useState(false)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [saving,    setSaving]    = useState(false)

  const loadData = useCallback(async () => {
    // Load project
    const { data: proj } = await db.from('projects').select('*').eq('id', params.id).single()
    if (!proj) return
    setProject(proj)

    // Load vendor products with images and vendor info
    let q = db.from('vendor_products')
      .select('*, vendor_profiles(*), product_images(*)')
      .eq('is_active', true)
      .contains('regions', [proj.region || 'IN'])

    const { data: prods } = await q.order('created_at', { ascending: false })
    setProducts(prods || [])

    // Load existing project items
    const { data: items } = await db.from('project_items')
      .select('*, vendor_products(*, vendor_profiles(*), product_images(*))')
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
        product:           {
          ...i.vendor_products,
          vendor_profiles: Array.isArray(i.vendor_products.vendor_profiles)
            ? i.vendor_products.vendor_profiles[0]
            : i.vendor_products.vendor_profiles,
          product_images: Array.isArray(i.vendor_products.product_images)
            ? i.vendor_products.product_images
            : [],
        },
      })))
    }
    setLoading(false)
  }, [params.id, db])

  useEffect(() => { loadData() }, [loadData])

  const addToCart = async (product: ProductWithVendor) => {
    const existing = cartItems.find(i => i.vendor_product_id === product.id)
    if (existing) {
      // Increment quantity
      const newQty   = existing.quantity + 1
      const newTotal = product.price_per_day * newQty * existing.days
      await db.from('project_items').update({ quantity: newQty, total_price: newTotal }).eq('id', existing.id)
      setCartItems(ci => ci.map(i => i.id === existing.id ? { ...i, quantity: newQty, total_price: newTotal } : i))
      toast.success('Quantity updated')
      return
    }

    const days  = project?.start_date && project?.end_date
      ? Math.max(1, Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / 86400000))
      : 1
    const total = product.price_per_day * days

    const { data, error } = await db.from('project_items').insert({
      project_id:        params.id,
      vendor_product_id: product.id,
      vendor_id:         product.vendor_id,
      quantity:          1,
      days,
      unit_price:        product.price_per_day,
      total_price:       total,
    }).select().single()

    if (error) { toast.error(error.message); return }
    setCartItems(ci => [...ci, {
      id: data.id, vendor_product_id: product.id, vendor_id: product.vendor_id,
      quantity: 1, days, unit_price: product.price_per_day, total_price: total, product,
    }])
    toast.success('Added to project')
    setCartOpen(true)
  }

  const removeFromCart = async (itemId: string) => {
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

  const cartTotal   = cartItems.reduce((s, i) => s + i.total_price, 0)
  const vendorCount = new Set(cartItems.map(i => i.vendor_id)).size

  const filtered = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-8 text-[#6B6B6B] text-sm">Loading workspace…</div>
  if (!project) return <div className="p-8 text-[#6B6B6B] text-sm">Project not found</div>

  const sym = SYM[project.currency || 'INR']

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-[#DDD8CF] px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/projects" className="text-[#6B6B6B] hover:text-navy transition-colors flex-shrink-0">
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <h1 className="font-display font-extrabold text-navy text-lg truncate">{project.name}</h1>
                <div className="flex items-center gap-3 text-[12px] text-[#6B6B6B]">
                  {project.city && <span className="flex items-center gap-1"><MapPin size={10} />{project.city}</span>}
                  {project.start_date && <span className="flex items-center gap-1"><Calendar size={10} />{new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {project.budget && (
                <span className="text-[12.5px] text-[#6B6B6B]">
                  Budget: <strong className={`text-navy ${cartTotal > project.budget ? 'text-red-500' : ''}`}>{sym}{cartTotal.toLocaleString()}</strong>
                  <span className="text-[#DDD8CF]"> / {sym}{project.budget.toLocaleString()}</span>
                </span>
              )}
              <button onClick={() => setCartOpen(v => !v)}
                className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors relative">
                <ShoppingBag size={16} />
                Cart
                {cartItems.length > 0 && (
                  <span className="bg-gold text-navy text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
              {cartItems.length > 0 && (
                <Link href={`/projects/${params.id}/checkout`}
                  className="bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
                  Checkout →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search + category filter */}
        <div className="px-8 py-4 bg-[#F5F2EC] border-b border-[#DDD8CF]">
          <div className="flex gap-3 flex-wrap">
            <div className="flex bg-white border border-[#DDD8CF] rounded-lg overflow-hidden flex-1 min-w-[200px]">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vendor products…"
                className="flex-1 px-4 py-2.5 text-sm outline-none" />
              {search
                ? <button onClick={() => setSearch('')} className="px-3 text-[#6B6B6B]"><X size={15} /></button>
                : <span className="px-3 flex items-center text-[#6B6B6B]"><Search size={15} /></span>
              }
            </div>
            <div className="flex gap-1.5 overflow-x-auto flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all border-[1.5px] ${
                    category === cat ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] text-[#1A1A1A] hover:border-navy'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="p-8">
          <p className="text-[13px] text-[#6B6B6B] mb-5">
            <strong className="text-navy">{filtered.length}</strong> products available
            {project.region && <span> in {project.region}</span>}
          </p>
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
              <p className="text-navy font-display font-bold text-lg mb-2">No products found</p>
              <p className="text-[#6B6B6B] text-sm">Try a different category or search term. Vendors may not have listed products for this region yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(product => {
                const inCart     = cartItems.find(i => i.vendor_product_id === product.id)
                const primaryImg = (product.product_images || []).find(i => i.is_primary) || product.product_images?.[0]
                const vendor     = Array.isArray(product.vendor_profiles)
                  ? product.vendor_profiles[0]
                  : product.vendor_profiles

                return (
                  <div key={product.id} className={`bg-white border rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all ${inCart ? 'border-navy/30 ring-1 ring-navy/10' : 'border-[#DDD8CF]'}`}>
                    <div className="bg-[#F5F2EC] aspect-[4/3] relative overflow-hidden">
                      {primaryImg
                        ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                              <rect x="2" y="7" width="20" height="14" rx="2"/>
                            </svg>
                          </div>
                      }
                      {product.badge && (
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-gold text-navy px-2 py-0.5 rounded uppercase">
                          {product.badge}
                        </span>
                      )}
                      {inCart && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-navy text-white px-2 py-0.5 rounded">
                          In Cart
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {product.category && (
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>
                      )}
                      <h3 className="font-display font-semibold text-navy text-[14px] leading-snug mb-1">{product.name}</h3>
                      {vendor && (
                        <p className="text-[11.5px] text-[#6B6B6B] mb-2">by {vendor.company_name}</p>
                      )}
                      {product.description && (
                        <p className="text-[12px] text-[#6B6B6B] leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                      )}
                      {product.dimensions && (
                        <p className="text-[11.5px] text-[#6B6B6B] mb-3">📐 {product.dimensions}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-[#F0ECE4]">
                        <div>
                          <span className="font-display font-bold text-navy text-lg">
                            {SYM[product.currency]}{product.price_per_day.toLocaleString()}
                          </span>
                          <span className="text-[11.5px] text-[#6B6B6B] ml-1">/day</span>
                        </div>
                        <button onClick={() => addToCart(product)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                            inCart
                              ? 'bg-navy/10 text-navy hover:bg-navy/15'
                              : 'bg-navy text-white hover:bg-gold'
                          }`}>
                          <Plus size={14} />
                          {inCart ? 'Add More' : 'Add to Project'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="w-[360px] bg-white border-l border-[#DDD8CF] flex flex-col h-screen sticky top-0 overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDD8CF]">
            <div>
              <h2 className="font-display font-bold text-navy">Project Cart</h2>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5">{vendorCount} vendor{vendorCount !== 1 ? 's' : ''} · {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setCartOpen(false)} className="text-[#6B6B6B] hover:text-navy p-1">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={28} className="mx-auto mb-3 text-[#DDD8CF]" />
                <p className="text-[#6B6B6B] text-sm">Add products to your project cart</p>
              </div>
            ) : cartItems.map(item => (
              <div key={item.id} className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg p-3.5">
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="w-10 h-10 bg-[#EDE8DF] rounded overflow-hidden flex-shrink-0">
                    {item.product.product_images?.[0]
                      ? <img src={item.product.product_images[0].url} alt="" className="w-full h-full object-cover" />
                      : null
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-navy leading-snug truncate">{item.product.name}</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{item.product.vendor_profiles?.company_name}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[#6B6B6B] hover:text-red-500 transition-colors p-0.5 flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6B6B6B]">×{item.quantity}</span>
                    <span className="text-[#6B6B6B]">·</span>
                    <div className="flex items-center gap-1 bg-white border border-[#DDD8CF] rounded px-1.5">
                      <button onClick={() => updateDays(item.id, item.days - 1)} className="p-0.5 text-[#6B6B6B] hover:text-navy"><Minus size={10} /></button>
                      <span className="text-navy font-medium px-1">{item.days}d</span>
                      <button onClick={() => updateDays(item.id, item.days + 1)} className="p-0.5 text-[#6B6B6B] hover:text-navy"><Plus size={10} /></button>
                    </div>
                  </div>
                  <span className="font-semibold text-navy">{SYM[item.product.currency]}{item.total_price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t border-[#DDD8CF] p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#6B6B6B]">Subtotal</span>
                <span className="font-semibold text-navy">{sym}{cartTotal.toLocaleString()}</span>
              </div>
              <p className="text-[11.5px] text-[#6B6B6B] mb-4">Split across {vendorCount} vendor{vendorCount !== 1 ? 's' : ''} at checkout</p>
              <Link href={`/projects/${params.id}/checkout`}
                className="block w-full bg-navy hover:bg-gold text-white font-bold py-3 rounded-lg text-center text-sm transition-colors">
                Proceed to Checkout →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
