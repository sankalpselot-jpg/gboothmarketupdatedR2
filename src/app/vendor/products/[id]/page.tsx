'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Edit3, Eye, Save, X, Upload, Trash2, ArrowLeft,
  Plus, Minus, Globe, ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  formatPrice, CURRENCY_SYMBOLS, REGION_FLAGS, REGION_LABELS,
  FALLBACK_RATES, REGION_CURRENCIES, convertCurrency
} from '@/lib/utils/currency'

const ALL_REGIONS = ['EU','UK','US','IN','OTHER']
const ALL_CURRENCIES = ['INR','EUR','GBP','USD']
const CATEGORIES = [
  'Booth Structures','Lounge Furniture','Tables & Chairs','Reception Counters',
  'Flooring','Lighting','A/V & Electronics','Signage & Graphics','Storage & Shelving','Outdoor Equipment',
]

type RegionalPrice = { region: string; currency: string; price: number; is_manual: boolean }
type ProductImage  = { id: string; url: string; filename: string; size_bytes: number; is_primary: boolean; sort_order: number }

export default function VendorProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])

  const [mode,      setMode]      = useState<'preview' | 'edit'>('preview')
  const [product,   setProduct]   = useState<any>(null)
  const [images,    setImages]    = useState<ProductImage[]>([])
  const [pricing,   setPricing]   = useState<RegionalPrice[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  // Edit form state
  const [form, setForm] = useState<any>({})
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [baseCurrency,    setBaseCurrency]    = useState('INR')
  const [basePrice,       setBasePrice]       = useState(0)
  const [overrides,       setOverrides]       = useState<Record<string, { price: string; currency: string; manual: boolean }>>({})

  const load = useCallback(async () => {
    const [{ data: p }, { data: imgs }, { data: rp }] = await Promise.all([
      db.from('vendor_products').select('*, vendor_profiles(company_name, is_verified)').eq('id', params.id).single(),
      db.from('product_images').select('*').eq('product_id', params.id).order('sort_order'),
      db.from('regional_pricing').select('*').eq('product_id', params.id),
    ])
    if (!p) return
    setProduct({ ...p, vendor_profiles: Array.isArray(p.vendor_profiles) ? p.vendor_profiles[0] : p.vendor_profiles })
    setImages(imgs || [])
    setPricing(rp || [])

    // Init form
    setForm({
      name:            p.name,
      description:     p.description     || '',
      category:        p.category        || '',
      price_per_day:   p.price_per_day,
      dimensions:      p.dimensions      || '',
      weight_kg:       p.weight_kg       || '',
      badge:           p.badge           || '',
      tags:            (p.tags || []).join(', '),
      total_stock:     p.total_stock,
      available_stock: p.available_stock,
      min_rental_days: p.min_rental_days,
      max_rental_days: p.max_rental_days,
      is_active:       p.is_active,
    })
    setBaseCurrency(p.base_currency || 'INR')
    setBasePrice(p.price_per_day)
    setSelectedRegions(p.serves_regions || [])

    // Init overrides from manual pricing
    const ov: Record<string, any> = {}
    for (const r of (rp || [])) {
      ov[r.region] = { price: r.price.toString(), currency: r.currency, manual: r.is_manual }
    }
    setOverrides(ov)
    setLoading(false)
  }, [params.id, db])

  useEffect(() => { load() }, [load])

  // Auto-compute prices when base changes
  const computedPrices = useMemo(() => {
    const result: Record<string, { price: number; currency: string }> = {}
    for (const region of selectedRegions) {
      const ov = overrides[region]
      if (ov?.manual && ov.price) {
        result[region] = { price: parseFloat(ov.price) || 0, currency: ov.currency }
      } else {
        const toCur  = REGION_CURRENCIES[region] || baseCurrency
        const rate   = baseCurrency === toCur ? 1 : (FALLBACK_RATES[baseCurrency]?.[toCur] || 1)
        result[region] = { price: Math.round(basePrice * rate * 100) / 100, currency: toCur }
      }
    }
    return result
  }, [selectedRegions, basePrice, baseCurrency, overrides])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await db.from('vendor_products').update({
      name:            form.name,
      description:     form.description     || null,
      category:        form.category        || null,
      price_per_day:   parseFloat(form.price_per_day) || basePrice,
      base_currency:   baseCurrency,
      serves_regions:  selectedRegions,
      dimensions:      form.dimensions      || null,
      weight_kg:       form.weight_kg ? parseFloat(form.weight_kg) : null,
      badge:           form.badge           || null,
      tags:            form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      total_stock:     parseInt(form.total_stock),
      available_stock: parseInt(form.available_stock),
      min_rental_days: parseInt(form.min_rental_days),
      max_rental_days: parseInt(form.max_rental_days),
      is_active:       form.is_active,
    }).eq('id', params.id)

    if (error) { toast.error(error.message); setSaving(false); return }

    // Save regional pricing
    if (selectedRegions.length > 0) {
      await fetch(`/api/vendor/products/${params.id}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions:       selectedRegions,
          base_price:    basePrice,
          base_currency: baseCurrency,
          overrides:     Object.fromEntries(
            Object.entries(overrides).map(([k, v]) => [k, v.manual ? { price: parseFloat(v.price), currency: v.currency } : null])
          ),
        }),
      })
    }

    toast.success('Product updated — live on marketplace!')
    await load()
    setMode('preview')
    setSaving(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) { toast.error('Maximum 5 images'); return }
    setUploading(true)
    for (const file of files) {
      if (file.size > 1024 * 1024) { toast.error(`${file.name} exceeds 1MB`); continue }
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await db.storage.from('vendor-images').upload(filename, file, { contentType: file.type })
      if (error) { toast.error(error.message); continue }
      const { data: { publicUrl } } = db.storage.from('vendor-images').getPublicUrl(filename)
      const { data: img } = await db.from('product_images').insert({
        product_id: params.id, url: publicUrl, filename: file.name,
        size_bytes: file.size, sort_order: images.length, is_primary: images.length === 0,
      }).select().single()
      if (img) setImages(prev => [...prev, img])
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = async (img: ProductImage) => {
    await db.from('product_images').delete().eq('id', img.id)
    setImages(prev => prev.filter(i => i.id !== img.id))
    toast.success('Image removed')
  }

  const setPrimary = async (imgId: string) => {
    await db.from('product_images').update({ is_primary: false }).eq('product_id', params.id)
    await db.from('product_images').update({ is_primary: true }).eq('id', imgId)
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imgId })))
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5'

  if (loading) return (
    <div className="p-8 text-white/30 text-sm flex items-center justify-center min-h-64">
      Loading product…
    </div>
  )
  if (!product) return (
    <div className="p-8 text-white/30 text-sm">Product not found.</div>
  )

  const primaryImg = images.find(i => i.is_primary) || images[0]
  const vendor     = product.vendor_profiles
  const sym        = CURRENCY_SYMBOLS[baseCurrency] || '₹'

  return (
    <div className="min-h-screen text-white">
      {/* Top bar */}
      <div className="bg-[#0A0D14] border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/vendor/products" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[12px] text-white/40">Product</p>
            <p className="font-display font-bold text-white text-sm">{product.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview / Edit toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-all ${mode === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
              <Eye size={14} /> Preview
            </button>
            <button onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[12.5px] font-medium transition-all ${mode === 'edit' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
              <Edit3 size={14} /> Edit
            </button>
          </div>

          {mode === 'edit' && (
            <>
              <button onClick={() => { setMode('preview'); load() }}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors">
                <X size={14} /> Discard
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
                <Save size={14} /> {saving ? 'Saving…' : 'Save & Publish'}
              </button>
            </>
          )}

          {/* Live status */}
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${product.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-400' : 'bg-white/20'}`} />
            {product.is_active ? 'Live' : 'Hidden'}
          </div>
        </div>
      </div>

      {/* Preview mode — exact consultant view */}
      {mode === 'preview' && (
        <div className="max-w-[1100px] mx-auto px-8 py-10">
          {/* Preview notice */}
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-5 py-3 mb-8 flex items-center gap-3">
            <Eye size={16} className="text-gold-light flex-shrink-0" />
            <p className="text-[13px] text-gold-light">
              <strong>Preview as Consultant</strong> — This is exactly how your product appears to buyers on the marketplace.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <div>
              <div className="bg-[#1A1D26] rounded-2xl overflow-hidden aspect-[4/3] mb-3">
                {primaryImg
                  ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 opacity-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                    </div>
                }
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map(img => (
                    <div key={img.id} className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${img.is_primary ? 'border-gold' : 'border-white/10 hover:border-white/30'}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {product.category && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-2">{product.category}</p>
              )}
              <h1 className="font-display font-extrabold text-3xl text-white tracking-tight mb-2">{product.name}</h1>
              {vendor && (
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-white/50 text-sm">by {vendor.company_name}</p>
                  {vendor.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle size={9} /> Verified
                    </span>
                  )}
                </div>
              )}

              {product.description && (
                <p className="text-white/60 text-[14px] leading-relaxed mb-6">{product.description}</p>
              )}

              {/* Specs */}
              {(product.dimensions || product.weight_kg) && (
                <div className="flex gap-4 mb-5">
                  {product.dimensions && <span className="text-[13px] text-white/40">📐 {product.dimensions}</span>}
                  {product.weight_kg  && <span className="text-[13px] text-white/40">⚖️ {product.weight_kg}kg</span>}
                </div>
              )}

              {/* Stock */}
              <div className="flex items-center gap-2 mb-5">
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
                  product.available_stock === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : product.available_stock <= 2 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                  {product.available_stock === 0 ? '✗ Out of stock'
                   : product.available_stock <= 2 ? `⚠ Only ${product.available_stock} left`
                   : `✓ ${product.available_stock} available`}
                </span>
                <span className="text-[12px] text-white/30">·</span>
                <span className="text-[12px] text-white/40">Min {product.min_rental_days}d · Max {product.max_rental_days}d</span>
              </div>

              {/* Pricing */}
              <div className="bg-white/5 border border-white/8 rounded-xl p-5 mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display font-extrabold text-3xl text-white">
                    {formatPrice(product.price_per_day, baseCurrency)}
                  </span>
                  <span className="text-white/40 text-sm">/ day</span>
                </div>
                <p className="text-[12px] text-white/30 mb-4">Base price in {baseCurrency}</p>

                {/* Serves regions */}
                {selectedRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRegions.map(r => (
                      <span key={r} className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-white/50">
                        {REGION_FLAGS[r]} {REGION_LABELS[r]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Regional pricing table */}
                {pricing.length > 0 && (
                  <div>
                    <button onClick={() => setPricingOpen(v => !v)}
                      className="flex items-center gap-2 text-[12.5px] text-gold-light hover:text-gold transition-colors mb-3">
                      <Globe size={13} /> Regional Pricing
                      {pricingOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {pricingOpen && (
                      <div className="space-y-1.5">
                        {pricing.map(rp => (
                          <div key={rp.region} className="flex items-center justify-between text-[13px]">
                            <span className="text-white/50 flex items-center gap-1.5">
                              {REGION_FLAGS[rp.region]} {REGION_LABELS[rp.region]}
                              {rp.is_manual && <span className="text-[9px] bg-gold/20 text-gold-light px-1.5 py-0.5 rounded">Custom</span>}
                            </span>
                            <span className="font-semibold text-white">{formatPrice(rp.price, rp.currency)}/day</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(product.tags as string[]).map(tag => (
                    <span key={tag} className="text-[11.5px] bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <div className="max-w-[900px] mx-auto px-8 py-8 space-y-6">

          {/* Images */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <h2 className="font-display font-bold text-white mb-2">Product Images</h2>
            <p className="text-white/30 text-[12px] mb-5">Up to 5 · Max 1MB each · Click to set as main image</p>
            <div className="flex flex-wrap gap-3">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <div onClick={() => setPrimary(img.id)}
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${img.is_primary ? 'border-gold' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  {img.is_primary && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded whitespace-nowrap">Main</span>
                  )}
                  <button onClick={() => removeImage(img)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className={`w-24 h-24 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload size={18} className="text-white/30" />
                  <span className="text-[10px] text-white/30">{uploading ? '…' : 'Add'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-white">Basic Information</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[12px] text-white/40">Visible to consultants</span>
                <div style={{ height: 22, width: 40 }}
                  className={`rounded-full relative cursor-pointer transition-colors ${form.is_active ? 'bg-gold' : 'bg-white/15'}`}
                  onClick={() => setForm((f: any) => ({ ...f, is_active: !f.is_active }))}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all ${form.is_active ? 'left-5' : 'left-1'}`} />
                </div>
              </label>
            </div>
            <div>
              <label className={labelCls}>Product Name *</label>
              <input className={inputCls} value={form.name || ''}
                onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[100px] resize-none'} value={form.description || ''}
                onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls + ' cursor-pointer'} value={form.category || ''}
                  onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Badge</label>
                <select className={inputCls + ' cursor-pointer'} value={form.badge || ''}
                  onChange={e => setForm((f: any) => ({ ...f, badge: e.target.value }))}>
                  <option value="">— None —</option>
                  {['New','Popular','Featured','Best Seller','Limited'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dimensions</label>
                <input className={inputCls} value={form.dimensions || ''}
                  onChange={e => setForm((f: any) => ({ ...f, dimensions: e.target.value }))}
                  placeholder="e.g. 3m × 3m × 2.5m H" />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" className={inputCls} value={form.weight_kg || ''}
                  onChange={e => setForm((f: any) => ({ ...f, weight_kg: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input className={inputCls} value={form.tags || ''}
                onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))}
                placeholder="modular, LED, lightweight…" />
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <h2 className="font-display font-bold text-white mb-5">Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Total Units</label>
                <input type="number" min="1" className={inputCls} value={form.total_stock || ''}
                  onChange={e => setForm((f: any) => ({ ...f, total_stock: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Available Now</label>
                <input type="number" min="0" className={inputCls} value={form.available_stock || ''}
                  onChange={e => setForm((f: any) => ({ ...f, available_stock: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Min Rental Days</label>
                <input type="number" min="1" className={inputCls} value={form.min_rental_days || ''}
                  onChange={e => setForm((f: any) => ({ ...f, min_rental_days: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Max Rental Days</label>
                <input type="number" min="1" className={inputCls} value={form.max_rental_days || ''}
                  onChange={e => setForm((f: any) => ({ ...f, max_rental_days: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Multi-region pricing */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <h2 className="font-display font-bold text-white mb-1">Pricing &amp; Regions</h2>
            <p className="text-white/30 text-[12.5px] mb-6">Set a base price — regional prices are auto-converted. Override any region manually.</p>

            {/* Base price + currency */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2">
                <label className={labelCls}>Base Price *</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={basePrice || ''}
                  onChange={e => setBasePrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Base Currency</label>
                <select className={inputCls + ' cursor-pointer'} value={baseCurrency}
                  onChange={e => setBaseCurrency(e.target.value)}>
                  {ALL_CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Region selection */}
            <label className={labelCls}>Service Regions</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ALL_REGIONS.map(r => {
                const selected = selectedRegions.includes(r)
                return (
                  <button key={r} type="button"
                    onClick={() => setSelectedRegions(prev =>
                      selected ? prev.filter(x => x !== r) : [...prev, r]
                    )}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12.5px] font-medium transition-all ${
                      selected ? 'bg-gold/20 border-gold/50 text-gold-light' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}>
                    <span>{REGION_FLAGS[r]}</span>
                    <span>{REGION_LABELS[r]}</span>
                    {selected && <CheckCircle size={12} className="ml-auto text-gold-light" />}
                  </button>
                )
              })}
            </div>

            {/* Live conversion preview + manual override */}
            {selectedRegions.length > 0 && (
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-white/3 border-b border-white/8 grid grid-cols-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  <span>Region</span><span>Currency</span><span>Price</span><span>Override</span>
                </div>
                {selectedRegions.map(region => {
                  const computed  = computedPrices[region] || { price: 0, currency: 'INR' }
                  const ov        = overrides[region] || { price: '', currency: computed.currency, manual: false }
                  const isManual  = ov.manual && ov.price

                  return (
                    <div key={region} className="px-4 py-3.5 grid grid-cols-4 items-center gap-3 border-b border-white/5 last:border-0">
                      <span className="flex items-center gap-2 text-[13px] text-white/70">
                        {REGION_FLAGS[region]} {region}
                      </span>
                      <span className="text-[13px] text-white/50">{computed.currency}</span>
                      <span className={`text-[13px] font-semibold ${isManual ? 'text-gold-light' : 'text-white'}`}>
                        {isManual
                          ? formatPrice(parseFloat(ov.price), ov.currency)
                          : formatPrice(computed.price, computed.currency)
                        }
                        {isManual && <span className="text-[9px] text-gold/60 ml-1">custom</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" step="0.01" min="0"
                          placeholder={formatPrice(computed.price, computed.currency)}
                          value={ov.manual ? ov.price : ''}
                          onChange={e => setOverrides(prev => ({
                            ...prev,
                            [region]: { price: e.target.value, currency: computed.currency, manual: !!e.target.value },
                          }))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white placeholder-white/20 outline-none focus:border-gold/50 transition-colors"
                        />
                        {ov.manual && (
                          <button onClick={() => setOverrides(prev => ({ ...prev, [region]: { price: '', currency: computed.currency, manual: false } }))}
                            className="text-white/30 hover:text-white/60 flex-shrink-0 transition-colors">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div className="px-4 py-3 bg-white/3 text-[11.5px] text-white/30">
                  Auto-converted from {formatPrice(basePrice, baseCurrency)} · Leave override blank to use auto rate
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
