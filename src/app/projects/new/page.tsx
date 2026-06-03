'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'

type Venue = { id: string; name: string; city: string; country: string; region: Region }

const REGION_CURRENCIES: Record<Region, string> = {
  IN: 'INR', EU: 'EUR', UK: 'GBP',
}
const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'IN', label: 'India',          flag: '🇮🇳' },
  { id: 'EU', label: 'Europe (EU)',     flag: '🇪🇺' },
  { id: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
]
const CURRENCIES = [
  { id: 'INR', label: '₹ INR — Indian Rupee' },
  { id: 'EUR', label: '€ EUR — Euro' },
  { id: 'GBP', label: '£ GBP — British Pound' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [saving, setSaving] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [form, setForm] = useState({
    name:        '',
    description: '',
    event_name:  '',
    venue:       '',
    city:        '',
    region:      '' as Region | '',
    start_date:  '',
    end_date:    '',
    budget:      '',
    currency:    '',
  })

  // Load venues when region changes
  useEffect(() => {
    if (!form.region) { setVenues([]); return }
    fetch(`/api/venues?region=${form.region}`)
      .then(r => r.json())
      .then(({ data }) => setVenues(data || []))
  }, [form.region])

  const setRegion = (r: Region) => {
    setForm(f => ({
      ...f,
      region:   r,
      currency: REGION_CURRENCIES[r],  // auto-set currency
      venue:    '',                      // reset venue
      city:     '',
    }))
  }

  const setVenue = (venueName: string) => {
    const found = venues.find(v => v.name === venueName)
    setForm(f => ({
      ...f,
      venue: venueName,
      city:  found?.city || f.city,
    }))
  }

  // Calculate rental days
  const rentalDays = form.start_date && form.end_date
    ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
    : null

  const inputCls = 'w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors bg-white'
  const labelCls = 'block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Project name required'); return }
    if (!form.region) { toast.error('Please select a region'); return }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      toast.error('End date cannot be before start date'); return
    }
    setSaving(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const { data, error } = await db.from('projects').insert({
      consultant_id: user.id,
      name:          form.name,
      description:   form.description  || null,
      event_name:    form.event_name   || null,
      venue:         form.venue        || null,
      city:          form.city         || null,
      region:        form.region       || null,
      start_date:    form.start_date   || null,
      end_date:      form.end_date     || null,
      budget:        form.budget ? parseFloat(form.budget) : null,
      currency:      form.currency     || 'EUR',
      status:        'draft',
    }).select().single()

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Project created!')
    router.push(`/projects/${data.id}`)
  }

  return (
    <div className="p-8 max-w-[700px]">
      <Link href="/projects" className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Projects
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-8">Create New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Project identity */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
          <h2 className="font-display font-bold text-navy mb-5">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Project Name *</label>
              <input className={inputCls} value={form.name} required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Auto Expo 2026 — Hall 7" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[80px] resize-none'} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief notes about the exhibition requirements…" />
            </div>
            <div>
              <label className={labelCls}>Event / Show Name</label>
              <input className={inputCls} value={form.event_name}
                onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
                placeholder="e.g. Auto Expo 2026, Hannover Messe 2026" />
            </div>
          </div>
        </div>

        {/* Region first */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
          <h2 className="font-display font-bold text-navy mb-2">Region *</h2>
          <p className="text-[12.5px] text-[#6B6B6B] mb-5">Select region first — this determines venues and currency.</p>
          <div className="flex gap-3">
            {REGIONS.map(r => (
              <button key={r.id} type="button" onClick={() => setRegion(r.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-[1.5px] text-sm font-medium transition-all ${
                  form.region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] text-[#1A1A1A] hover:border-navy'
                }`}>
                <span className="text-lg">{r.flag}</span> {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Venue & City — only shows after region selected */}
        {form.region && (
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
            <h2 className="font-display font-bold text-navy mb-5">Venue & Location</h2>
            <div className="space-y-4">
              {/* Venue dropdown */}
              <div>
                <label className={labelCls}>Exhibition Venue</label>
                {venues.length > 0 ? (
                  <select className={inputCls + ' cursor-pointer'}
                    value={form.venue}
                    onChange={e => setVenue(e.target.value)}>
                    <option value="">— Select a venue —</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name}, {v.city}</option>
                    ))}
                    <option value="__custom__">Other / Custom venue</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] bg-cream rounded-lg px-4 py-3">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-gold border-t-transparent rounded-full" />
                    Loading venues for {form.region}…
                  </div>
                )}
                {form.venue === '__custom__' && (
                  <input className={inputCls + ' mt-2'} placeholder="Enter venue name"
                    onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                )}
              </div>

              {/* City — auto-filled, editable */}
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Auto-filled from venue, or type manually" />
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
          <h2 className="font-display font-bold text-navy mb-5">Event Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" className={inputCls} value={form.start_date}
                onChange={e => {
                  const newStart = e.target.value
                  setForm(f => ({
                    ...f,
                    start_date: newStart,
                    // Clear end date if it's before new start date
                    end_date: f.end_date && f.end_date < newStart ? '' : f.end_date,
                  }))
                }} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" className={inputCls} value={form.end_date}
                // End date cannot be before start date
                min={form.start_date || undefined}
                onChange={e => {
                  if (form.start_date && e.target.value < form.start_date) {
                    toast.error('End date cannot be before start date')
                    return
                  }
                  setForm(f => ({ ...f, end_date: e.target.value }))
                }} />
            </div>
          </div>
          {/* Show rental days */}
          {rentalDays !== null && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <span className="text-[13px] text-blue-700">
                📅 <strong>{rentalDays} day{rentalDays !== 1 ? 's' : ''}</strong> rental period
                {rentalDays >= 1 && ' — products will be pre-set to this duration'}
              </span>
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
          <h2 className="font-display font-bold text-navy mb-5">Budget</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Total Budget</label>
              <input type="number" className={inputCls} value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls + ' cursor-pointer'} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="">— Select —</option>
                {CURRENCIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {form.region && form.currency && (
                <p className="text-[11px] text-green-600 mt-1">
                  ✓ Auto-selected for {form.region}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/projects" className="border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium px-6 py-3 rounded-lg hover:border-navy hover:text-navy transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="bg-navy hover:bg-navy-light text-white font-bold px-8 py-3 rounded-lg transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Project →'}
          </button>
        </div>
      </form>
    </div>
  )
}
