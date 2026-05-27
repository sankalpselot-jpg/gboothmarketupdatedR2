'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'
import { REGION_CURRENCIES } from '@/lib/utils/currency'

type UserType = 'consultant' | 'vendor'

const USER_TYPES: { id: UserType; label: string; desc: string; icon: string }[] = [
  {
    id:    'consultant',
    label: 'Design Consultant / Event Agency',
    desc:  'Browse vendor products, create exhibition projects, manage sourcing',
    icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    id:    'vendor',
    label: 'Rental Provider / Vendor',
    desc:  'List your products, manage inventory, receive and fulfil orders',
    icon:  'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
]

export default function RegisterPage() {
  const [step,    setStep]    = useState<1 | 2>(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [form,    setForm]    = useState({
    fullName: '', email: '', password: '',
    company: '', region: 'IN' as Region,
  })
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userType) return
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: {
          full_name:          form.fullName,
          company_name:       form.company,
          region:             form.region,
          user_type:          userType,
          preferred_currency: REGION_CURRENCIES[form.region],
        },
      },
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    // Auto sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    if (signInError) {
      toast.success('Account created! Please sign in.')
      router.push('/login')
      return
    }

    toast.success('Account created! Welcome to BoothMarket.')

    // Redirect based on role
    if (userType === 'vendor') {
      router.push('/vendor/onboarding')
    } else {
      router.push('/projects')
    }
  }

  return (
    <div className="w-full max-w-[520px]">
      <h1 className="font-display font-extrabold text-[28px] text-navy mb-1.5">Create account</h1>
      <p className="text-[#6B6B6B] text-sm mb-7">Join the BoothMarket B2B exhibition marketplace</p>

      {/* Step 1 — Role selection */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-navy mb-2">I am a…</p>
          {USER_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setUserType(type.id)}
              className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                userType === type.id
                  ? 'border-navy bg-navy/5'
                  : 'border-[#DDD8CF] hover:border-navy/40 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                userType === type.id ? 'bg-navy' : 'bg-cream-dark'
              }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={userType === type.id ? 'white' : '#6B6B6B'} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d={type.icon}/>
                </svg>
              </div>
              <div>
                <p className={`font-display font-bold text-[15px] mb-1 ${
                  userType === type.id ? 'text-navy' : 'text-[#1A1A1A]'
                }`}>{type.label}</p>
                <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed">{type.desc}</p>
              </div>
              {userType === type.id && (
                <div className="ml-auto flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}

          <button
            onClick={() => setStep(2)}
            disabled={!userType}
            className="btn-primary w-full py-3 mt-4 disabled:opacity-60"
          >
            Continue →
          </button>

          <p className="text-center text-sm text-[#6B6B6B]">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-gold-light font-medium">Sign in</Link>
          </p>
        </div>
      )}

      {/* Step 2 — Account details */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role badge */}
          <div className="flex items-center gap-2 bg-cream rounded-lg px-4 py-2.5 mb-2">
            <span className="text-[12px] text-[#6B6B6B]">Registering as:</span>
            <span className="text-[12px] font-semibold text-navy">
              {USER_TYPES.find(t => t.id === userType)?.label}
            </span>
            <button type="button" onClick={() => setStep(1)}
              className="ml-auto text-[12px] text-gold hover:text-gold-light">
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required className="input" placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="label">Company Name *</label>
              <input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                required className="input" placeholder="Acme Events Ltd"
              />
            </div>
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required className="input" placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="label">Password *</label>
            <input
              type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required minLength={8} className="input" placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="label">Primary Region *</label>
            <select
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value as Region }))}
              className="input cursor-pointer"
            >
              <option value="IN">🇮🇳 India</option>
              <option value="EU">🇪🇺 Europe</option>
              <option value="UK">🇬🇧 United Kingdom</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setStep(1)}
              className="btn-outline px-5 py-3 text-sm">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 py-3 disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>

          <p className="text-[11.5px] text-[#6B6B6B] text-center">
            By registering you agree to our{' '}
            <Link href="/terms" className="text-gold">Terms</Link> and{' '}
            <Link href="/privacy" className="text-gold">Privacy Policy</Link>
          </p>
        </form>
      )}
    </div>
  )
}
