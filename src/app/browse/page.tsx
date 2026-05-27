'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Zap, CheckCircle, Globe } from 'lucide-react'
import Link from 'next/link'
import { formatPrice, getRegionalPrice, getServesBadges, REGION_FLAGS, REGION_CURRENCIES } from '@/lib/utils/currency'
import { useRegion } from '@/hooks/useRegion'

const CATEGORIES = ['All','Booth Structures','Lounge Furniture','Tables & Chairs','Reception Counters','Flooring','Lighting','A/V & Electronics','Signage & Graphics']
const REGIONS    = [{ id: '', label: '🌍 All' },{ id: 'IN', label: '🇮🇳 India' },{ id: 'EU', label: '🇪🇺 Europe' },{ id: 'UK', label: '🇬🇧 UK' },{ id: 'US', label: '🇺🇸 USA' }]

export default function BrowsePage() {
  const db = useMemo(() => createClient() as any, [])
  const { region: userRegion } = useRegion()
  const [products,  setProducts]  = useState<any[]>([])
  const [projects,  setProjects]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [region,    setRegion]    = useState('')
  const [addingTo,  setAddingTo]  = useState<string | null>(null)
  const [toastMsg,  setToastMsg]  = useState('')

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: { user } }] = await Promise.all([
        db.from('vendor_products')
          .select('*, vendor_profiles(id, company_name, is_verified), product_images(*), regional_pricing(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        db.auth.getUser(),
      ])

      // Normalise joins
      const normalized = (prods || []).map((p: any) => ({
        ...p,
        vendor_profiles: Array.isArray(p.vendor_profiles) ? p.vendor_profiles[0] : p.vendor_profiles,
        product_images:  Array.isArray(p.product_images) ? p.product_images : [],
        regional_pricing: Array.isArray(p.regional_pricing) ? p.regional_pricing : [],
      }))
      setProducts(normalized)

      if (user) {
        const { data: projs } = await db.from('projects')
          .select('id, name').eq('consultant_id', user.id)
          .not('status', 'eq', 'completed').not('status', 'eq', 'cancelled')
          .order('updated_at', { ascending: false })
        setProjects(projs || [])
      }
      setLoading(false)
    }
    load()
  }, [db])

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500) }

  const addToProject = async (productId: string, projectId: string, product: any) => {
    setAddingTo(productId)
    const vendor = product.vendor_profiles
    const { data: existing } = await db.from('project_items')
      .select('id, quantity').eq('project_id', projectId).eq('vendor_product_id', productId).single()

    if (existing) {
      await db.from('project_items').update({
        quantity: existing.quantity + 1,
        total_price: product.price_per_day * (existing.quantity + 1),
      }).eq('id', existing.id)
    } else {
      await db.from('project_items').insert({
        project_id: projectId, vendor_product_id: productId,
        vendor_id: vendor?.id || product.vendor_id,
        quantity: 1, days: 1,
        unit_price: product.price_per_day,
        total_price: product.price_per_day,
      })
    }
    setAddingTo(null)
    showToast('Added to project!')
  }

  // Filter by region = serves_regions contains selected region
  const filtered = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !region || (p.serves_regions as string[] || []).includes(region) || (p.regions as string[] || []).includes(region))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const activeRegion = region || userRegion || 'IN'

  return (
    <div className="p-8">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-navy text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl">
          ✓ {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Browse Products</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Explore vendor listings · Prices shown in your region's currency</p>
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
              placeholder="Search products, vendors…"
              className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent" />
            {search
              ? <button onClick={() => setSearch('')} className="px-3 text-[#6B6B6B]"><X size={14} /></button>
              : <span className="px-3 flex items-center text-[#6B6B6B]"><Search size={14} /></span>
            }
          </div>
          {REGIONS.map(r => (
            <button key={r.id} onClick={() => setRegion(r.id)}
              className={`px-3.5 py-2.5 rounded-lg border-[1.5px] text-[12.5px] font-medium transition-all ${
                region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'
              }`}>{r.label}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all border-[1.5px] flex-shrink-0 ${
                category === cat ? 'bg-gold text-navy border-gold' : 'bg-white border-[#DDD8CF] hover:border-gold'
              }`}>{cat}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B]">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <Globe size={36} className="mx-auto mb-3 text-[#DDD8CF]" />
          <p className="text-navy font-display font-bold text-lg mb-2">No products found</p>
          <p className="text-[#6B6B6B] text-sm">Try a different category or region filter.</p>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-[#6B6B6B] mb-5">
            <strong className="text-navy">{filtered.length}</strong> products ·
            Prices in <strong className="text-navy">{REGION_CURRENCIES[activeRegion] || 'INR'}</strong>
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filtered.map(product => {
              const vendor  = product.vendor_profiles
              const imgs    = product.product_images || []
              const primary = imgs.find((i: any) => i.is_primary) || imgs[0]
              const { price, currency } = getRegionalPrice(product, activeRegion)
              const serves  = product.serves_regions || product.regions || []

              return (
                <div key={product.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="aspect-[4/3] bg-[#F5F2EC] relative overflow-hidden">
                    {primary
                      ? <img src={primary.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                        </div>
                    }
                    {product.badge && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-gold text-navy px-2 py-0.5 rounded uppercase">{product.badge}</span>
                    )}
                  </div>
                  <div className="p-4">
                    {product.category && <p className="text-[10px] font-semibold uppercase tracking-wide text-gold mb-1">{product.category}</p>}
                    <h3 className="font-display font-semibold text-navy text-[14px] leading-snug mb-1 line-clamp-2">{product.name}</h3>
                    {vendor && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <p className="text-[11.5px] text-[#6B6B6B]">by {vendor.company_name}</p>
                        {vendor.is_verified && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                            <CheckCircle size={8} /> Verified
                          </span>
                        )}
                      </div>
                    )}

                    {/* Serves badges */}
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
                      {projects.length > 0 ? (
                        <div className="relative group">
                          <button disabled={addingTo === product.id}
                            className="bg-navy text-white text-[12px] font-medium px-3 py-2 rounded-lg hover:bg-gold transition-colors disabled:opacity-60">
                            {addingTo === product.id ? '…' : '+ Add'}
                          </button>
                          <div className="absolute right-0 bottom-full mb-1 bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 min-w-[180px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B] px-2 py-1.5">Add to project</p>
                            {projects.map((proj: any) => (
                              <button key={proj.id} onClick={() => addToProject(product.id, proj.id, product)}
                                className="w-full text-left px-3 py-2 text-[12.5px] text-navy hover:bg-[#F9F6F0] rounded-lg transition-colors truncate">
                                {proj.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link href="/projects/new" className="bg-cream-dark text-navy text-[12px] font-medium px-3 py-2 rounded-lg hover:bg-[#DDD8CF] transition-colors">
                          Create Project
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
