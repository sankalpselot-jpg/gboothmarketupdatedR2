'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Edit3, Eye, Save, X, Upload, ArrowLeft,
  Plus, Minus, Globe, ChevronDown, ChevronUp,
  CheckCircle, Shield, Truck, RefreshCw,
  Headphones, Clock, Video, Calendar, Star
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  formatPrice, CURRENCY_SYMBOLS, REGION_FLAGS, REGION_LABELS,
  FALLBACK_RATES, REGION_CURRENCIES, convertCurrency
} from '@/lib/utils/currency'

const ALL_REGIONS    = ['EU','UK','US','IN','OTHER']
const ALL_CURRENCIES = ['INR','EUR','GBP','USD']
const CATEGORIES     = [
  'Booth Structures','Lounge Furniture','Tables & Chairs','Reception Counters',
  'Flooring','Lighting','A/V & Electronics','Signage & Graphics','Storage & Shelving','Outdoor Equipment',
]

// Condition grades by product type
const CONDITION_OPTIONS: Record<string, string[]> = {
  electronics: ['A — Less than 1 year old', 'B — 1–3 years old', 'C — Older inventory'],
  furniture:   ['New', 'Excellent', 'Good'],
  default:     ['New', 'Excellent', 'Good', 'Grade A', 'Grade B', 'Grade C'],
}

type RegionalPrice  = { region: string; currency: string; price: number; is_manual: boolean }
type ProductImage   = { id: string; url: string; filename: string; size_bytes: number; is_primary: boolean; sort_order: number }
type EventHistory   = { id?: string; event_name: string; venue: string; city: string; year: number | '' }

const SLA_ICONS: Record<string, any> = {
  delivery: Truck, pickup: RefreshCw, support: Headphones, replacement: RefreshCw
}
const formatHours = (h: number) =>
  h < 1 ? `${h * 60} min` : h === 1 ? '1 hr' : `${h} hrs`

