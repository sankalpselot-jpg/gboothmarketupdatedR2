'use client'
import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function AdminCreditApprovalsPage() {
  const [consultants, setConsultants] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [editForm, setEditForm] = useState({ credit_limit: '', net_days: '0', deposit_pct: '100', approved_buyer: false, notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [profilesRes, termsRes] = await Promise.all([
        fetch('/api/profiles'),
        fetch('/api/admin/payment-terms'),
      ])
      const { data: profiles } = await profilesRes.json()
      const { data: terms }    = await termsRes.json().catch(() => ({ data: [] }))
      const consultants = (profiles || []).filter((p: any) => p.user_type === 'consultant')
      // Merge payment terms into consultants
      setConsultants(consultants.map((c: any) => ({
        ...c,
        terms: (terms || []).find((t: any) => t.consultant_id === c.id) || null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const handleSelect = (c: any) => {
    setSelected(c)
    setEditForm({
      credit_limit:   c.terms?.credit_limit?.toString()  || '',
      net_days:       c.terms?.net_days?.toString()       || '0',
      deposit_pct:    c.terms?.deposit_pct?.toString()    || '100',
      approved_buyer: c.terms?.approved_buyer             || false,
      notes:          c.terms?.notes                      || '',
    })
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const res = await fetch('/api/admin/payment-terms', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        consultant_id:  selected.id,
        credit_limit:   parseFloat(editForm.credit_limit) || 0,
        net_days:       parseInt(editForm.net_days)        || 0,
        deposit_pct:    parseInt(editForm.deposit_pct)     || 100,
        approved_buyer: editForm.approved_buyer,
        notes:          editForm.notes || null,
      }),
    })
    const { error } = await res.json()
    if (error) { toast.error(error); setSaving(false); return }
    toast.success('Payment terms saved')
    setSelected(null)
    setSaving(false)
    // Refresh
    setConsultants(prev => prev.map(c =>
      c.id === selected.id
        ? { ...c, terms: { ...c.terms, ...editForm, credit_limit: parseFloat(editForm.credit_limit) || 0, net_days: parseInt(editForm.net_days), deposit_pct: parseInt(editForm.deposit_pct) } }
        : c
    ))
  }

  const inputCls = 'w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors'
  const labelCls = 'block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5'

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">Credit &amp; Payment Terms</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Manage deposit requirements, credit limits, and net payment terms per consultant</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Default (100% upfront)', value: consultants.filter(c => !c.terms || c.terms.deposit_pct === 100).length, color: 'text-[#6B6B6B]', icon: Clock },
          { label: 'Deposit Enabled',        value: consultants.filter(c => c.terms && c.terms.deposit_pct < 100).length, color: 'text-blue-600', icon: CreditCard },
          { label: 'Approved Buyers',         value: consultants.filter(c => c.terms?.approved_buyer).length, color: 'text-green-600', icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <s.icon size={20} className={s.color + ' mb-2'} />
            <p className={`font-display font-bold text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-[#6B6B6B] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Consultant list */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream border-b border-[#DDD8CF]">
                  {['Consultant', 'Company', 'Projects', 'Terms', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-navy text-[12px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6B6B6B] text-sm">Loading…</td></tr>
                ) : consultants.map(c => (
                  <tr key={c.id} className={`border-b border-cream-dark hover:bg-cream/40 cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-cream' : ''}`}
                    onClick={() => handleSelect(c)}>
                    <td className="px-4 py-3 font-medium text-navy">{c.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{c.company_name || '—'}</td>
                    <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{c.terms?.successful_projects || 0}</td>
                    <td className="px-4 py-3">
                      {c.terms?.approved_buyer ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle size={10} /> Approved Buyer
                        </span>
                      ) : c.terms && c.terms.deposit_pct < 100 ? (
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          {c.terms.deposit_pct}% deposit · Net {c.terms.net_days}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6B6B6B]">100% upfront</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gold text-[12.5px]">Edit →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit panel */}
        {selected ? (
          <div className="card p-6">
            <h2 className="font-display font-bold text-navy mb-1">Edit Terms</h2>
            <p className="text-[#6B6B6B] text-[12.5px] mb-5">{selected.full_name} · {selected.company_name}</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Deposit %</label>
                <div className="flex gap-2">
                  {[100, 50, 30, 20].map(p => (
                    <button key={p} type="button" onClick={() => setEditForm(f => ({ ...f, deposit_pct: p.toString() }))}
                      className={`flex-1 py-2 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                        editForm.deposit_pct === p.toString() ? 'bg-navy text-white border-navy' : 'border-[#DDD8CF] hover:border-navy'
                      }`}>{p}%</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Net Payment Days</label>
                <div className="flex gap-2">
                  {[0, 15, 30, 45].map(d => (
                    <button key={d} type="button" onClick={() => setEditForm(f => ({ ...f, net_days: d.toString() }))}
                      className={`flex-1 py-2 rounded-lg border-[1.5px] text-sm font-medium transition-all ${
                        editForm.net_days === d.toString() ? 'bg-navy text-white border-navy' : 'border-[#DDD8CF] hover:border-navy'
                      }`}>{d === 0 ? 'None' : `Net ${d}`}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Credit Limit (INR)</label>
                <input type="number" className={inputCls} value={editForm.credit_limit}
                  onChange={e => setEditForm(f => ({ ...f, credit_limit: e.target.value }))}
                  placeholder="0 = no credit limit" />
              </div>
              <div className="flex items-center justify-between bg-cream rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">Approved Buyer</p>
                  <p className="text-[11.5px] text-[#6B6B6B]">Monthly invoicing available</p>
                </div>
                <div style={{ width: 44, height: 24 }}
                  className={`rounded-full relative cursor-pointer transition-colors ${editForm.approved_buyer ? 'bg-navy' : 'bg-[#DDD8CF]'}`}
                  onClick={() => setEditForm(f => ({ ...f, approved_buyer: !f.approved_buyer }))}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-all ${editForm.approved_buyer ? 'left-[22px]' : 'left-[2px]'}`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea className={inputCls + ' resize-none min-h-[70px]'} value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal notes about this account…" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(null)} className="flex-1 border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] py-2.5 rounded-lg text-sm hover:border-navy transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-navy text-white font-bold py-2.5 rounded-lg text-sm hover:bg-navy-light transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Terms'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 flex items-center justify-center h-48">
            <p className="text-[#6B6B6B] text-sm text-center">Select a consultant from the list to edit their payment terms</p>
          </div>
        )}
      </div>
    </div>
  )
}
