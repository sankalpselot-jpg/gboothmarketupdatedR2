'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'
import { CheckCircle } from 'lucide-react'

const CATEGORIES = [
  'Furniture','Display & Shelving','TV & Digital Displays',
  'Audio / Visual','Lighting','Kitchen & Catering','IT & Connectivity',
]

const REGIONS: { id: Region; label: string; flag: string }[] = [
  { id: 'IN', label: 'India',          flag: '🇮🇳' },
  { id: 'EU', label: 'Europe (EU)',     flag: '🇪🇺' },
  { id: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
]

type PaymentAccounts = {
  IN?: { bank_name: string; account_no: string; ifsc: string; gstin: string; upi: string }
  EU?: { account_holder: string; iban: string; swift: string; vat: string }
  UK?: { account_holder: string; sort_code: string; account_no: string; vat: string }
}

const PAYMENT_FIELDS: Record<string, { key: string; label: string; placeholder: string; required?: boolean }[]> = {
  IN: [
    { key: 'bank_name',  label: 'Bank Name',            placeholder: 'HDFC Bank',              required: true },
    { key: 'account_no', label: 'Account Number',       placeholder: '12345678901234',          required: true },
    { key: 'ifsc',       label: 'IFSC Code',            placeholder: 'HDFC0001234',             required: true },
    { key: 'gstin',      label: 'GSTIN',                placeholder: '29ABCDE1234F1Z5' },
    { key: 'upi',        label: 'UPI ID (optional)',    placeholder: 'vendor@upi' },
  ],
  EU: [
    { key: 'account_holder', label: 'Account Holder Name', placeholder: 'Company GmbH',        required: true },
    { key: 'iban',           label: 'IBAN',                placeholder: 'DE89 3704 0044 …',    required: true },
    { key: 'swift',          label: 'SWIFT / BIC',         placeholder: 'COBADEFFXXX',         required: true },
    { key: 'vat',            label: 'VAT Number',          placeholder: 'DE123456789' },
  ],
  UK: [
    { key: 'account_holder', label: 'Account Holder Name', placeholder: 'Company Ltd',         required: true },
    { key: 'sort_code',      label: 'Sort Code',           placeholder: '20-00-00',            required: true },
    { key: 'account_no',     label: 'Account Number',      placeholder: '12345678',            required: true },
    { key: 'vat',            label: 'VAT Number',          placeholder: 'GB123456789' },
  ],
}

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
  })
  const [payments, setPayments] = useState<PaymentAccounts>({})

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

  const setPaymentField = (region: string, field: string, value: string) => {
    setPayments(prev => ({
      ...prev,
      [region]: { ...(prev[region as keyof PaymentAccounts] || {}), [field]: value },
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const { error } = await db.from('vendor_profiles').upsert({
      user_id:          user.id,
      company_name:     form.company_name,
      description:      form.description  || null,
      website:          form.website      || null,
      phone:            form.phone        || null,
      regions:          form.regions,
      categories:       form.categories,
      payment_accounts: payments,
      onboarding_done:  true,
    }, { onConflict: 'user_id' })

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile saved! Welcome to BoothMarket.')
    router.push('/vendor/dashboard')
  }

  const inputCls  = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const labelCls  = 'block text-[12px] font-semibold uppercase tracking-wider text-white/40 mb-2'

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-start justify-center p-8">
      <div className="w-full max-w-[680px] pt-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9882A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white mb-2">Set up your vendor profile</h1>
          <p className="text-white/40 text-sm">Complete your profile to start listing and receiving orders</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all ${
                s < step ? 'bg-gold border-gold text-navy' : s === step ? 'bg-gold/20 border-gold/50 text-gold-light' : 'bg-white/5 border-white/10 text-white/30'
              }`}>{s < step ? '✓' : s}</div>
              <p className={`text-[11.5px] font-medium flex-1 ${s === step ? 'text-white/70' : 'text-white/25'}`}>
                {s === 1 ? 'Company Info' : s === 2 ? 'Categories' : 'Payment Details'}
              </p>
              {s < 3 && <div className={`h-px w-6 ${s < step ? 'bg-gold/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Company Info ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-display font-bold text-lg">Company Information</h2>
            <div>
              <label className={labelCls}>Company Name *</label>
              <input className={inputCls} value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="Your rental company name" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[90px] resize-none'} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What you offer, specialities, years of experience…" />
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
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      form.regions.includes(r.id)
                        ? 'bg-gold/20 border-gold/50 text-gold-light'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}>
                    {r.flag} {r.label}
                    {form.regions.includes(r.id) && <CheckCircle size={13} />}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => {
              if (!form.company_name || form.regions.length === 0) { toast.error('Company name and at least one region required'); return }
              setStep(2)
            }} className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-3.5 rounded-lg transition-colors mt-2">
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Categories ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-display font-bold text-lg">Product Categories</h2>
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
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 border border-white/10 text-white/60 py-3.5 rounded-lg hover:bg-white/10 transition-colors">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-gold hover:bg-gold-light text-navy font-bold py-3.5 rounded-lg transition-colors">Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Regional Payment Details ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white font-display font-bold text-lg">Payment Details</h2>
              <p className="text-white/40 text-sm mt-1">
                Configure payment accounts for each region you serve. Only regions you selected appear here.
              </p>
            </div>

            {form.regions.length === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                No regions selected. Go back to Step 1 and select your service regions.
              </div>
            )}

            {form.regions.map(regionId => {
              const region     = REGIONS.find(r => r.id === regionId)!
              const fields     = PAYMENT_FIELDS[regionId] || []
              const payData    = payments[regionId as keyof PaymentAccounts] || {} as any

              const regionColors: Record<string, string> = {
                IN: 'border-orange-500/25 bg-orange-500/5',
                EU: 'border-blue-500/25 bg-blue-500/5',
                UK: 'border-red-500/25 bg-red-500/5',
              }

              return (
                <div key={regionId} className={`border rounded-xl p-6 ${regionColors[regionId] || 'border-white/10 bg-white/3'}`}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="text-2xl">{region.flag}</span>
                    <h3 className="font-display font-bold text-white text-base">{region.label}</h3>
                    <span className="text-[10px] font-bold text-white/30 bg-white/8 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {regionId === 'IN' ? 'INR' : regionId === 'EU' ? 'EUR' : 'GBP'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {fields.map(field => (
                      <div key={field.key} className={field.key === 'account_holder' || field.key === 'bank_name' ? 'col-span-2' : ''}>
                        <label className={labelCls}>
                          {field.label}{field.required && ' *'}
                        </label>
                        <input
                          className={inputCls}
                          value={(payData as any)[field.key] || ''}
                          onChange={e => setPaymentField(regionId, field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <p className="text-white/25 text-[12px] text-center">
              Payment details are encrypted and only used for payouts. You can update them anytime in Settings.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/5 border border-white/10 text-white/60 py-3.5 rounded-lg hover:bg-white/10 transition-colors">← Back</button>
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
