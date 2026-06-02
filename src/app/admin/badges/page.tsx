'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const COLOR_OPTS = [
  { id: 'gold',   label: '🟡 Gold',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'blue',   label: '🔵 Blue',   cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'green',  label: '🟢 Green',  cls: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'purple', label: '🟣 Purple', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'red',    label: '🔴 Red',    cls: 'bg-red-100 text-red-800 border-red-200' },
]

export default function AdminBadgesPage() {
  const [badges,   setBadges]   = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [vendors,  setVendors]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'manage'|'assign-product'|'assign-vendor'>('manage')
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: 'gold', icon: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/badges').then(r => r.json()),
      fetch('/api/vendor-products?limit=50').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([b, p]) => {
      setBadges(b.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
  }, [])

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug: form.slug || slugify(form.name) }),
    })
    const { data, error } = await res.json()
    if (error) { toast.error(error); setSaving(false); return }
    setBadges(prev => [...prev, data])
    setForm({ name: '', slug: '', description: '', color: 'gold', icon: '' })
    toast.success('Badge created')
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this badge? It will be removed from all products and vendors.')) return
    await fetch(`/api/admin/badges/${id}`, { method: 'DELETE' })
    setBadges(prev => prev.filter(b => b.id !== id))
    toast.success('Badge deleted')
  }

  const inputCls = 'w-full border border-[#DDD8CF] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

  const getColor = (color: string) => COLOR_OPTS.find(c => c.id === color)?.cls || ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Badge Management</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Only admins can create and assign badges. Vendors cannot self-assign.</p>
        </div>
      </div>

      {/* Policy notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-[13px] text-amber-800">
          <strong>Badge Governance Policy:</strong> Badges are exclusively admin-controlled.
          Vendors cannot create, assign or modify badges. Consultants cannot assign badges or recommend vendors publicly.
          All badges shown on products are assigned here by admins only.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream border border-[#DDD8CF] rounded-lg p-1 mb-6 w-fit">
        {[
          { id: 'manage',         label: 'Manage Badges' },
          { id: 'assign-product', label: 'Assign to Products' },
          { id: 'assign-vendor',  label: 'Assign to Vendors' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'manage' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create badge */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-navy mb-5 flex items-center gap-2">
              <Plus size={16} className="text-gold" /> Create New Badge
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Badge Name *</label>
                  <input className={inputCls} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="e.g. Verified Vendor" />
                </div>
                <div>
                  <label className={labelCls}>Icon (emoji)</label>
                  <input className={inputCls} value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. ✓ or ⭐" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input className={inputCls} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What this badge means" />
              </div>
              <div>
                <label className={labelCls}>Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTS.map(c => (
                    <button key={c.id} onClick={() => setForm(f => ({ ...f, color: c.id }))}
                      className={`px-3 py-1.5 rounded-full text-[12px] border font-medium transition-all ${getColor(c.id)} ${form.color === c.id ? 'ring-2 ring-navy ring-offset-1' : 'opacity-70 hover:opacity-100'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={saving || !form.name}
                className="bg-navy text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-navy-light transition-colors disabled:opacity-60 w-full">
                {saving ? 'Creating…' : 'Create Badge'}
              </button>
            </div>
          </div>

          {/* Existing badges */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-navy mb-5 flex items-center gap-2">
              <Tag size={16} className="text-gold" /> Existing Badges ({badges.length})
            </h2>
            {loading ? <p className="text-[#6B6B6B] text-sm">Loading…</p> :
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {badges.map(badge => (
                  <div key={badge.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getColor(badge.color)}`}>
                        {badge.icon && <span className="mr-1">{badge.icon}</span>}
                        {badge.name}
                      </span>
                      {badge.description && (
                        <span className="text-[12px] text-[#6B6B6B]">{badge.description}</span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(badge.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {tab === 'assign-product' && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy mb-4">Assign Badges to Products</h2>
          <p className="text-[#6B6B6B] text-sm mb-5">Select a product and assign admin-controlled badges to it.</p>
          {products.length === 0 ? (
            <p className="text-[#6B6B6B] text-sm">No vendor products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream border-b border-[#DDD8CF]">
                    <th className="text-left px-4 py-3 font-semibold text-navy">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-navy">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-navy">Assign Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.id} className="border-b border-cream-dark">
                      <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                      <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{p.category || '—'}</td>
                      <td className="px-4 py-3">
                        <select className={inputCls + ' w-auto'}
                          onChange={async (e) => {
                            if (!e.target.value) return
                            await fetch('/api/admin/badges/assign', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ badge_id: e.target.value, vendor_product_id: p.id }),
                            })
                            toast.success('Badge assigned')
                            e.target.value = ''
                          }}>
                          <option value="">— Assign badge —</option>
                          {badges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'assign-vendor' && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy mb-4">Assign Badges to Vendors</h2>
          <p className="text-[#6B6B6B] text-sm">
            Vendor badge assignment coming in next update. Use the API endpoint <code className="bg-cream px-1.5 py-0.5 rounded text-[12px]">POST /api/admin/badges/assign</code> with <code className="bg-cream px-1.5 py-0.5 rounded text-[12px]">vendor_id</code> to assign vendor-level badges.
          </p>
        </div>
      )}
    </div>
  )
}
