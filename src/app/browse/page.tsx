'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search, X, Zap, Heart, ShoppingCart, FolderOpen, Plus, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, getRegionalPrice, FALLBACK_RATES, REGION_FLAGS, REGION_CURRENCIES } from '@/lib/utils/currency'
import { useRegion } from '@/hooks/useRegion'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const CATEGORIES = ['All','Furniture','Display & Shelving','TV & Digital Displays','Audio / Visual','Lighting','Kitchen & Catering','IT & Connectivity']
const REGIONS    = [{ id: '', label: '🌍 All' },{ id: 'IN', label: '🇮🇳 India' },{ id: 'EU', label: '🇪🇺 Europe' },{ id: 'UK', label: '🇬🇧 UK' }]

type AddModal = { product: any } | null

// Calculate end date from start + days
const addDays = (dateStr: string, days: number) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days - 1)
  return d.toISOString().split('T')[0]
}

const today = () => new Date().toISOString().split('T')[0]

export default function BrowsePage() {
  const db                       = useMemo(() => createClient() as any, [])
  const { region: userRegion }   = useRegion()
  const { toggle, isWishlisted } = useWishlist()
  const { user }                 = useAuth()
  const router                   = useRouter()

  const [products,  setProducts]  = useState<any[]>([])
  const [projects,  setProjects]  = useState<any[]>([])
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [region,    setRegion]    = useState('')
  const [modal,     setModal]     = useState<AddModal>(null)

  // Modal state
  const [modalDays,      setModalDays]      = useState(1)
  const [modalQty,       setModalQty]       = useState(1)
  const [modalStartDate, setModalStartDate] = useState(today())
  const [adding,         setAdding]         = useState(false)

  // Derived
  const modalEndDate   = addDays(modalStartDate, modalDays)
  const activeRegion   = region || userRegion || 'IN'
  const cartCount      = cartItems.reduce((s: number, i: any) => s + (i.quantity || 0), 0)

  useEffect(() => {
    const load = async () => {
      const { data: prods }           = await db.from('vendor_products')
        .select('*, vendor_profiles(id,company_name,is_verified), product_images(*), regional_pricing(*)')
        .eq('is_active', true).order('created_at', { ascending: false })

      const normalized = (prods || []).map((p: any) => ({
        ...p,
        vendor_profiles:  Array.isArray(p.vendor_profiles)  ? p.vendor_profiles[0]  : p.vendor_profiles,
        product_images:   Array.isArray(p.product_images)   ? p.product_images       : [],
        regional_pricing: Array.isArray(p.regional_pricing) ? p.regional_pricing     : [],
      }))
      setProducts(normalized)

      const { data: { user: authUser } } = await db.auth.getUser()
      if (authUser) {
        const [{ data: projs }, { data: cart }] = await Promise.all([
          db.from('projects').select('id,name').eq('consultant_id', authUser.id)
            .not('status','eq','completed').not('status','eq','cancelled')
            .order('updated_at', { ascending: false }),
          db.from('cart_items').select('id,quantity,product_id').eq('user_id', authUser.id),
        ])
        setProjects(projs || [])
        setCartItems(cart || [])
      }
      setLoading(false)
    }
    load()
  }, [db])

  const openModal = (product: any) => {
    if (!user) { router.push('/login?redirectTo=/browse'); return }
    setModalDays(1)
    setModalQty(1)
    setModalStartDate(today())
    setModal({ product })
  }

  const handleAddToCart = async () => {
    if (!modal) return
    setAdding(true)
    const { data: { user: authUser } } = await db.auth.getUser()
    if (!authUser) { router.push('/login?redirectTo=/browse'); return }

    const { data: existing } = await db.from('cart_items')
      .select('id,quantity').eq('user_id', authUser.id).eq('product_id', modal.product.id).single()

    if (existing) {
      await db.from('cart_items').update({ quantity: existing.quantity + modalQty }).eq('id', existing.id)
      setCartItems(ci => ci.map((i: any) => i.id === existing.id ? { ...i, quantity: i.quantity + modalQty } : i))
    } else {
      const { data } = await db.from('cart_items').insert({
        user_id: authUser.id, product_id: modal.product.id, quantity: modalQty,
      }).select().single()
      if (data) setCartItems(ci => [...ci, data])
    }
    toast.success(`Added to cart — ${modalQty} unit${modalQty > 1 ? 's' : ''}`)
    setAdding(false)
    setModal(null)
  }

  const handleCheckoutNow = async () => {
    await handleAddToCart()
    router.push('/checkout')
  }

  const handleAddToProject = async (projectId: string) => {
    if (!modal) return
    setAdding(true)
    const days = modalDays
    const { price } = getRegionalPrice({ ...modal.product, regional_pricing: modal.product.regional_pricing }, activeRegion, FALLBACK_RATES)

    const { data: existing } = await db.from('project_items')
      .select('id,quantity,unit_price,days').eq('project_id', projectId).eq('vendor_product_id', modal.product.id).single()

    if (existing) {
      const newQty = existing.quantity + modalQty
      await db.from('project_items').update({ quantity: newQty, total_price: existing.unit_price * newQty * existing.days }).eq('id', existing.id)
    } else {
      await db.from('project_items').insert({
        project_id: projectId, vendor_product_id: modal.product.id,
        vendor_id: modal.product.vendor_profiles?.id || modal.product.vendor_id,
        quantity: modalQty, days,
        unit_price: price, total_price: price * modalQty * days,
      })
    }
    toast.success('Added to project!')
    setAdding(false)
    setModal(null)
  }

  const filtered = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !region || (p.serves_regions as string[] || []).includes(region) || (p.regions as string[] || []).includes(region))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const modalPrice = modal
    ? getRegionalPrice({ ...modal.product, regional_pricing: modal.product.regional_pricing }, activeRegion, FALLBACK_RATES)
    : null

  return (
    <div>
      {/* Cart bar — sticky, shows when cart has items */}
      {cartCount > 0 && (
        <div className="bg-navy text-white px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <ShoppingCart size={17} className="text-gold" />
            <span className="text-sm font-medium"><strong>{cartCount}</strong> item{cartCount !== 1 ? 's' : ''} in cart</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/cart" className="text-sm text-white/70 hover:text-white border border-white/20 px-4 py-1.5 rounded-lg transition-colors">
              View Cart
            </Link>
            <Link href="/checkout" className="text-sm bg-gold hover:bg-gold-light text-navy font-bold px-4 py-1.5 rounded-lg transition-colors">
              Checkout →
            </Link>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy">Browse Products</h1>
            <p className="text-[#6B6B6B] text-sm mt-1">Exhibition rental items — add to cart or a project</p>
          </div>
          <Link href="/emergency" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
            <Zap size={14} /> Emergency
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 mb-6 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg overflow-hidden flex-1 min-w-[200px]">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent" />
              {search
                ? <button onClick={() => setSearch('')} className="px-3 text-[#6B6B6B]"><X size={14} /></button>
                : <span className="px-3 flex items-center text-[#6B6B6B]"><Search size={14} /></span>
              }
            </div>
            {REGIONS.map(r => (
              <button key={r.id} onClick={() => setRegion(r.id)}
                className={`px-3.5 py-2.5 rounded-lg border-[1.5px] text-[12.5px] font-medium transition-all ${region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap border-[1.5px] flex-shrink-0 transition-all ${category === cat ? 'bg-gold text-navy border-gold' : 'bg-white border-[#DDD8CF] hover:border-gold'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#6B6B6B]">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
            <p className="text-navy font-display font-bold text-lg mb-2">No products found</p>
            <p className="text-[#6B6B6B] text-sm">Try different filters.</p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-[#6B6B6B] mb-5">
              <strong className="text-navy">{filtered.length}</strong> products
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filtered.map(product => {
                const vendor  = product.vendor_profiles
                const imgs    = product.product_images || []
                const primary = imgs.find((i: any) => i.is_primary) || imgs[0]
                const { price, currency } = getRegionalPrice({ ...product, regional_pricing: product.regional_pricing }, activeRegion, FALLBACK_RATES)
                const wishlisted = isWishlisted(product.id)

                return (
                  <div key={product.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all group">
                    {/* Image — clickable */}
                    <div className="aspect-[4/3] bg-[#F5F2EC] relative overflow-hidden">
                      <Link href={`/browse/products/${product.id}`} className="block w-full h-full">
                        {primary
                          ? <img src={primary.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                            </div>
                        }
                      </Link>
                      {/* Wishlist */}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id) }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-[#6B6B6B] hover:bg-red-50 hover:text-red-500'}`}>
                        <Heart size={14} className={wishlisted ? 'fill-white' : ''} />
                      </button>
                    </div>
                    <div className="p-4">
                      {product.category && <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>}
                      <Link href={`/browse/products/${product.id}`}
                        className="font-display font-semibold text-navy text-[14px] leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors block">
                        {product.name}
                      </Link>
                      {vendor && (
                        <p className="text-[11.5px] text-[#6B6B6B] mb-3">
                          by {vendor.company_name}
                          {vendor.is_verified && <span className="ml-1 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">✓</span>}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-[#F0ECE4]">
                        <div>
                          <span className="font-display font-bold text-navy">{formatPrice(price, currency)}</span>
                          <span className="text-[11px] text-[#6B6B6B] ml-1">/day</span>
                        </div>
                        <button onClick={() => openModal(product)}
                          className="flex items-center gap-1.5 bg-navy text-white text-[12px] font-medium px-3 py-2 rounded-lg hover:bg-gold transition-colors">
                          <Plus size={13} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Add Modal ── */}
      {modal && modalPrice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">
            {/* Product header */}
            <div className="flex items-start gap-4 p-5 border-b border-[#DDD8CF]">
              <div className="w-16 h-16 bg-[#F5F2EC] rounded-xl overflow-hidden flex-shrink-0">
                {(() => {
                  const img = modal.product.product_images?.find((i: any) => i.is_primary) || modal.product.product_images?.[0]
                  return img ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : null
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-navy text-[14px] leading-snug line-clamp-2">{modal.product.name}</p>
                <p className="text-[12px] text-[#6B6B6B] mt-0.5">{formatPrice(modalPrice.price, modalPrice.currency)}/day</p>
              </div>
              <button onClick={() => setModal(null)} className="text-[#6B6B6B] hover:text-navy p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Start date */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">
                  <Calendar size={11} className="inline mr-1" /> Start Date
                </label>
                <input type="date" min={today()}
                  value={modalStartDate}
                  onChange={e => setModalStartDate(e.target.value)}
                  className="w-full border border-[#DDD8CF] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
              </div>

              {/* Days + Qty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Rental Days</label>
                  <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                    <button onClick={() => setModalDays(d => Math.max(1, d - 1))} className="px-3 py-2.5 hover:bg-cream transition-colors font-bold text-lg">−</button>
                    <span className="flex-1 text-center font-semibold text-navy">{modalDays}</span>
                    <button onClick={() => setModalDays(d => d + 1)} className="px-3 py-2.5 hover:bg-cream transition-colors font-bold text-lg">+</button>
                  </div>
                  {/* Auto end date */}
                  {modalStartDate && (
                    <p className="text-[11px] text-[#6B6B6B] mt-1.5 flex items-center gap-1">
                      <Calendar size={10} className="text-gold" />
                      Ends: <strong>{new Date(modalEndDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</strong>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Quantity</label>
                  <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                    <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="px-3 py-2.5 hover:bg-cream transition-colors font-bold text-lg">−</button>
                    <span className="flex-1 text-center font-semibold text-navy">{modalQty}</span>
                    <button onClick={() => setModalQty(q => q + 1)} className="px-3 py-2.5 hover:bg-cream transition-colors font-bold text-lg">+</button>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-[12.5px] text-[#6B6B6B]">
                  {formatPrice(modalPrice.price, modalPrice.currency)} × {modalQty} × {modalDays}d
                </span>
                <span className="font-display font-bold text-navy text-xl">
                  {formatPrice(modalPrice.price * modalQty * modalDays, modalPrice.currency)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {/* Add to cart */}
                <button onClick={handleAddToCart} disabled={adding}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-navy hover:bg-gold text-white rounded-xl transition-colors disabled:opacity-60">
                  <ShoppingCart size={16} className="flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-[13.5px]">Add to Cart</p>
                    <p className="text-[11.5px] text-white/70">Continue browsing and checkout later</p>
                  </div>
                </button>

                {/* Checkout now */}
                <button onClick={handleCheckoutNow} disabled={adding}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-gold hover:bg-gold-light text-navy rounded-xl transition-colors disabled:opacity-60">
                  <ShoppingCart size={16} className="flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-[13.5px]">Checkout Now</p>
                    <p className="text-[11.5px] text-navy/60">Add to cart and go to checkout immediately</p>
                  </div>
                </button>

                {/* Add to project */}
                {projects.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-[#DDD8CF]" />
                      <span className="text-[11px] text-[#6B6B6B]">or add to a project</span>
                      <div className="flex-1 h-px bg-[#DDD8CF]" />
                    </div>
                    {projects.map(proj => (
                      <button key={proj.id} onClick={() => handleAddToProject(proj.id)} disabled={adding}
                        className="w-full flex items-center gap-3 px-4 py-3 border-[1.5px] border-[#DDD8CF] hover:border-navy rounded-xl transition-colors disabled:opacity-60">
                        <FolderOpen size={15} className="text-gold flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-semibold text-[13px] text-navy">{proj.name}</p>
                          <p className="text-[11px] text-[#6B6B6B]">Add to this project</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {projects.length === 0 && (
                  <Link href="/projects/new"
                    className="w-full flex items-center gap-3 px-4 py-3 border-[1.5px] border-[#DDD8CF] hover:border-navy rounded-xl transition-colors">
                    <FolderOpen size={15} className="text-gold flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-[13px] text-navy">Create a Project</p>
                      <p className="text-[11px] text-[#6B6B6B]">Organise items by exhibition</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
