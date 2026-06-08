'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, Clock, Calendar, Video,
  Truck, RefreshCw, Headphones, Shield, Star,
  Globe, ChevronDown, ChevronUp, Plus, FolderOpen,
  MapPin, Phone, ExternalLink, X, Heart,
  Package, Zap, TrendingUp, Info, MessageSquare
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
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])
  const { region: userRegion } = useRegion()

  const [product,        setProduct]        = useState<any>(null)
  const [images,         setImages]         = useState<any[]>([])
  const [pricing,        setPricing]        = useState<any[]>([])
  const [sla,            setSla]            = useState<any>(null)
  const [eventHist,      setEventHist]      = useState<any[]>([])
  const [metrics,        setMetrics]        = useState<any>(null)
  const [badges,         setBadges]         = useState<any[]>([])
  const [projects,       setProjects]       = useState<any[]>([])
  const [activeImg,      setActiveImg]      = useState(0)
  const [pricingOpen,    setPricingOpen]    = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [addingTo,       setAddingTo]       = useState(false)
  const [projectPicker,  setProjectPicker]  = useState(false)
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [quoteOpen,      setQuoteOpen]      = useState(false)
  const [quoteMsg,       setQuoteMsg]       = useState('')
  const [quoteSending,   setQuoteSending]   = useState(false)
  const [savedToWishlist,setSavedToWishlist]= useState(false)
  const [tab,            setTab]            = useState<'overview'|'specs'|'vendor'>('overview')

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
          .select('*, vendor_profiles(id, company_name, phone, website, is_verified, regions, description, onboarding_done)')
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

      if (vp?.id) {
        const [{ data: slaData }, { data: metricsData }, { data: badgeData }] = await Promise.all([
          db.from('vendor_slas').select('*').eq('vendor_id', vp.id).single(),
          db.from('vendor_metrics').select('*').eq('vendor_id', vp.id).single(),
          db.from('product_badges')
            .select('*, badges(*)')
            .eq('vendor_product_id', params.id),
        ])
        setSla(slaData)
        setMetrics(metricsData)
        setBadges((badgeData || []).map((b: any) => Array.isArray(b.badges) ? b.badges[0] : b.badges).filter(Boolean))
      }

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
    const { data: { user } } = await db.auth.getUser()
    if (!user) { toast.error('Please sign in to add to a project'); return }
    setAddingTo(true)
    setProjectPicker(false)
    const vendor = product.vendor_profiles
    const { data: existing } = await db.from('project_items')
      .select('id, quantity, unit_price')
      .eq('project_id', projectId).eq('vendor_product_id', params.id).single()

    if (existing) {
      const newQty = existing.quantity + 1
      await db.from('project_items').update({ quantity: newQty, total_price: existing.unit_price * newQty }).eq('id', existing.id)
      toast.success('Quantity updated in project')
    } else {
      await db.from('project_items').insert({
        project_id: projectId, vendor_product_id: params.id,
        vendor_id: vendor?.id || product.vendor_id,
        quantity: 1, days: 1,
        unit_price: product.price_per_day,
        total_price: product.price_per_day,
      })
      toast.success('Added to project!')
    }
    setAddingTo(false)
  }

  const sendQuote = async () => {
    if (!quoteMsg.trim()) { toast.error('Please enter a message'); return }
    const { data: { user } } = await db.auth.getUser()
    if (!user) { toast.error('Please sign in to request a quote'); return }
    setQuoteSending(true)
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_product_id: params.id,
        message: quoteMsg,
      }),
    })
    const { error } = await res.json()
    if (error) { toast.error(error); setQuoteSending(false); return }
    toast.success('Quote request sent! Check My Quotes to track the response.')
    setQuoteOpen(false)
    setQuoteMsg('')
    setQuoteSending(false)
  }

  if (loading) return (
    <div className="p-16 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!product) return <div className="p-8 text-[#6B6B6B]">Product not found.</div>

  const vendor      = product.vendor_profiles
  const primaryImg  = images[activeImg] || images[0]
  const activeRegion= userRegion || 'IN'
  const { price, currency, isConverted } = getRegionalPrice(
    { ...product, regional_pricing: pricing }, activeRegion, FALLBACK_RATES
  )

  const getConditionColor = (grade: string) => {
    if (!grade) return null
    const g = grade.toLowerCase()
    if (g.startsWith('grade a') || g === 'new')       return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
    if (g.startsWith('grade b') || g === 'excellent') return { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' }
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
  }
  const condColor = getConditionColor(product.condition_grade)

  const BADGE_COLORS: Record<string, string> = {
    gold:   'bg-amber-100 text-amber-800 border-amber-300',
    blue:   'bg-blue-100 text-blue-800 border-blue-300',
    green:  'bg-green-100 text-green-800 border-green-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    red:    'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] mb-6 flex-wrap">
        <Link href="/browse" className="text-gold hover:text-gold-light transition-colors">Browse</Link>
        <span className="text-[#DDD8CF]">›</span>
        {product.category && (
          <>
            <Link href={`/browse?category=${encodeURIComponent(product.category)}`}
              className="text-[#6B6B6B] hover:text-navy transition-colors">{product.category}</Link>
            <span className="text-[#DDD8CF]">›</span>
          </>
        )}
        <span className="text-navy font-medium truncate max-w-[260px]">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-10">
        {/* ── LEFT: Images + tabs ─────────────────────── */}
        <div>
          {/* Main image */}
          <div className="bg-[#F5F2EC] rounded-2xl overflow-hidden aspect-[16/10] relative mb-3">
            {primaryImg
              ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Package size={56} className="text-[#DDD8CF]" />
                </div>
            }
            {/* Admin badges on image */}
            {badges.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {badges.map((b: any) => (
                  <span key={b.id} className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${BADGE_COLORS[b.color] || BADGE_COLORS.gold}`}>
                    {b.icon && <span className="mr-1">{b.icon}</span>}{b.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mb-6">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImg === i ? 'border-navy' : 'border-[#DDD8CF] hover:border-navy/40'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video + Inspection */}
          {(product.video_url || product.inspection_available) && (
            <div className="flex gap-3 mb-6">
              {product.video_url && (
                <a href={product.video_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-navy text-white text-[13px] font-medium py-3 rounded-xl hover:bg-navy-light transition-colors">
                  <Video size={15} /> Watch Walkthrough
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

          {/* Tabs */}
          <div className="flex gap-1 bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl p-1 mb-5">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'specs',    label: 'Specifications' },
              { id: 'vendor',   label: 'Vendor Info' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${tab === t.id ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <div>
              {product.description && (
                <p className="text-[#6B6B6B] text-[14px] leading-relaxed mb-5">{product.description}</p>
              )}

              {/* SLA commitments */}
              {sla && (
                <div className="mb-5">
                  <h3 className="font-display font-bold text-navy text-sm mb-3">Service Commitments</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Truck,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100', label: 'Delivery',    value: `${sla.delivery_hours}h before event` },
                      { icon: RefreshCw,  color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Pickup',    value: `within ${sla.pickup_hours}h after` },
                      { icon: Headphones, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100', label: 'Support',   value: `${formatHours(sla.support_response_hours)} response` },
                      { icon: RefreshCw,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100', label: 'Replacement', value: `within ${sla.replacement_hours}h` },
                    ].map(s => (
                      <div key={s.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                        <s.icon size={14} className={s.color + ' flex-shrink-0'} />
                        <div>
                          <p className={`text-[10px] font-semibold uppercase ${s.color}`}>{s.label}</p>
                          <p className="text-[12px] font-medium text-navy">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {sla.onsite_support_available && (
                    <div className="mt-2 flex items-center gap-2.5 p-3 rounded-xl border bg-gold/8 border-gold/20">
                      <Shield size={14} className="text-gold flex-shrink-0" />
                      <p className="text-[12px] font-semibold text-gold">On-site Support Available
                        {sla.onsite_support_note && <span className="font-normal text-[#6B6B6B] ml-1">— {sla.onsite_support_note}</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Previously Used At */}
              {eventHist.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-display font-bold text-navy text-sm mb-3">Previously Used At</h3>
                  <div className="space-y-2">
                    {eventHist.map((e, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-[#F9F6F0] border border-[#DDD8CF] rounded-lg px-3.5 py-2.5">
                        <Star size={12} className="text-gold flex-shrink-0" />
                        <span className="text-[13px] font-medium text-navy">{e.event_name}</span>
                        {e.year && <span className="text-[12px] text-[#6B6B6B]">{e.year}</span>}
                        {(e.venue || e.city) && (
                          <span className="flex items-center gap-1 text-[12px] text-[#6B6B6B] ml-auto">
                            <MapPin size={10} className="text-gold" />{e.venue || e.city}
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
          )}

          {tab === 'specs' && (
            <div className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Category',         value: product.category },
                    { label: 'Dimensions',        value: product.dimensions },
                    { label: 'Weight',            value: product.weight_kg ? `${product.weight_kg} kg` : null },
                    { label: 'Condition',         value: product.condition_grade },
                    { label: 'Inventory Age',     value: product.inventory_age },
                    { label: 'Last Serviced',     value: product.last_service_date ? new Date(product.last_service_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null },
                    { label: 'Min Rental',        value: `${product.min_rental_days} day${product.min_rental_days !== 1 ? 's' : ''}` },
                    { label: 'Max Rental',        value: `${product.max_rental_days} days` },
                    { label: 'Units Available',   value: `${product.available_stock} of ${product.total_stock}` },
                    { label: 'Regions Served',    value: (product.serves_regions || []).map((r: string) => `${REGION_FLAGS[r]} ${REGION_LABELS[r]}`).join(' · ') || null },
                  ].filter(r => r.value).map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-[#F9F6F0]' : 'bg-white'}>
                      <td className="px-5 py-3 font-semibold text-navy text-[13px] w-40">{row.label}</td>
                      <td className="px-5 py-3 text-[#6B6B6B] text-[13px]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'vendor' && vendor && (
            <div className="space-y-4">
              <div className="bg-white border border-[#DDD8CF] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {vendor.company_name?.[0]?.toUpperCase() || 'V'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-navy">{vendor.company_name}</p>
                      {vendor.is_verified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                          <CheckCircle size={9} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-[#6B6B6B] mt-0.5">Exhibition Rental Vendor</p>
                  </div>
                </div>
                {vendor.description && (
                  <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-4">{vendor.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy transition-colors">
                      <Phone size={13} className="text-gold" /> {vendor.phone}
                    </a>
                  )}
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy transition-colors truncate">
                      <ExternalLink size={13} className="text-gold" />
                      {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Operational metrics */}
              {metrics && metrics.total_orders > 0 && (
                <div className="bg-white border border-[#DDD8CF] rounded-xl p-5">
                  <h3 className="font-display font-bold text-navy text-sm mb-4">Vendor Performance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'On-time Delivery', value: `${metrics.on_time_delivery_pct}%`,  good: metrics.on_time_delivery_pct >= 90 },
                      { label: 'On-time Pickup',   value: `${metrics.on_time_pickup_pct}%`,    good: metrics.on_time_pickup_pct >= 90 },
                      { label: 'Avg Response',     value: metrics.avg_response_hours > 0 ? `${metrics.avg_response_hours}h` : '—', good: metrics.avg_response_hours <= 2 },
                      { label: 'Total Orders',     value: metrics.total_orders,                good: true },
                    ].map(m => (
                      <div key={m.label} className="flex items-center justify-between bg-[#F9F6F0] rounded-lg px-3 py-2">
                        <span className="text-[12px] text-[#6B6B6B]">{m.label}</span>
                        <span className={`text-[13px] font-bold ${m.good ? 'text-green-700' : 'text-amber-600'}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Pricing + Actions ─────────────────── */}
        <div className="space-y-4">
          {/* Category badge */}
          {product.category && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">{product.category}</p>
          )}

          {/* Name */}
          <h1 className="font-display font-extrabold text-[26px] text-navy tracking-tight leading-tight">
            {product.name}
          </h1>

          {/* Vendor */}
          {vendor && (
            <p className="text-[#6B6B6B] text-sm">
              by <span className="font-medium text-navy">{vendor.company_name}</span>
              {vendor.is_verified && <span className="ml-1.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
            </p>
          )}

          {/* Admin badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b: any) => (
                <span key={b.id} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${BADGE_COLORS[b.color] || BADGE_COLORS.gold}`}>
                  {b.icon && <span className="mr-1">{b.icon}</span>}{b.name}
                </span>
              ))}
            </div>
          )}

          {/* Verified inventory badges */}
          {(product.condition_grade || product.inventory_age || product.inspection_available) && (
            <div className="flex flex-wrap gap-1.5">
              {product.condition_grade && condColor && (
                <span className={`flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${condColor.bg} ${condColor.text} ${condColor.border}`}>
                  <CheckCircle size={11} /> {product.condition_grade}
                </span>
              )}
              {product.inventory_age && (
                <span className="flex items-center gap-1 text-[11.5px] bg-[#F5F2EC] border border-[#DDD8CF] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                  <Clock size={11} className="text-gold" /> {product.inventory_age}
                </span>
              )}
              {product.last_service_date && (
                <span className="flex items-center gap-1 text-[11.5px] bg-[#F5F2EC] border border-[#DDD8CF] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                  <Calendar size={11} className="text-gold" />
                  Serviced {new Date(product.last_service_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              )}
              {product.inspection_available && (
                <span className="flex items-center gap-1 text-[11.5px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full">
                  <Video size={11} /> Live Inspection
                </span>
              )}
            </div>
          )}

          {/* Pricing card */}
          <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl p-5">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display font-extrabold text-3xl text-navy">
                {formatPrice(price, currency)}
              </span>
              <span className="text-[#6B6B6B] text-sm">/ day</span>
              {isConverted && (
                <span className="text-[10px] text-[#6B6B6B] bg-white border border-[#DDD8CF] px-2 py-0.5 rounded-full">est.</span>
              )}
            </div>
            <p className="text-[12px] text-[#6B6B6B] mb-3">
              Min {product.min_rental_days} day · Max {product.max_rental_days} days
            </p>
            {(product.serves_regions?.length > 0) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(product.serves_regions as string[]).map(r => (
                  <span key={r} className="flex items-center gap-1 text-[11px] bg-white border border-[#DDD8CF] text-[#6B6B6B] px-2 py-0.5 rounded-full">
                    {REGION_FLAGS[r]} {REGION_LABELS[r]}
                  </span>
                ))}
              </div>
            )}
            {pricing.length > 0 && (
              <div>
                <button onClick={() => setPricingOpen(v => !v)}
                  className="flex items-center gap-1.5 text-[12.5px] text-gold hover:text-gold-light transition-colors">
                  <Globe size={12} /> Regional Pricing {pricingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {pricingOpen && (
                  <div className="mt-2 space-y-1.5 border-t border-[#DDD8CF] pt-2.5">
                    {pricing.map(rp => (
                      <div key={rp.region} className="flex justify-between text-[12.5px]">
                        <span className="text-[#6B6B6B]">{REGION_FLAGS[rp.region]} {REGION_LABELS[rp.region]}</span>
                        <span className="font-semibold text-navy">{formatPrice(rp.price, rp.currency)}/day</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border ${
              product.available_stock === 0 ? 'bg-red-50 text-red-700 border-red-200'
              : product.available_stock <= 2 ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {product.available_stock === 0 ? '✗ Out of stock'
               : product.available_stock <= 2 ? `⚠ Only ${product.available_stock} left`
               : `✓ ${product.available_stock} units available`}
            </span>
            {(product.dimensions || product.weight_kg) && (
              <span className="text-[12px] text-[#6B6B6B]">
                {product.dimensions && `📐 ${product.dimensions}`}
              </span>
            )}
          </div>

          {/* Primary CTA — Add to Project */}
          <div className="relative">
            {projects.length > 0 ? (
              <button onClick={() => setProjectPicker(v => !v)} disabled={addingTo || product.available_stock === 0}
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-gold text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60 text-base">
                <Plus size={18} /> {addingTo ? 'Adding…' : 'Add to Project'}
              </button>
            ) : (
              <Link href="/login?redirectTo=/browse"
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white font-bold py-4 rounded-xl transition-colors text-base">
                <FolderOpen size={18} /> Sign In to Add to Project
              </Link>
            )}
            {projectPicker && projects.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProjectPicker(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#DDD8CF] rounded-xl shadow-xl p-2 z-40">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] px-3 py-2">Add to which project?</p>
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

          {/* Secondary CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setQuoteOpen(true)}
              className="flex items-center justify-center gap-2 border-[1.5px] border-navy text-navy font-medium py-3 rounded-xl hover:bg-navy/5 transition-colors text-[13px]">
              <MessageSquare size={14} /> Request Quote
            </button>
            <button onClick={() => { setSavedToWishlist(v => !v); toast.success(savedToWishlist ? 'Removed from wishlist' : 'Saved to wishlist') }}
              className={`flex items-center justify-center gap-2 border-[1.5px] font-medium py-3 rounded-xl transition-colors text-[13px] ${
                savedToWishlist ? 'border-red-300 text-red-600 bg-red-50' : 'border-[#DDD8CF] text-[#6B6B6B] hover:border-navy hover:text-navy'
              }`}>
              <Heart size={14} className={savedToWishlist ? 'fill-red-500 text-red-500' : ''} />
              {savedToWishlist ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Commercial info */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-4 space-y-2.5 text-[12.5px]">
            <h3 className="font-display font-bold text-navy text-sm mb-3">Commercial Details</h3>
            {[
              { label: 'Base Price',          value: `${formatPrice(price, currency)} / day` },
              { label: 'Security Deposit',    value: 'Discussed with vendor' },
              { label: 'Delivery Charges',    value: sla ? `Included (${sla.delivery_hours}h before event)` : 'Discuss with vendor' },
              { label: 'Setup / Installation', value: 'Confirm with vendor' },
              { label: 'Minimum Rental',      value: `${product.min_rental_days} day${product.min_rental_days !== 1 ? 's' : ''}` },
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-3">
                <span className="text-[#6B6B6B]">{row.label}</span>
                <span className="font-medium text-navy text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-700 mb-2.5">BoothMarket Guarantees</p>
            <div className="space-y-1.5 text-[12.5px] text-green-800">
              {[
                '✓ Verified vendor identity',
                '✓ SLA-backed delivery & pickup',
                '✓ Replacement guarantee',
                '✓ Secure payment processing',
              ].map(g => <p key={g}>{g}</p>)}
            </div>
          </div>

          {/* Find more from vendor */}
          <Link href={`/browse?vendor=${vendor?.id}`}
            className="flex items-center justify-center gap-2 text-[13px] text-gold hover:text-gold-light border border-gold/30 py-2.5 rounded-xl hover:bg-gold/5 transition-colors">
            View more from {vendor?.company_name} →
          </Link>
        </div>
      </div>

      {/* ── Quote modal ── */}
      {quoteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 max-w-[500px] w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-navy text-lg">Request a Quote</h3>
              <button onClick={() => setQuoteOpen(false)} className="text-[#6B6B6B] hover:text-navy p-1"><X size={20} /></button>
            </div>
            <p className="text-[#6B6B6B] text-[13px] mb-1 font-medium">{product.name}</p>
            <p className="text-[#6B6B6B] text-[12.5px] leading-relaxed mb-4">
              Tell the vendor your requirements — event dates, quantity, venue, any special requests.
            </p>
            <textarea value={quoteMsg} onChange={e => setQuoteMsg(e.target.value)} rows={5}
              className="w-full border-[1.5px] border-[#DDD8CF] rounded-xl px-4 py-3 text-sm outline-none focus:border-navy resize-none mb-4"
              placeholder={`e.g. I need 3 units for Hannover Messe, 22–26 April 2026. Venue: Hall 12, Stand B45. Please confirm availability and all-in pricing including delivery to Frankfurt.`} />
            <div className="flex gap-3">
              <button onClick={() => setQuoteOpen(false)} className="flex-1 border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium py-3 rounded-xl hover:border-navy transition-colors">Cancel</button>
              <button onClick={sendQuote} disabled={quoteSending || !quoteMsg.trim()}
                className="flex-1 bg-navy text-white font-bold py-3 rounded-xl hover:bg-navy-light transition-colors disabled:opacity-60">
                {quoteSending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inspection modal ── */}
      {inspectionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 max-w-[460px] w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-navy text-lg">Request Live Video Inspection</h3>
              <button onClick={() => setInspectionOpen(false)} className="text-[#6B6B6B] hover:text-navy p-1"><X size={20} /></button>
            </div>
            <p className="text-[#6B6B6B] text-[13.5px] leading-relaxed mb-5">
              The vendor will schedule a live video call so you can inspect the actual item before booking.
            </p>
            <div className="space-y-3">
              {[
                { label: 'WhatsApp Video Call', icon: '📱', desc: 'Vendor shares a WhatsApp link',    disabled: false },
                { label: 'Google Meet',          icon: '🎥', desc: 'Receive a Google Meet link',       disabled: false },
                { label: 'Platform Video Call',  icon: '💻', desc: 'In-platform video (coming soon)',  disabled: true },
              ].map(opt => (
                <button key={opt.label} disabled={opt.disabled}
                  onClick={() => { if (!opt.disabled) { toast.success(`Inspection request sent! Vendor will contact you for a ${opt.label}.`); setInspectionOpen(false) }}}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] text-left transition-all ${opt.disabled ? 'border-[#DDD8CF] bg-[#F9F6F0] opacity-50 cursor-not-allowed' : 'border-[#DDD8CF] hover:border-navy cursor-pointer'}`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-navy">{opt.label}</p>
                    <p className="text-[12px] text-[#6B6B6B]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
