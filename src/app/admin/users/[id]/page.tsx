'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Profile, UserRole } from '@/types/database'

const ROLES: UserRole[] = ['customer', 'staff', 'admin']

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role,    setRole]    = useState<UserRole>('customer')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(({ data }) => {
        const p = (data as Profile[]).find(u => u.id === params.id)
        if (p) { setProfile(p); setRole(p.role) }
      })
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, role }),
    })
    const { error } = await res.json()
    if (error) { toast.error(error); setSaving(false); return }
    toast.success('User role updated')
    router.push('/admin/users')
  }

  if (!profile) return (
    <div className="text-[#6B6B6B] text-sm">Loading…</div>
  )

  return (
    <div className="max-w-[600px]">
      <Link href="/admin/users" className="text-gold hover:text-gold-light text-[13px] block mb-5">← All Users</Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-6">User Profile</h1>

      <div className="card p-7 space-y-5">
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Full Name</p>
            <p className="font-medium text-navy">{profile.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Email</p>
            <p className="font-medium text-navy">{profile.email}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Company</p>
            <p className="font-medium text-navy">{profile.company_name || '—'}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Phone</p>
            <p className="font-medium text-navy">{profile.phone || '—'}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Region</p>
            <p className="font-medium text-navy">{profile.region || '—'}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Currency</p>
            <p className="font-medium text-navy">{profile.preferred_currency}</p>
          </div>
          {profile.company_vat && (
            <div>
              <p className="text-[#6B6B6B] mb-0.5">VAT Number</p>
              <p className="font-mono text-navy text-[13px]">{profile.company_vat}</p>
            </div>
          )}
          {profile.company_gstin && (
            <div>
              <p className="text-[#6B6B6B] mb-0.5">GSTIN</p>
              <p className="font-mono text-navy text-[13px]">{profile.company_gstin}</p>
            </div>
          )}
          <div>
            <p className="text-[#6B6B6B] mb-0.5">Joined</p>
            <p className="font-medium text-navy">
              {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="border-t border-[#DDD8CF] pt-5">
          <label className="label">User Role</label>
          <div className="flex gap-3">
            {ROLES.map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded border-[1.5px] text-sm font-medium capitalize transition-all ${
                  role === r ? 'bg-navy text-white border-navy' : 'bg-white text-[#1A1A1A] border-[#DDD8CF] hover:border-navy'
                }`}>
                {r}
              </button>
            ))}
          </div>
          <p className="text-[11.5px] text-[#6B6B6B] mt-2">
            Admin: full platform access. Staff: order management only. Customer: standard access.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/admin/users" className="btn-outline px-5 py-2.5 text-sm">Cancel</Link>
          <button onClick={handleSave} disabled={saving || role === profile.role}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Update Role'}
          </button>
        </div>
      </div>
    </div>
  )
}
