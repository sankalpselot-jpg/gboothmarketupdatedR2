'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'

const CATEGORIES = [
  'Booth Structures', 'Lounge Furniture', 'Tables & Chairs',
  'Reception Counters', 'Flooring', 'Lighting', 'A/V & Electronics',
  'Signage & Graphics', 'Storage & Shelving', 'Outdoor Equipment',
]

const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: '🇮🇳 India' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 United Kingdom' },
]

export default function VendorOnboardingPage() {
  const router  = useRouter()
  const db      = useMemo(() => createClient() as any, [])
  const [saving, setSaving] = useState(false)
  const [step,   setStep]   = useState(1)
  const [form, setForm] = useState({
    company_name:  '',
    description:   '',
    website:       '',
    phone:         '',
    regions:       [] as Region[],
    categories:    [] as string[],
    gstin:         '',
    vat_number:    '',
    bank_account_name: '',
    bank_account_no:   '',
    bank_ifsc:         '',
  })

  // Pre-fill company name from profile
  useEffect(() => {
    db.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      const { data } = await db.from('profiles').select('company_name').eq('id', user.id).single()
      if (data?.company_name) setForm(f => ({ ...f, company_name: data.company_name }))
    })
  }, [db])

  const toggleRegion = (r: Region) =>
    setForm(f => ({
      ...f,
      regions: f.regions.includes(r) ? f.regions.filter(x => x !== r) : [...f.regions, r],
    }))

  const toggleCategory = (c: string) =>
    setForm(f => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c],
    }))

  const handleSubmit = async () => {
    setSaving(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const { error } = await db.from('vendor_profiles').upsert({
      user_id:           user.id,
      company_name:      form.company_name,
      description:       form.description || null,
      website:           form.website     || null,
      phone:             form.phone       || null,
      regions:           form.regions,
      categories:        form.categories,
      gstin:             form.gstin       || null,
      vat_number:        form.vat_number  || null,
      bank_account_name: form.bank_account_name || null,
      bank_account_no:   form.bank_account_no   || null,
      bank_ifsc:         form.bank_ifsc          || null,
      onboarding_done:   true,
    }, { onConflict: 'user_id' })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile saved! Welcome to BoothMarket.')
    router.push('/vendor/dashboard')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'block text-[12px] font-semibold uppercase tracking-wider text-white/40 mb-2'

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-8">
      <div className="w-full max-w-[640px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-light">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white mb-2">Set up your vendor profile</h1>
          <p className="text-white/40 text-sm">Complete your profile to start listing products and receiving orders</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all ${
                s < step  ? 'bg-gold border-gold text-navy' :
                s === step ? 'bg-gold/20 border-gold/50 text-gold-light' :
                'bg-white/5 border-white/10 text-white/30'
              }`}>{s < step ? '✓' : s}</div>
              {s < 3 && <div className={`flex-1 h-px ${s < step ? 'bg-gold/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Company info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-display font-bold text-lg mb-1">Company Information</h2>
            <div>
              <label className={labelCls}>Company Name *</label>
              <input className={inputCls} value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="Your rental company name" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[100px] resize-none'} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell exhibitors what you offer, your specialities, years of experience…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Website</label>
                <input className={inputCls} value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://yourcompany.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Regions Served *</label>
              <div className="flex gap-3">
                {REGIONS.map(r => (
                  <button key={r.id} type="button" onClick={() => toggleRegion(r.id)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                      form.regions.includes(r.id)
                        ? 'bg-gold/20 border-gold/50 text-gold-light'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}>{r.label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => {
              if (!form.company_name || form.regions.length === 0) {
                toast.error('Company name and at least one region required')
                return
              }
              setStep(2)
            }} className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-3.5 rounded-lg transition-colors mt-2">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Categories */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-display font-bold text-lg mb-1">Product Categories</h2>
            <p className="text-white/40 text-sm">Select the categories of rental items you offer</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-4 py-3 rounded-lg border text-[13px] text-left transition-all ${
                    form.categories.includes(cat)
                      ? 'bg-gold/20 border-gold/50 text-gold-light'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}>
                  {form.categories.includes(cat) && <span className="mr-2">✓</span>}
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 border border-white/10 text-white/60 font-medium py-3.5 rounded-lg hover:bg-white/10 transition-colors">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-gold hover:bg-gold-light text-navy font-bold py-3.5 rounded-lg transition-colors">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Tax & Banking */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-display font-bold text-lg mb-1">Tax &amp; Banking</h2>
            <p className="text-white/40 text-sm">Required for payouts and compliant invoicing. Can be updated later.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>GSTIN (India)</label>
                <input className={inputCls} value={form.gstin}
                  onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
                  placeholder="29ABCDE1234F1Z5" />
              </div>
              <div>
                <label className={labelCls}>VAT Number (EU/UK)</label>
                <input className={inputCls} value={form.vat_number}
                  onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))}
                  placeholder="GB123456789" />
              </div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/30 mb-4">Bank Account (for payouts)</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Account Holder Name</label>
                  <input className={inputCls} value={form.bank_account_name}
                    onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))}
                    placeholder="Company or individual name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Account Number</label>
                    <input className={inputCls} value={form.bank_account_no}
                      onChange={e => setForm(f => ({ ...f, bank_account_no: e.target.value }))}
                      placeholder="Account number" />
                  </div>
                  <div>
                    <label className={labelCls}>IFSC / Sort Code</label>
                    <input className={inputCls} value={form.bank_ifsc}
                      onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value }))}
                      placeholder="HDFC0001234" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/5 border border-white/10 text-white/60 font-medium py-3.5 rounded-lg hover:bg-white/10 transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-gold hover:bg-gold-light text-navy font-bold py-3.5 rounded-lg transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Complete Setup ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