export default function VendorProductDetailPage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])

  const [mode,        setMode]        = useState<'preview' | 'edit'>('preview')
  const [product,     setProduct]     = useState<any>(null)
  const [images,      setImages]      = useState<ProductImage[]>([])
  const [pricing,     setPricing]     = useState<RegionalPrice[]>([])
  const [sla,         setSla]         = useState<any>(null)
  const [eventHist,   setEventHist]   = useState<EventHistory[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [inspectionOpen, setInspectionOpen] = useState(false)

  const [form,            setForm]            = useState<any>({})
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [baseCurrency,    setBaseCurrency]    = useState('INR')
  const [basePrice,       setBasePrice]       = useState(0)
  const [overrides,       setOverrides]       = useState<Record<string, any>>({})
  const [newEvent,        setNewEvent]        = useState<EventHistory>({ event_name: '', venue: '', city: '', year: '' })

  const load = useCallback(async () => {
    const [{ data: p }, { data: imgs }, { data: rp }, { data: eh }] = await Promise.all([
      db.from('vendor_products').select('*, vendor_profiles(company_name, is_verified)').eq('id', params.id).single(),
      db.from('product_images').select('*').eq('product_id', params.id).order('sort_order'),
      db.from('regional_pricing').select('*').eq('product_id', params.id),
      db.from('product_event_history').select('*').eq('product_id', params.id).order('sort_order'),
    ])
    if (!p) return
    const vp = Array.isArray(p.vendor_profiles) ? p.vendor_profiles[0] : p.vendor_profiles
    setProduct({ ...p, vendor_profiles: vp })
    setImages(imgs || [])
    setPricing(rp || [])
    setEventHist((eh || []).map((e: any) => ({ id: e.id, event_name: e.event_name, venue: e.venue || '', city: e.city || '', year: e.year || '' })))

    // Load vendor SLAs
    const { data: vendorSla } = await db.from('vendor_slas').select('*').eq('vendor_id', p.vendor_id).single()
    setSla(vendorSla)

    setForm({
      name:                 p.name,
      description:          p.description          || '',
      category:             p.category             || '',
      price_per_day:        p.price_per_day,
      dimensions:           p.dimensions           || '',
      weight_kg:            p.weight_kg            || '',
      badge:                p.badge                || '',
      tags:                 (p.tags || []).join(', '),
      total_stock:          p.total_stock,
      available_stock:      p.available_stock,
      min_rental_days:      p.min_rental_days,
      max_rental_days:      p.max_rental_days,
      is_active:            p.is_active,
      condition_grade:      p.condition_grade      || '',
      inventory_age:        p.inventory_age        || '',
      last_service_date:    p.last_service_date    || '',
      video_url:            p.video_url            || '',
      inspection_available: p.inspection_available || false,
    })
    setBaseCurrency(p.base_currency || 'INR')
    setBasePrice(p.price_per_day)
    setSelectedRegions(p.serves_regions || [])

    const ov: Record<string, any> = {}
    for (const r of (rp || [])) {
      ov[r.region] = { price: r.price.toString(), currency: r.currency, manual: r.is_manual }
    }
    setOverrides(ov)
    setLoading(false)
  }, [params.id, db])

  useEffect(() => { load() }, [load])

  const computedPrices = useMemo(() => {
    const result: Record<string, { price: number; currency: string }> = {}
    for (const region of selectedRegions) {
      const ov = overrides[region]
      if (ov?.manual && ov.price) {
        result[region] = { price: parseFloat(ov.price) || 0, currency: ov.currency }
      } else {
        const toCur = REGION_CURRENCIES[region] || baseCurrency
        const rate  = baseCurrency === toCur ? 1 : (FALLBACK_RATES[baseCurrency]?.[toCur] || 1)
        result[region] = { price: Math.round(basePrice * rate * 100) / 100, currency: toCur }
      }
    }
    return result
  }, [selectedRegions, basePrice, baseCurrency, overrides])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await db.from('vendor_products').update({
      name:                 form.name,
      description:          form.description          || null,
      category:             form.category             || null,
      price_per_day:        parseFloat(form.price_per_day) || basePrice,
      base_currency:        baseCurrency,
      serves_regions:       selectedRegions,
      dimensions:           form.dimensions           || null,
      weight_kg:            form.weight_kg ? parseFloat(form.weight_kg) : null,
      badge:                form.badge                || null,
      tags:                 form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      total_stock:          parseInt(form.total_stock),
      available_stock:      parseInt(form.available_stock),
      min_rental_days:      parseInt(form.min_rental_days),
      max_rental_days:      parseInt(form.max_rental_days),
      is_active:            form.is_active,
      condition_grade:      form.condition_grade      || null,
      inventory_age:        form.inventory_age        || null,
      last_service_date:    form.last_service_date    || null,
      video_url:            form.video_url            || null,
      inspection_available: form.inspection_available,
    }).eq('id', params.id)

    if (error) { toast.error(error.message); setSaving(false); return }

    // Save regional pricing
    if (selectedRegions.length > 0) {
      await fetch(`/api/vendor/products/${params.id}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions: selectedRegions, base_price: basePrice, base_currency: baseCurrency,
          overrides: Object.fromEntries(
            Object.entries(overrides).map(([k, v]: any) => [k, v.manual ? { price: parseFloat(v.price), currency: v.currency } : null])
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
      const fn  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await db.storage.from('vendor-images').upload(fn, file, { contentType: file.type })
      if (error) { toast.error(error.message); continue }
      const { data: { publicUrl } } = db.storage.from('vendor-images').getPublicUrl(fn)
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
  }

  const setPrimary = async (imgId: string) => {
    await db.from('product_images').update({ is_primary: false }).eq('product_id', params.id)
    await db.from('product_images').update({ is_primary: true }).eq('id', imgId)
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imgId })))
  }

  const addEventHistory = async () => {
    if (!newEvent.event_name) return
    const { data } = await db.from('product_event_history').insert({
      product_id: params.id,
      event_name: newEvent.event_name,
      venue:      newEvent.venue  || null,
      city:       newEvent.city   || null,
      year:       newEvent.year   || null,
      sort_order: eventHist.length,
    }).select().single()
    if (data) setEventHist(prev => [...prev, { id: data.id, event_name: data.event_name, venue: data.venue || '', city: data.city || '', year: data.year || '' }])
    setNewEvent({ event_name: '', venue: '', city: '', year: '' })
    toast.success('Event added')
  }

  const removeEventHistory = async (idx: number) => {
    const item = eventHist[idx]
    if (item.id) await db.from('product_event_history').delete().eq('id', item.id)
    setEventHist(prev => prev.filter((_, i) => i !== idx))
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const selectCls = 'w-full bg-[#1A1D26] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50 transition-colors cursor-pointer appearance-none'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5'

  if (loading) return <div className="p-8 text-white/30 text-sm">Loading product…</div>
  if (!product) return <div className="p-8 text-white/30 text-sm">Product not found.</div>

  const primaryImg = images.find(i => i.is_primary) || images[0]
  const vendor     = product.vendor_profiles

  // Condition grade display
  const getConditionColor = (grade: string) => {
    if (!grade) return null
    const g = grade.toLowerCase()
    if (g.startsWith('a') || g === 'new' || g === 'grade a') return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/25' }
    if (g.startsWith('b') || g === 'excellent' || g === 'grade b') return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' }
    return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' }
  }
  const condColor = getConditionColor(product.condition_grade)

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
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${product.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-400' : 'bg-white/20'}`} />
            {product.is_active ? 'Live' : 'Hidden'}
          </div>
        </div>
      </div>

      {/* ── PREVIEW MODE ────────────────────────────────────── */}
      {mode === 'preview' && (
        <div className="max-w-[1100px] mx-auto px-8 py-10">
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-5 py-3 mb-8 flex items-center gap-3">
            <Eye size={16} className="text-gold-light flex-shrink-0" />
            <p className="text-[13px] text-gold-light">
              <strong>Preview as Consultant</strong> — This is exactly how your product appears to buyers.
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
                    <div key={img.id} className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${img.is_primary ? 'border-gold' : 'border-white/10'}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {product.category && <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-2">{product.category}</p>}
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
              {product.description && <p className="text-white/60 text-[14px] leading-relaxed mb-5">{product.description}</p>}

              {/* ── Verified Inventory badges ── */}
              <div className="flex flex-wrap gap-2 mb-5">
                {product.condition_grade && condColor && (
                  <span className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full border ${condColor.bg} ${condColor.text} ${condColor.border}`}>
                    <CheckCircle size={11} /> {product.condition_grade}
                  </span>
                )}
                {product.inventory_age && (
                  <span className="flex items-center gap-1.5 text-[11.5px] bg-white/5 border border-white/10 text-white/50 px-3 py-1.5 rounded-full">
                    <Clock size={11} /> {product.inventory_age}
                  </span>
                )}
                {product.last_service_date && (
                  <span className="flex items-center gap-1.5 text-[11.5px] bg-white/5 border border-white/10 text-white/50 px-3 py-1.5 rounded-full">
                    <Calendar size={11} /> Serviced: {new Date(product.last_service_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {product.inspection_available && (
                  <span className="flex items-center gap-1.5 text-[11.5px] bg-blue-500/15 border border-blue-500/25 text-blue-400 px-3 py-1.5 rounded-full font-semibold">
                    <Video size={11} /> Live Inspection Available
                  </span>
                )}
              </div>

              {/* Video + Inspection CTA */}
              {(product.video_url || product.inspection_available) && (
                <div className="flex gap-3 mb-5">
                  {product.video_url && (
                    <a href={product.video_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[12.5px] bg-white/5 border border-white/10 text-white/70 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
                      <Video size={14} /> Watch Walkthrough
                    </a>
                  )}
                  {product.inspection_available && (
                    <button onClick={() => setInspectionOpen(true)}
                      className="flex items-center gap-2 text-[12.5px] bg-blue-500/15 border border-blue-500/25 text-blue-400 px-4 py-2.5 rounded-lg hover:bg-blue-500/25 transition-colors">
                      <Video size={14} /> Request Live Inspection
                    </button>
                  )}
                </div>
              )}

              {/* Pricing */}
              <div className="bg-white/5 border border-white/8 rounded-xl p-5 mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display font-extrabold text-3xl text-white">
                    {formatPrice(product.price_per_day, baseCurrency)}
                  </span>
                  <span className="text-white/40 text-sm">/ day</span>
                </div>
                {selectedRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 mb-3">
                    {selectedRegions.map(r => (
                      <span key={r} className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-white/50">
                        {REGION_FLAGS[r]} {REGION_LABELS[r]}
                      </span>
                    ))}
                  </div>
                )}
                {pricing.length > 0 && (
                  <div>
                    <button onClick={() => setPricingOpen(v => !v)}
                      className="flex items-center gap-2 text-[12.5px] text-gold-light hover:text-gold transition-colors mb-2">
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

              {/* SLA Badges */}
              {sla && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2.5">Service Commitments</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full">
                      <Truck size={11} /> Delivery {sla.delivery_hours}h before event
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full">
                      <RefreshCw size={11} /> Pickup within {sla.pickup_hours}h after
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] bg-green-500/10 border border-green-500/20 text-green-300 px-3 py-1.5 rounded-full">
                      <Headphones size={11} /> Support: {formatHours(sla.support_response_hours)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full">
                      <RefreshCw size={11} /> Replacement in {sla.replacement_hours}h
                    </span>
                    {sla.onsite_support_available && (
                      <span className="flex items-center gap-1.5 text-[11.5px] bg-gold/15 border border-gold/30 text-gold-light px-3 py-1.5 rounded-full font-semibold">
                        <Shield size={11} /> On-site Support Available
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Previously Used At */}
              {eventHist.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2.5">Previously Used At</p>
                  <div className="space-y-1.5">
                    {eventHist.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12.5px] text-white/60">
                        <Star size={10} className="text-gold flex-shrink-0" />
                        <span className="font-medium text-white/80">{e.event_name}</span>
                        {e.year && <span className="text-white/30">{e.year}</span>}
                        {(e.venue || e.city) && <span className="text-white/30">· {e.venue || e.city}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs */}
              {(product.dimensions || product.weight_kg) && (
                <div className="flex gap-4 mb-3">
                  {product.dimensions && <span className="text-[13px] text-white/40">📐 {product.dimensions}</span>}
                  {product.weight_kg  && <span className="text-[13px] text-white/40">⚖️ {product.weight_kg}kg</span>}
                </div>
              )}

              {/* Stock */}
              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
                product.available_stock === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : product.available_stock <= 2 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {product.available_stock === 0 ? '✗ Out of stock'
                 : product.available_stock <= 2 ? `⚠ Only ${product.available_stock} left`
                 : `✓ ${product.available_stock} available`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODE ───────────────────────────────────────── */}
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
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 cursor-pointer ${img.is_primary ? 'border-gold' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  {img.is_primary && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded whitespace-nowrap">Main</span>}
                  <button onClick={() => removeImage(img)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className={`w-24 h-24 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors ${uploading ? 'opacity-50' : ''}`}>
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
              <input className={inputCls} value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[100px] resize-none'} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select className={selectCls} value={form.category || ''} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Badge</label>
                <select className={selectCls} value={form.badge || ''} onChange={e => setForm((f: any) => ({ ...f, badge: e.target.value }))}>
                  <option value="">— None —</option>
                  {['New','Popular','Featured','Best Seller','Limited'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dimensions</label>
                <input className={inputCls} value={form.dimensions || ''} onChange={e => setForm((f: any) => ({ ...f, dimensions: e.target.value }))} placeholder="3m × 3m × 2.5m H" />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" className={inputCls} value={form.weight_kg || ''} onChange={e => setForm((f: any) => ({ ...f, weight_kg: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input className={inputCls} value={form.tags || ''} onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))} placeholder="modular, LED, lightweight…" />
            </div>
          </div>

          {/* ── VERIFIED INVENTORY ── */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <h2 className="font-display font-bold text-white">Verified Inventory</h2>
              <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">BUILDS TRUST</span>
            </div>
            <p className="text-white/30 text-[12.5px]">These details are shown as trust badges on your product listing.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Condition Grade</label>
                <select className={selectCls} value={form.condition_grade || ''} onChange={e => setForm((f: any) => ({ ...f, condition_grade: e.target.value }))}>
                  <option value="">— Select condition —</option>
                  <optgroup label="Electronics / A/V">
                    <option value="Grade A — Less than 1 year">Grade A — Less than 1 year</option>
                    <option value="Grade B — 1–3 years old">Grade B — 1–3 years old</option>
                    <option value="Grade C — Older inventory">Grade C — Older inventory</option>
                  </optgroup>
                  <optgroup label="Furniture / Structures">
                    <option value="New">New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls}>Age of Inventory</label>
                <select className={selectCls} value={form.inventory_age || ''} onChange={e => setForm((f: any) => ({ ...f, inventory_age: e.target.value }))}>
                  <option value="">— Select age —</option>
                  <option value="Less than 6 months">Less than 6 months</option>
                  <option value="6–12 months">6–12 months</option>
                  <option value="1–2 years">1–2 years</option>
                  <option value="2–3 years">2–3 years</option>
                  <option value="3+ years">3+ years</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Last Service / Maintenance Date</label>
                <input type="date" className={inputCls} value={form.last_service_date || ''} onChange={e => setForm((f: any) => ({ ...f, last_service_date: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Video Walkthrough URL</label>
                <input className={inputCls} value={form.video_url || ''} onChange={e => setForm((f: any) => ({ ...f, video_url: e.target.value }))} placeholder="YouTube or Vimeo URL" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-white">Live Video Inspection Available</p>
                <p className="text-[12px] text-white/40 mt-0.5">Consultants can request a WhatsApp/Meet/Platform call to see items before booking</p>
              </div>
              <div style={{ height: 24, width: 44 }}
                className={`rounded-full relative cursor-pointer transition-colors ${form.inspection_available ? 'bg-blue-500' : 'bg-white/15'}`}
                onClick={() => setForm((f: any) => ({ ...f, inspection_available: !f.inspection_available }))}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-all ${form.inspection_available ? 'left-[22px]' : 'left-[2px]'}`} />
              </div>
            </div>
          </div>

          {/* ── PREVIOUSLY USED AT ── */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-gold-light" />
              <h2 className="font-display font-bold text-white">Previously Used At</h2>
            </div>
            <p className="text-white/30 text-[12.5px] mb-5">
              List real exhibitions where this product has been used. Dramatically increases consultant trust.
            </p>

            {/* Existing events */}
            {eventHist.map((e, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 mb-2">
                <Star size={12} className="text-gold flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-white">{e.event_name}</span>
                  {e.year && <span className="text-[12px] text-white/40 ml-2">{e.year}</span>}
                  {(e.venue || e.city) && <span className="text-[12px] text-white/30 ml-2">· {e.venue || e.city}</span>}
                </div>
                <button onClick={() => removeEventHistory(i)} className="text-white/30 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Add new event */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <input className={inputCls + ' col-span-2'} placeholder="Event name *" value={newEvent.event_name}
                onChange={e => setNewEvent(n => ({ ...n, event_name: e.target.value }))} />
              <input className={inputCls} placeholder="Venue/City" value={newEvent.city}
                onChange={e => setNewEvent(n => ({ ...n, city: e.target.value }))} />
              <input type="number" className={inputCls} placeholder="Year" value={newEvent.year}
                onChange={e => setNewEvent(n => ({ ...n, year: e.target.value ? parseInt(e.target.value) : '' }))} />
            </div>
            <button onClick={addEventHistory} disabled={!newEvent.event_name}
              className="mt-2 flex items-center gap-2 text-[12.5px] bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40">
              <Plus size={13} /> Add Event
            </button>
          </div>

          {/* Stock */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <h2 className="font-display font-bold text-white mb-5">Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Total Units</label><input type="number" min="1" className={inputCls} value={form.total_stock || ''} onChange={e => setForm((f: any) => ({ ...f, total_stock: e.target.value }))} /></div>
              <div><label className={labelCls}>Available Now</label><input type="number" min="0" className={inputCls} value={form.available_stock || ''} onChange={e => setForm((f: any) => ({ ...f, available_stock: e.target.value }))} /></div>
              <div><label className={labelCls}>Min Rental Days</label><input type="number" min="1" className={inputCls} value={form.min_rental_days || ''} onChange={e => setForm((f: any) => ({ ...f, min_rental_days: e.target.value }))} /></div>
              <div><label className={labelCls}>Max Rental Days</label><input type="number" min="1" className={inputCls} value={form.max_rental_days || ''} onChange={e => setForm((f: any) => ({ ...f, max_rental_days: e.target.value }))} /></div>
            </div>
          </div>

          {/* Pricing & Regions */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <h2 className="font-display font-bold text-white mb-1">Pricing &amp; Regions</h2>
            <p className="text-white/30 text-[12.5px] mb-6">Set a base price — regional prices auto-converted. Override any region manually.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2">
                <label className={labelCls}>Base Price *</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={basePrice || ''} onChange={e => setBasePrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Base Currency</label>
                <select className={selectCls} value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                  {ALL_CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <label className={labelCls}>Service Regions</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ALL_REGIONS.map(r => (
                <button key={r} type="button"
                  onClick={() => setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12.5px] font-medium transition-all ${
                    selectedRegions.includes(r) ? 'bg-gold/20 border-gold/50 text-gold-light' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}>
                  <span>{REGION_FLAGS[r]}</span><span>{REGION_LABELS[r]}</span>
                  {selectedRegions.includes(r) && <CheckCircle size={12} className="ml-auto text-gold-light" />}
                </button>
              ))}
            </div>
            {selectedRegions.length > 0 && (
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-white/3 border-b border-white/8 grid grid-cols-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  <span>Region</span><span>Currency</span><span>Price</span><span>Override</span>
                </div>
                {selectedRegions.map(region => {
                  const computed = computedPrices[region] || { price: 0, currency: 'INR' }
                  const ov       = overrides[region] || { price: '', currency: computed.currency, manual: false }
                  const isManual = ov.manual && ov.price
                  return (
                    <div key={region} className="px-4 py-3.5 grid grid-cols-4 items-center gap-3 border-b border-white/5 last:border-0">
                      <span className="flex items-center gap-2 text-[13px] text-white/70">{REGION_FLAGS[region]} {region}</span>
                      <span className="text-[13px] text-white/50">{computed.currency}</span>
                      <span className={`text-[13px] font-semibold ${isManual ? 'text-gold-light' : 'text-white'}`}>
                        {isManual ? formatPrice(parseFloat(ov.price), ov.currency) : formatPrice(computed.price, computed.currency)}
                        {isManual && <span className="text-[9px] text-gold/60 ml-1">custom</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" min="0"
                          placeholder={formatPrice(computed.price, computed.currency)}
                          value={ov.manual ? ov.price : ''}
                          onChange={e => setOverrides(prev => ({ ...prev, [region]: { price: e.target.value, currency: computed.currency, manual: !!e.target.value } }))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white placeholder-white/20 outline-none focus:border-gold/50 transition-colors" />
                        {ov.manual && (
                          <button onClick={() => setOverrides(prev => ({ ...prev, [region]: { price: '', currency: computed.currency, manual: false } }))} className="text-white/30 hover:text-white/60 flex-shrink-0"><X size={13} /></button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INSPECTION MODAL ─────────────────────────────── */}
      {inspectionOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1117] border border-white/10 rounded-2xl p-8 max-w-[480px] w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-white text-lg">Request Live Video Inspection</h3>
              <button onClick={() => setInspectionOpen(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-white/50 text-[13.5px] leading-relaxed mb-6">
              The vendor will schedule a live video call so you can inspect the actual item before booking.
            </p>
            <div className="space-y-3">
              {[
                { label: 'WhatsApp Video Call',  icon: '📱', desc: 'Quick call, share your number' },
                { label: 'Google Meet',           icon: '🎥', desc: 'Schedule a meeting link' },
                { label: 'Platform Video Call',   icon: '💻', desc: 'Video call via BoothMarket (coming soon)', disabled: true },
              ].map(opt => (
                <button key={opt.label} disabled={opt.disabled}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    opt.disabled
                      ? 'border-white/5 bg-white/3 opacity-40 cursor-not-allowed'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold/40'
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="text-[13.5px] font-medium text-white">{opt.label}</p>
                    <p className="text-[12px] text-white/40">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-white/25 mt-4 text-center">
              The vendor will be notified of your inspection request
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
