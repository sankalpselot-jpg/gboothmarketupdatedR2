'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[]    = ['customer', 'staff', 'admin']
const USER_TYPES           = ['consultant', 'vendor', 'admin']

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [profile,  setProfile]  = useState<any>(null)
  const [role,     setRole]     = useState<UserRole>('customer')
  const [userType, setUserType] = useState('consultant')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState('')

  useEffect(() => {
    fetch('/api/profiles')
      .then(r => r.json())
      .then(({ data }) => {
        const p = data?.find((u: any) => u.id === params.id)
        if (p) { setProfile(p); setRole(p.role); setUserType(p.user_type || 'consultant') }
      })
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, user_type: userType }),
    })
    const { error } = await res.json()
    if (error) { toast.error(error); setSaving(false); return }
    toast.success('User updated')
    router.push('/admin/users')
  }

  const handleSuspend = async () => {
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended: true }),
    })
    const { error } = await res.json()
    if (error) { toast.error(error); return }
    toast.success('User suspended')
    router.push('/admin/users')
  }

  const handleDelete = async () => {
    if (confirm !== profile?.email) { toast.error('Email does not match'); return }
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' })
    const { error } = await res.json()
    if (error) { toast.error(error); setDeleting(false); return }
    toast.success('User deleted')
    router.push('/admin/users')
  }

  if (!profile) return <div className="text-[#6B6B6B] text-sm">Loading…</div>

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/users" className="flex items-center gap-2 text-gold hover:text-gold-light text-[13px] mb-5">
        <ArrowLeft size={14} /> All Users
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-6">Manage User</h1>

      {/* Profile info */}
      <div className="card p-6 mb-5">
        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div><p className="text-[#6B6B6B] mb-0.5">Name</p><p className="font-medium text-navy">{profile.full_name || '—'}</p></div>
          <div><p className="text-[#6B6B6B] mb-0.5">Email</p><p className="font-medium text-navy">{profile.email}</p></div>
          <div><p className="text-[#6B6B6B] mb-0.5">Company</p><p className="font-medium text-navy">{profile.company_name || '—'}</p></div>
          <div><p className="text-[#6B6B6B] mb-0.5">Region</p><p className="font-medium text-navy">{profile.region || '—'}</p></div>
          <div><p className="text-[#6B6B6B] mb-0.5">Phone</p><p className="font-medium text-navy">{profile.phone || '—'}</p></div>
          <div><p className="text-[#6B6B6B] mb-0.5">Joined</p><p className="font-medium text-navy">{new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        </div>

        <div className="border-t border-[#DDD8CF] pt-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">User Type</label>
            <div className="flex gap-3">
              {USER_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setUserType(t)}
                  className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-medium capitalize transition-all ${
                    userType === t ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Platform Role</label>
            <div className="flex gap-3">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-medium capitalize transition-all ${
                    role === r ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'
                  }`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <Link href="/admin/users" className="border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium px-5 py-2.5 rounded-lg hover:border-navy hover:text-navy transition-colors text-sm">
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="bg-navy hover:bg-navy-light text-white font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-200 p-6">
        <h2 className="font-display font-bold text-red-600 mb-4 flex items-center gap-2">
          <Ban size={16} /> Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#DDD8CF]">
            <div>
              <p className="font-medium text-navy text-sm">Suspend Account</p>
              <p className="text-[12.5px] text-[#6B6B6B]">User cannot log in. Reversible.</p>
            </div>
            <button onClick={handleSuspend}
              className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-yellow-100 transition-colors">
              <Ban size={14} /> Suspend
            </button>
          </div>
          <div>
            <p className="font-medium text-navy text-sm mb-1">Delete Account</p>
            <p className="text-[12.5px] text-[#6B6B6B] mb-3">Permanently delete this user and all their data. Type their email to confirm.</p>
            <div className="flex gap-3">
              <input value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder={`Type ${profile.email} to confirm`}
                className="flex-1 border-[1.5px] border-red-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors" />
              <button onClick={handleDelete} disabled={deleting || confirm !== profile.email}
                className="flex items-center gap-2 bg-red-600 text-white font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-40">
                <Trash2 size={14} /> {deleting ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
