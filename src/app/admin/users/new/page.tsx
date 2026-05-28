'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PasswordInput from '@/components/ui/PasswordInput'
import toast from 'react-hot-toast'
import type { Region } from '@/types/database'

const inputCls = 'w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors'
const labelCls = 'block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

export default function AdminNewUserPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email:        '',
    password:     '',
    full_name:    '',
    company_name: '',
    user_type:    'consultant',
    role:         'customer',
    region:       'IN' as Region,
    phone:        '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)

    const res = await fetch('/api/admin/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const { error, data } = await res.json()
    if (error) { toast.error(error); setSaving(false); return }
    toast.success('User created successfully!')
    router.push('/admin/users')
  }

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/users" className="flex items-center gap-2 text-gold hover:text-gold-light text-[13px] mb-5">
        <ArrowLeft size={14} /> All Users
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-7">Add New User</h1>

      <form onSubmit={handleCreate} className="space-y-5">
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy mb-5">Account Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={form.full_name} required
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jane Smith" />
              </div>
              <div>
                <label className={labelCls}>Company Name</label>
                <input className={inputCls} value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Acme Events Ltd" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email Address *</label>
              <input type="email" className={inputCls} value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@company.com" />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <PasswordInput
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={inputCls}
                placeholder="Min 8 characters"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" className={inputCls} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-navy mb-5">Role &amp; Permissions</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>User Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'consultant', label: '🗂 Design Consultant', desc: 'Can create projects and source from vendors' },
                  { id: 'vendor',     label: '🏪 Rental Vendor',     desc: 'Can list products and receive orders' },
                ].map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setForm(f => ({ ...f, user_type: t.id }))}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.user_type === t.id ? 'border-navy bg-navy/5' : 'border-[#DDD8CF] hover:border-navy/40'
                    }`}>
                    <p className="font-semibold text-navy text-sm">{t.label}</p>
                    <p className="text-[11.5px] text-[#6B6B6B] mt-0.5 leading-snug">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Platform Role</label>
              <select className={inputCls + ' cursor-pointer'} value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="customer">Customer (standard access)</option>
                <option value="staff">Staff (order management)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Primary Region</label>
              <div className="flex gap-3">
                {[
                  { id: 'IN', label: '🇮🇳 India' },
                  { id: 'EU', label: '🇪🇺 Europe' },
                  { id: 'UK', label: '🇬🇧 UK' },
                ].map(r => (
                  <button key={r.id} type="button"
                    onClick={() => setForm(f => ({ ...f, region: r.id as Region }))}
                    className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                      form.region === r.id ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] hover:border-navy'
                    }`}>{r.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/users" className="border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium px-6 py-3 rounded-lg hover:border-navy hover:text-navy transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="bg-navy hover:bg-navy-light text-white font-bold px-8 py-3 rounded-lg transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
