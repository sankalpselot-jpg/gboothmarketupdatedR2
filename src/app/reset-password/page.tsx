'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    setDone(true)
    toast.success('Password updated!')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-10">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
            </svg>
          </div>
          <span className="font-display font-extrabold text-xl text-navy">Booth<span className="text-gold">Market</span></span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-navy mb-2">Password updated!</h1>
            <p className="text-[#6B6B6B] text-sm mb-6">Redirecting you to your dashboard…</p>
            <Link href="/dashboard" className="btn-primary inline-block px-6 py-3">Go to Dashboard</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-extrabold text-[28px] text-navy mb-1.5">Set new password</h1>
            <p className="text-[#6B6B6B] text-sm mb-7">Choose a strong password for your BoothMarket account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password" value={password} required minLength={8}
                  onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password" value={confirm} required minLength={8}
                  onChange={e => setConfirm(e.target.value)}
                  className="input" placeholder="Repeat your password"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
