'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Zap, CheckCircle, Globe, Heart, ShoppingCart, FolderOpen, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, getRegionalPrice, FALLBACK_RATES, REGION_FLAGS, REGION_CURRENCIES } from '@/lib/utils/currency'
import { useRegion } from '@/hooks/useRegion'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const CATEGORIES = ['All','Furniture','Display & Shelving','TV & Digital Displays','Audio / Visual','Lighting','Kitchen & Catering','IT & Connectivity']
const REGIONS    = [{ id: '', label: '🌍 All' },{ id: 'IN', label: '🇮🇳 India' },{ id: 'EU', label: '🇪🇺 Europe' },{ id: 'UK', label: '🇬🇧 UK' },{ id: 'US', label: '🇺🇸 USA' }]

type AddMode = null | { productId: string; product: any }

export default function BrowsePage() {
  const db                    = useMemo(() => createClient() as any, [])
  const { region: userRegion }= useRegion()
  const { toggle, isWishlisted} = useWishlist()
  const { user }              = useAuth()
  const { items: cartItems, addItem } = useCart(user?.id)
  const router                = useRouter()

  const [products,  setProducts]  = useState<any[]>([])
  const [projects,  setProjects]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [region,    setRegion]    = useState('')
  const [addMode,   setAddMode]   = useState<AddMode>(null)   // modal state
  const [addDays,   setAddDays]   = useState(1)
  const [addQty,    setAddQty]    = useState(1)
  const [adding,    setAdding]    = useState(false)

  // Cart summary
  const cartTotal = cartItems.reduce((s: number, i: any) => s + (i.products?.price_eur || 0) * i.quantity, 0)
  const cartCount = cartItems.reduce((s: number, i: any) => s + i.quantity, 0)

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: { user: authUser } }] = await Promise.all([
        db.from('vendor_products')
          .select('*, vendor_profiles(id, company_name, is_verified), product_images(*), regional_pricing(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        db.auth.getUser(),
      ])
      const normalized = (prods || []).map((p: any) => ({
        ...p,
        vendor_profiles:  Array.isArray(p.vendor_profiles)  ? p.vendor_profiles[0]  : p.vendor_profiles,
        product_images:   Array.isArray(p.product_images)   ? p.product_images       : [],
        regional_pricing: Array.isArray(p.regional_pricing) ? p.regional_pricing     : [],
      }))
      setProducts(normalized)
      if (authUser) {
        const { data: projs } = await db.from('projects')
          .select('id, name').eq('consultant_id', authUser.id)
          .not('status', 'eq', 'completed').not('status', 'eq', 'cancelled')
          .order('updated_at', { ascending: false })
        setProjects(projs || [])
      }
      setLoading(false)
    }
    load()
  }, [db])

  const showToast = (msg: string) => toast.success(msg)

  // Add to project
  const addToProject = async (productId: string, projectId: string, product: any, days: number, qty: number) => {
    const vendor = product.vendor_profiles
    const { data: existing } = await db.from('project_items')
      .select('id, quantity, unit_price').eq('project_id', projectId).eq('vendor_product_id', productId).single()
    if (existing) {
      const newQty   = existing.quantity + qty
      const newTotal = existing.unit_price * newQty * days
      await db.from('project_items').update({ quantity: newQty, days, total_price: newTotal }).eq('id', existing.id)
    } else {
      await db.from('project_items').insert({
        project_id: projectId, vendor_product_id: productId,
        vendor_id: vendor?.id || product.vendor_id,
        quantity: qty, days,
        unit_price: product.price_per_day,
        total_price: product.price_per_day * qty * days,
      })
    }
    showToast(`Added to project (${qty}× ${days} day${days > 1 ? 's' : ''})`)
  }

  // Handle add button click — open modal
  const handleAddClick = (product: any) => {
    if (!user) { router.push('/login?redirectTo=/browse'); return }
    setAddDays(1)
    setAddQty(1)
    setAddMode({ productId: product.id, product })
  }

  // Confirm add from modal
  const handleConfirmAdd = async (destination: 'cart' | string) => {
    if (!addMode) return
    setAdding(true)
    const { product } = addMode

    if (destination === 'cart') {
      // Add to Supabase cart (using existing cart system)
      const { data: { user: authUser } } = await db.auth.getUser()
      if (!authUser) { router.push('/login?redirectTo=/browse'); return }
      const { data: existing } = await db.from('cart_items')
        .select('id, quantity').eq('user_id', authUser.id).eq('product_id', addMode.productId).single()
      if (existing) {
        await db.from('cart_items').update({ quantity: existing.quantity + addQty }).eq('id', existing.id)
      } else {
        await db.from('cart_items').insert({
          user_id:    authUser.id,
          product_id: addMode.productId,
          quantity:   addQty,
        })
      }
      showToast(`Added to cart (${addQty} unit${addQty > 1 ? 's' : ''})`)
    } else {
      // Add to specific project
      await addToProject(addMode.productId, destination, product, addDays, addQty)
    }

    setAdding(false)
    setAddMode(null)
  }

  const activeRegion = region || userRegion || 'IN'
  const filtered = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !region || (p.serves_regions as string[] || []).includes(region) || (p.regions as string[] || []).includes(region))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* ── Cart/Checkout sticky bar (shows when cart has items) ── */}
      {cartCount > 0 && (
        <div className="bg-navy text-white px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <ShoppingCart size={18} className="text-gold" />
            <span className="text-sm font-medium">
              <strong>{cartCount}</strong> item{cartCount !== 1 ? 's' : ''} in cart
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/cart"
              className="text-sm text-white/70 hover:text-white border border-white/20 px-4 py-1.5 rounded-lg transition-colors">
              View Cart
            </Link>
            <Link href="/checkout"
              className="text-sm bg-gold hover:bg-gold-light text-navy font-bold px-4 py-1.5 rounded-lg transition-colors">
              Checkout →
            </Link>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy">Browse Products</h1>
            <p className="text-[#6B6B6B] text-sm mt-1">Exhibition rental items · Prices in your region's currency</p>
          </div>
          <Link href="/emergency" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
            <Zap size={15} /> Emergency Request
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 mb-6 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg overflow-hidden flex-1 min-w-[200px]">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
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
            <p className="text-[#6B6B6B] text-sm">Try a different category or region.</p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-[#6B6B6B] mb-5">
              <strong className="text-navy">{filtered.length}</strong> products ·
              Prices in <strong className="text-navy">{REGION_CURRENCIES[activeRegion] || 'EUR'}</strong>
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filtered.map(product => {
                const vendor  = product.vendor_profiles
                const imgs    = product.product_images || []
                const primary = imgs.find((i: any) => i.is_primary) || imgs[0]
                const { price, currency } = getRegionalPrice({ ...product, regional_pricing: product.regional_pricing }, activeRegion, FALLBACK_RATES)
                const wishlisted = isWishlisted(product.id)
                const serves  = product.serves_regions || product.regions || []

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
                      {product.badge && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-gold text-navy px-2 py-0.5 rounded uppercase pointer-events-none">{product.badge}</span>
                      )}
                      {/* Wishlist heart on image */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id) }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-[#6B6B6B] hover:bg-red-50 hover:text-red-500'}`}>
                        <Heart size={15} className={wishlisted ? 'fill-white' : ''} />
                      </button>
                    </div>

                    <div className="p-4">
                      {product.category && <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>}
                      {/* Product name — clickable */}
                      <Link href={`/browse/products/${product.id}`}
                        className="font-display font-semibold text-navy text-[14px] leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors block">
                        {product.name}
                      </Link>
                      {vendor && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <p className="text-[11.5px] text-[#6B6B6B]">by {vendor.company_name}</p>
                          {vendor.is_verified && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">✓</span>
                          )}
                        </div>
                      )}
                      {serves.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(serves as string[]).map(r => (
                            <span key={r} className="text-[9.5px] font-medium bg-[#F5F2EC] text-[#6B6B6B] border border-[#DDD8CF] px-1.5 py-0.5 rounded">
                              {REGION_FLAGS[r]} {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-[#F0ECE4]">
                        <div>
                          <span className="font-display font-bold text-navy">{formatPrice(price, currency)}</span>
                          <span className="text-[11px] text-[#6B6B6B] ml-1">/day</span>
                        </div>
                        <button
                          onClick={() => handleAddClick(product)}
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

      {/* ── Add Modal — days, qty, cart or project ── */}
      {addMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-[420px] w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-navy text-lg">Add to Cart or Project</h3>
                <p className="text-[#6B6B6B] text-[13px] mt-0.5 line-clamp-1">{addMode.product.name}</p>
              </div>
              <button onClick={() => setAddMode(null)} className="text-[#6B6B6B] hover:text-navy p-1 mt-0.5">
                <X size={18} />
              </button>
            </div>

            {/* Days + Qty selectors */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Rental Days</label>
                <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                  <button onClick={() => setAddDays(d => Math.max(1, d - 1))}
                    className="px-3 py-2.5 text-[#6B6B6B] hover:bg-cream transition-colors font-bold text-lg">−</button>
                  <span className="flex-1 text-center font-semibold text-navy">{addDays}</span>
                  <button onClick={() => setAddDays(d => d + 1)}
                    className="px-3 py-2.5 text-[#6B6B6B] hover:bg-cream transition-colors font-bold text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Quantity</label>
                <div className="flex items-center border border-[#DDD8CF] rounded-lg overflow-hidden">
                  <button onClick={() => setAddQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-[#6B6B6B] hover:bg-cream transition-colors font-bold text-lg">−</button>
                  <span className="flex-1 text-center font-semibold text-navy">{addQty}</span>
                  <button onClick={() => setAddQty(q => q + 1)}
                    className="px-3 py-2.5 text-[#6B6B6B] hover:bg-cream transition-colors font-bold text-lg">+</button>
                </div>
              </div>
            </div>

            {/* Total cost */}
            <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl px-4 py-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6B6B]">
                  {formatPrice(addMode.product.price_per_day, addMode.product.base_currency || 'EUR')} × {addQty} unit{addQty > 1 ? 's' : ''} × {addDays} day{addDays > 1 ? 's' : ''}
                </span>
                <span className="font-display font-bold text-navy text-lg">
                  {formatPrice(addMode.product.price_per_day * addQty * addDays, addMode.product.base_currency || 'EUR')}
                </span>
              </div>
              <p className="text-[11.5px] text-[#6B6B6B] mt-0.5">Estimated total rental cost</p>
            </div>

            {/* Destination buttons */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">Add to:</p>
            <div className="space-y-2">
              {/* Cart option */}
              <button onClick={() => handleConfirmAdd('cart')} disabled={adding}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-navy hover:bg-gold text-white rounded-xl transition-colors disabled:opacity-60">
                <ShoppingCart size={16} className="flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-[13.5px]">Add to Cart</p>
                  <p className="text-[11.5px] text-white/70">Standard checkout with payment</p>
                </div>
              </button>

              {/* Project options */}
              {projects.length > 0 ? (
                <>
                  <p className="text-[11px] text-[#6B6B6B] text-center py-1">— or add to a project —</p>
                  {projects.map(proj => (
                    <button key={proj.id} onClick={() => handleConfirmAdd(proj.id)} disabled={adding}
                      className="w-full flex items-center gap-3 px-4 py-3.5 border-[1.5px] border-[#DDD8CF] hover:border-navy rounded-xl transition-colors disabled:opacity-60">
                      <FolderOpen size={16} className="text-gold flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold text-[13.5px] text-navy">{proj.name}</p>
                        <p className="text-[11.5px] text-[#6B6B6B]">Add to this project</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <Link href="/projects/new"
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-[1.5px] border-[#DDD8CF] hover:border-navy rounded-xl transition-colors">
                  <FolderOpen size={16} className="text-gold flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-[13.5px] text-navy">Create New Project</p>
                    <p className="text-[11.5px] text-[#6B6B6B]">Organise items by exhibition</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
