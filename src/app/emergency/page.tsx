'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Region } from '@/types/database'

const CATEGORIES = [
  'Booth Structures','Lounge Furniture','Tables & Chairs',
  'Reception Counters','Flooring','Lighting','A/V & Electronics',
  'Signage & Graphics','Storage & Shelving','Outdoor Equipment',
]
const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: '🇮🇳 India' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 UK' },
]

export default function EmergencyPage() {
  const db = useMemo(() => createClient() as any, [])
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    quantity: '1', required_date: '', venue: '',
    city: '', region: 'IN' as Region, budget: '', currency: 'INR',
  })
  const [submitting, setSubmitting]   = useState(false)
  const [submitted,  setSubmitted]    = useState(false)
  const [myRequests, setMyRequests]   = useState<any[]>([])
  const [responses,  setResponses]    = useState<Record<string, any[]>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: reqs } = await db.from('emergency_requests')
        .select('*').eq('consultant_id', user.id)
        .order('created_at', { ascending: false })
      setMyRequests(reqs || [])

      // Load responses for each request
      if (reqs?.length) {
        const { data: resp } = await db.from('emergency_responses')
          .select('*, vendor_profiles(company_name, phone)')
          .in('emergency_request_id', reqs.map((r: any) => r.id))
          .eq('can_fulfill', true)

        const map: Record<string, any[]> = {}
        for (const r of (resp || [])) {
          const rr = { ...r, vendor_profiles: Array.isArray(r.vendor_profiles) ? r.vendor_profiles[0] : r.vendor_profiles }
          if (!map[r.emergency_request_id]) map[r.emergency_request_id] = []
          map[r.emergency_request_id].push(rr)
        }
        setResponses(map)
      }
    }
    load()
  }, [db, submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.required_date) {
      toast.error('Title and required date are mandatory')
      return
    }
    setSubmitting(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const { error } = await db.from('emergency_requests').insert({
      consultant_id: user.id,
      title:         form.title,
      description:   form.description   || null,
      category:      form.category      || null,
      quantity:      parseInt(form.quantity) || 1,
      required_date: form.required_date,
      venue:         form.venue         || null,
      city:          form.city          || null,
      region:        form.region,
      budget:        form.budget ? parseFloat(form.budget) : null,
      currency:      form.currency,
    })

    if (error) { toast.error(error.message); setSubmitting(false); return }
    toast.success('Emergency request broadcast to all vendors!')
    setSubmitted(true)
    setSubmitting(false)
    setForm({ title: '', description: '', category: '', quantity: '1', required_date: '', venue: '', city: '', region: 'IN', budget: '', currency: 'INR' })
  }

  const inputCls  = 'w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors bg-white'
  const labelCls  = 'block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hrs = Math.floor(diff / 3600000)
    const min = Math.floor((diff % 3600000) / 60000)
    return hrs > 0 ? `${hrs}h ${min}m left` : `${min}m left`
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-red-600" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Emergency Request</h1>
          <p className="text-[#6B6B6B] text-sm">Urgent requirements broadcast to all vendors — expires in 24 hours</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <Zap size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700 leading-relaxed">
                This request will be broadcast to all vendors in your selected region. Vendors who can fulfil will respond within minutes.
              </p>
            </div>

            <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 space-y-4">
              <h2 className="font-display font-bold text-navy">What do you need?</h2>
              <div>
                <label className={labelCls}>Request Title *</label>
                <input className={inputCls} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 10 LED spotlights needed urgently for Hall 5" required />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls + ' resize-none min-h-[80px]'} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Specifications, preferred brands, special requirements…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls + ' cursor-pointer'} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">— Select —</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quantity Needed</label>
                  <input type="number" min="1" className={inputCls} value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Required By *</label>
                <input type="date" className={inputCls} value={form.required_date}
                  onChange={e => setForm(f => ({ ...f, required_date: e.target.value }))} required />
              </div>
            </div>

            <div className="bg-white border border-[#DDD8CF] rounded-xl p-6 space-y-4">
              <h2 className="font-display font-bold text-navy">Location &amp; Budget</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Venue</label>
                  <input className={inputCls} value={form.venue}
                    onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                    placeholder="e.g. Pragati Maidan" />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. New Delhi" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Region</label>
                <div className="flex gap-3">
                  {REGIONS.map(r => (
                    <button key={r.id} type="button"
                      onClick={() => setForm(f => ({ ...f, region: r.id }))}
                      className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                        form.region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'
                      }`}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Max Budget</label>
                  <input type="number" min="0" step="0.01" className={inputCls} value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="Optional" />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select className={inputCls + ' cursor-pointer'} value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="INR">₹ INR</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-base">
              <Zap size={18} />
              {submitting ? 'Broadcasting…' : 'Broadcast Emergency Request'}
            </button>
          </form>
        </div>

        {/* My requests */}
        <div>
          <h2 className="font-display font-bold text-navy mb-4">My Emergency Requests</h2>
          {myRequests.length === 0 ? (
            <div className="bg-white border border-[#DDD8CF] rounded-xl p-10 text-center">
              <Zap size={28} className="mx-auto mb-3 text-[#DDD8CF]" />
              <p className="text-[#6B6B6B] text-sm">No emergency requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map(req => {
                const resps   = responses[req.id] || []
                const expired = new Date(req.expires_at) < new Date()
                return (
                  <div key={req.id} className={`bg-white border rounded-xl p-5 ${req.status === 'open' && !expired ? 'border-red-200' : 'border-[#DDD8CF]'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-navy text-sm">{req.title}</h3>
                        <p className="text-[11.5px] text-[#6B6B6B] mt-0.5">
                          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        req.status === 'open' && !expired
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : req.status === 'fulfilled'
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {expired ? 'Expired' : req.status}
                      </span>
                    </div>

                    {req.status === 'open' && !expired && (
                      <div className="flex items-center gap-1.5 text-[11.5px] text-red-500 mb-3">
                        <Clock size={11} />
                        {timeLeft(req.expires_at)}
                      </div>
                    )}

                    {resps.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-[#F0ECE4]">
                        <p className="text-[11.5px] font-semibold text-green-700 mb-2">
                          <CheckCircle size={12} className="inline mr-1" />
                          {resps.length} vendor{resps.length !== 1 ? 's' : ''} can fulfil
                        </p>
                        {resps.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between text-[12px] bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-1.5">
                            <span className="font-medium text-green-800">{r.vendor_profiles?.company_name}</span>
                            <div className="flex items-center gap-2">
                              {r.quoted_price && <span className="text-green-700">₹{r.quoted_price.toLocaleString()}</span>}
                              {r.vendor_profiles?.phone && <a href={`tel:${r.vendor_profiles.phone}`} className="text-green-700 hover:underline">📞 Call</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : req.status === 'open' && !expired ? (
                      <p className="text-[12px] text-[#6B6B6B]">Waiting for vendor responses…</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
