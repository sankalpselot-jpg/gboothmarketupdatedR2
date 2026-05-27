'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'

const CURRENCIES = [{ id: 'INR', label: '₹ INR' }, { id: 'EUR', label: '€ EUR' }, { id: 'GBP', label: '£ GBP' }]
const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: '🇮🇳 India' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 United Kingdom' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:        '',
    description: '',
    event_name:  '',
    venue:       '',
    city:        '',
    region:      'IN' as Region,
    start_date:  '',
    end_date:    '',
    budget:      '',
    currency:    'INR',
  })

  const inputCls = 'w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors bg-white'
  const labelCls = 'block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Project name required'); return }
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
      region:        form.region,
      start_date:    form.start_date   || null,
      end_date:      form.end_date     || null,
      budget:        form.budget ? parseFloat(form.budget) : null,
      currency:      form.currency,
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
              <input className={inputCls} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Auto Expo 2026 — Hall 7" required />
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
                placeholder="e.g. Auto Expo 2026" />
            </div>
          </div>
        </div>

        {/* Venue & dates */}
        <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
          <h2 className="font-display font-bold text-navy mb-5">Venue &amp; Dates</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Venue Name</label>
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
                  <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, region: r.id }))}
                    className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                      form.region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] text-[#1A1A1A] hover:border-navy'
                    }`}>{r.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" className={inputCls} value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
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
                {CURRENCIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
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
