'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, Clock, Calendar, Video,
  Truck, RefreshCw, Headphones, Shield, Star,
  Globe, ChevronDown, ChevronUp, Plus, FolderOpen,
  MapPin, Phone, ExternalLink, X
} from 'lucide-react'
import {
  formatPrice, REGION_FLAGS, REGION_LABELS,
  getRegionalPrice, FALLBACK_RATES
} from '@/lib/utils/currency'
import { useRegion } from '@/hooks/useRegion'
import toast from 'react-hot-toast'

const formatHours = (h: number) =>
  h < 1 ? `${h * 60} min` : h === 1 ? '1 hr' : `${h} hrs`

export default function ConsultantProductDetailPage() {
  const params  = useParams()
  const db      = useMemo(() => createClient() as any, [])
  const { region: userRegion } = useRegion()

  const [product,       setProduct]       = useState<any>(null)
  const [images,        setImages]        = useState<any[]>([])
  const [pricing,       setPricing]       = useState<any[]>([])
  const [sla,           setSla]           = useState<any>(null)
  const [eventHist,     setEventHist]     = useState<any[]>([])
  const [metrics,       setMetrics]       = useState<any>(null)
  const [projects,      setProjects]      = useState<any[]>([])
  const [activeImg,     setActiveImg]     = useState(0)
  const [pricingOpen,   setPricingOpen]   = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [addingTo,      setAddingTo]      = useState(false)
  const [projectPicker, setProjectPicker] = useState(false)
  const [inspectionOpen, setInspectionOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [
        { data: p },
        { data: imgs },
        { data: rp },
        { data: eh },
        { data: { user } },
      ] = await Promise.all([
        db.from('vendor_products')
          .select('*, vendor_profiles(id, company_name, phone, website, is_verified, regions)')
          .eq('id', params.id).single(),
        db.from('product_images').select('*').eq('product_id', params.id).order('sort_order'),
        db.from('regional_pricing').select('*').eq('product_id', params.id),
        db.from('product_event_history').select('*').eq('product_id', params.id).order('sort_order'),
        db.auth.getUser(),
      ])

      if (!p) return
      const vp = Array.isArray(p.vendor_profiles) ? p.vendor_profiles[0] : p.vendor_profiles
      setProduct({ ...p, vendor_profiles: vp })
      setImages(imgs || [])
      setPricing(rp || [])
      setEventHist(eh || [])

      // Load vendor SLAs and metrics
      if (vp?.id) {
        const [{ data: slaData }, { data: metricsData }] = await Promise.all([
          db.from('vendor_slas').select('*').eq('vendor_id', vp.id).single(),
          db.from('vendor_metrics').select('*').eq('vendor_id', vp.id).single(),
        ])
        setSla(slaData)
        setMetrics(metricsData)
      }

      // Load consultant's active projects
      if (user) {
        const { data: projs } = await db.from('projects')
          .select('id, name, status')
          .eq('consultant_id', user.id)
          .not('status', 'eq', 'completed')
          .not('status', 'eq', 'cancelled')
          .order('updated_at', { ascending: false })
        setProjects(projs || [])
      }

      setLoading(false)
    }
    load()
  }, [params.id, db])

  const addToProject = async (projectId: string) => {
    if (!product) return
    setAddingTo(true)
    setProjectPicker(false)

    const vendor = product.vendor_profiles
    const { data: existing } = await db.from('project_items')
      .select('id, quantity, unit_price')
      .eq('project_id', projectId)
      .eq('vendor_product_id', params.id)
      .single()

    if (existing) {
      const newQty   = existing.quantity + 1
      const newTotal = existing.unit_price * newQty
      await db.from('project_items')
        .update({ quantity: newQty, total_price: newTotal })
        .eq('id', existing.id)
      toast.success('Quantity updated in project')
    } else {
      await db.from('project_items').insert({
        project_id:        projectId,
        vendor_product_id: params.id,
        vendor_id:         vendor?.id || product.vendor_id,
        quantity:          1,
        days:              1,
        unit_price:        product.price_per_day,
        total_price:       product.price_per_day,
      })
      toast.success('Added to project!')
    }
    setAddingTo(false)
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!product) return (
    <div className="p-8 text-[#6B6B6B] text-sm">Product not found.</div>
  )

  const vendor     = product.vendor_profiles
  const primaryImg = images[activeImg] || images[0]
  const activeRegion = userRegion || 'IN'
  const { price, currency, isConverted } = getRegionalPrice(
    { ...product, regional_pricing: pricing },
    activeRegion,
    FALLBACK_RATES
  )

  const getConditionColor = (grade: string) => {
    if (!grade) return null
    const g = grade.toLowerCase()
    if (g.startsWith('grade a') || g === 'new')       return { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' }
    if (g.startsWith('grade b') || g === 'excellent') return { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' }
    return                                                    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' }
  }
  const condColor = getConditionColor(product.condition_grade)

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] mb-6">
        <Link href="/browse" className="text-gold hover:text-gold-light transition-colors">Browse</Link>
        <span className="text-[#DDD8CF]">›</span>
        {product.category && <>
          <span className="text-[#6B6B6B]">{product.category}</span>
          <span className="text-[#DDD8CF]">›</span>
        </>}
        <span className="text-navy font-medium truncate">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* ── LEFT: Images ─────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div className="bg-[#F5F2EC] rounded-2xl overflow-hidden aspect-[4/3] mb-3 relative">
            {primaryImg ? (
              <img src={primaryImg.url} alt={product.name}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 opacity-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                </svg>
              </div>
            )}
            {product.badge && (
              <span className="absolute top-3 left-3 text-[11px] font-bold bg-gold text-navy px-2.5 py-1 rounded-full uppercase">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImg === i ? 'border-navy' : 'border-[#DDD8CF] hover:border-navy/40'
                  }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video + Inspection CTAs */}
          {(product.video_url || product.inspection_available) && (
            <div className="flex gap-3 mt-4">
              {product.video_url && (
                <a href={product.video_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-navy text-white text-[13px] font-medium py-3 rounded-xl hover:bg-navy-light transition-colors">
                  <Video size={15} /> Watch Video Walkthrough
                </a>
              )}
              {product.inspection_available && (
                <button onClick={() => setInspectionOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 border-[1.5px] border-blue-300 text-blue-700 bg-blue-50 text-[13px] font-medium py-3 rounded-xl hover:bg-blue-100 transition-colors">
                  <Video size={15} /> Request Live Inspection
                </button>
              )}
            </div>
          )}

          {/* Vendor info card */}
          {vendor && (
            <div className="mt-5 bg-white border border-[#DDD8CF] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-navy text-[14px]">{vendor.company_name}</p>
                    {vendor.is_verified && (
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                        <CheckCircle size={8} /> VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5">Rental Vendor</p>
                </div>
                <Link href="/browse/vendors"
                  className="text-[12px] text-gold hover:text-gold-light transition-colors">
                  View on Maps →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-[12px] text-[#6B6B6B]">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 hover:text-navy transition-colors">
                    <Phone size={12} className="text-gold" /> {vendor.phone}
                  </a>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-navy transition-colors">
                    <ExternalLink size={12} className="text-gold" />
                    {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Details ───────────────────────────────── */}
        <div>
          {product.category && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold mb-2">{product.category}</p>
          )}
          <h1 className="font-display font-extrabold text-[28px] text-navy tracking-tight leading-tight mb-2">
            {product.name}
          </h1>
          {vendor && (
            <p className="text-[#6B6B6B] text-sm mb-4">by {vendor.company_name}</p>
          )}

          {product.description && (
            <p className="text-[#6B6B6B] text-[14px] leading-relaxed mb-5">{product.description}</p>
          )}

          {/* ── Verified Inventory Badges ── */}
          {(product.condition_grade || product.inventory_age || product.last_service_date || product.inspection_available) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {product.condition_grade && condColor && (
                <span className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border ${condColor.bg} ${condColor.text} ${condColor.border}`}>
                  <CheckCircle size={12} /> {product.condition_grade}
                </span>
              )}
              {product.inventory_age && (
                <span className="flex items-center gap-1.5 text-[12px] bg-[#F5F2EC] border border-[#DDD8CF] text-[#6B6B6B] px-3 py-1.5 rounded-full">
                  <Clock size={12} className="text-gold" /> {product.inventory_age}
                </span>
              )}
              {product.last_service_date && (
                <span className="flex items-center gap-1.5 text-[12px] bg-[#F5F2EC] border border-[#DDD8CF] text-[#6B6B6B] px-3 py-1.5 rounded-full">
                  <Calendar size={12} className="text-gold" />
                  Serviced {new Date(product.last_service_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              )}
              {product.inspection_available && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full">
                  <Video size={12} /> Live Inspection Available
                </span>
              )}
            </div>
          )}

          {/* ── Pricing ── */}
          <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl p-5 mb-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display font-extrabold text-3xl text-navy">
                {formatPrice(price, currency)}
              </span>
              <span className="text-[#6B6B6B] text-sm">/ day</span>
              {isConverted && (
                <span className="text-[11px] text-[#6B6B6B] bg-white border border-[#DDD8CF] px-2 py-0.5 rounded-full">
                  est. {currency}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#6B6B6B] mb-3">
              Min {product.min_rental_days} day{product.min_rental_days !== 1 ? 's' : ''} · Max {product.max_rental_days} days
            </p>

            {/* Serves regions */}
            {(product.serves_regions?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(product.serves_regions as string[]).map(r => (
                  <span key={r} className="flex items-center gap-1 text-[11px] bg-white border border-[#DDD8CF] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                    {REGION_FLAGS[r]} {REGION_LABELS[r]}
                  </span>
                ))}
              </div>
            )}

            {/* Regional pricing toggle */}
            {pricing.length > 0 && (
              <div>
                <button onClick={() => setPricingOpen(v => !v)}
                  className="flex items-center gap-1.5 text-[12.5px] text-gold hover:text-gold-light transition-colors">
                  <Globe size={13} /> Regional Pricing
                  {pricingOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {pricingOpen && (
                  <div className="mt-3 space-y-2 border-t border-[#DDD8CF] pt-3">
                    {pricing.map(rp => (
                      <div key={rp.region} className="flex items-center justify-between text-[13px]">
                        <span className="text-[#6B6B6B] flex items-center gap-1.5">
                          {REGION_FLAGS[rp.region]} {REGION_LABELS[rp.region]}
                          {rp.is_manual && (
                            <span className="text-[9px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-semibold">Custom</span>
                          )}
                        </span>
                        <span className="font-semibold text-navy">{formatPrice(rp.price, rp.currency)}/day</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Stock status ── */}
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border ${
              product.available_stock === 0
                ? 'bg-red-50 text-red-700 border-red-200'
                : product.available_stock <= 2
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {product.available_stock === 0
                ? '✗ Out of stock'
                : product.available_stock <= 2
                  ? `⚠ Only ${product.available_stock} left`
                  : `✓ ${product.available_stock} units available`}
            </span>
            {(product.dimensions || product.weight_kg) && (
              <span className="text-[12.5px] text-[#6B6B6B]">
                {product.dimensions && `📐 ${product.dimensions}`}
                {product.dimensions && product.weight_kg && ' · '}
                {product.weight_kg && `⚖️ ${product.weight_kg}kg`}
              </span>
            )}
          </div>

          {/* ── Add to Project ── */}
          <div className="relative mb-6">
            {projects.length > 0 ? (
              <button
                onClick={() => setProjectPicker(v => !v)}
                disabled={addingTo || product.available_stock === 0}
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-gold text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60 text-base">
                <Plus size={18} />
                {addingTo ? 'Adding…' : 'Add to Project'}
              </button>
            ) : (
              <Link href="/projects/new"
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white font-bold py-4 rounded-xl transition-colors text-base">
                <FolderOpen size={18} /> Create a Project First
              </Link>
            )}

            {/* Project picker dropdown */}
            {projectPicker && projects.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProjectPicker(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 z-40">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] px-3 py-2">
                    Add to which project?
                  </p>
                  {projects.map(proj => (
                    <button key={proj.id} onClick={() => addToProject(proj.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-[#F9F6F0] transition-colors">
                      <FolderOpen size={14} className="text-gold flex-shrink-0" />
                      <div>
                        <p className="text-[13.5px] font-medium text-navy">{proj.name}</p>
                        <p className="text-[11px] text-[#6B6B6B] capitalize">{proj.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── SLA Commitments ── */}
          {sla && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">
                Service Level Commitments
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Truck,       color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100', label: 'Delivery',    value: `${sla.delivery_hours}h before event` },
                  { icon: RefreshCw,   color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Pickup',    value: `within ${sla.pickup_hours}h after` },
                  { icon: Headphones,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100', label: 'Support',   value: `${formatHours(sla.support_response_hours)} response` },
                  { icon: RefreshCw,   color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100', label: 'Replacement', value: `within ${sla.replacement_hours}h` },
                ].map(s => (
                  <div key={s.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                    <s.icon size={14} className={s.color + ' flex-shrink-0'} />
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${s.color}`}>{s.label}</p>
                      <p className="text-[12px] font-medium text-navy">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {sla.onsite_support_available && (
                <div className="mt-2 flex items-center gap-2.5 p-3 rounded-xl border bg-gold/8 border-gold/20">
                  <Shield size={14} className="text-gold flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-gold">On-site Support Available</p>
                    {sla.onsite_support_note && (
                      <p className="text-[12px] text-[#6B6B6B] mt-0.5">{sla.onsite_support_note}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Operational Metrics ── */}
          {metrics && metrics.total_orders > 0 && (
            <div className="mb-5 bg-white border border-[#DDD8CF] rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">
                Vendor Performance
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'On-time Delivery', value: `${metrics.on_time_delivery_pct}%`,  good: metrics.on_time_delivery_pct >= 90 },
                  { label: 'On-time Pickup',   value: `${metrics.on_time_pickup_pct}%`,    good: metrics.on_time_pickup_pct >= 90 },
                  { label: 'Avg Response',     value: metrics.avg_response_hours > 0 ? `${metrics.avg_response_hours}h` : '—', good: metrics.avg_response_hours <= 2 },
                  { label: 'Total Orders',     value: metrics.total_orders,                good: true },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#6B6B6B]">{m.label}</span>
                    <span className={`text-[13px] font-bold ${m.good ? 'text-green-700' : 'text-amber-600'}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Previously Used At ── */}
          {eventHist.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">
                Previously Used At
              </p>
              <div className="space-y-2">
                {eventHist.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg px-3.5 py-2.5">
                    <Star size={12} className="text-gold flex-shrink-0" />
                    <span className="text-[13px] font-medium text-navy">{e.event_name}</span>
                    {e.year && <span className="text-[12px] text-[#6B6B6B]">{e.year}</span>}
                    {(e.venue || e.city) && (
                      <span className="flex items-center gap-1 text-[12px] text-[#6B6B6B] ml-auto">
                        <MapPin size={10} className="text-gold" />
                        {e.venue || e.city}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(product.tags as string[]).map(tag => (
                <span key={tag} className="text-[11.5px] bg-[#F5F2EC] border border-[#DDD8CF] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Inspection Modal ── */}
      {inspectionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-[480px] w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-navy text-lg">Request Live Video Inspection</h3>
              <button onClick={() => setInspectionOpen(false)} className="text-[#6B6B6B] hover:text-navy p-1">
                <X size={20} />
              </button>
            </div>
            <p className="text-[#6B6B6B] text-[13.5px] leading-relaxed mb-6">
              The vendor will schedule a live video call so you can inspect the actual item before booking. Choose your preferred method:
            </p>
            <div className="space-y-3">
              {[
                { label: 'WhatsApp Video Call',  icon: '📱', desc: 'Quick call — vendor will share a WhatsApp link',    disabled: false },
                { label: 'Google Meet',           icon: '🎥', desc: 'Scheduled meeting — receive a Meet link by email',  disabled: false },
                { label: 'Platform Video Call',   icon: '💻', desc: 'Coming soon — in-platform video calling',           disabled: true  },
              ].map(opt => (
                <button key={opt.label} disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      toast.success(`Inspection request sent! Vendor will contact you for a ${opt.label}.`)
                      setInspectionOpen(false)
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] text-left transition-all ${
                    opt.disabled
                      ? 'border-[#DDD8CF] bg-[#F9F6F0] opacity-50 cursor-not-allowed'
                      : 'border-[#DDD8CF] hover:border-navy hover:bg-[#F9F6F0] cursor-pointer'
                  }`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-navy">{opt.label}</p>
                    <p className="text-[12px] text-[#6B6B6B]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-[#6B6B6B] text-center mt-4">
              The vendor will be notified of your inspection request within minutes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
