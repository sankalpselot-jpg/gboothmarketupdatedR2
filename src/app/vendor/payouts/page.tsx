'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid:       'bg-green-500/10 text-green-400 border-green-500/20',
  failed:     'bg-red-500/10 text-red-400 border-red-500/20',
}
const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function VendorPayoutsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [payouts,  setPayouts]  = useState<any[]>([])
  const [summary,  setSummary]  = useState({ total: 0, paid: 0, pending: 0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      const { data } = await db.from('payouts').select('*').eq('vendor_id', vp.id).order('created_at', { ascending: false })
      const ps = data || []
      setPayouts(ps)
      setSummary({
        total:   ps.reduce((s: number, p: any) => s + p.amount, 0),
        paid:    ps.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + p.amount, 0),
        pending: ps.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0),
      })
      setLoading(false)
    }
    load()
  }, [db])

  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-2xl text-white">Payouts</h1>
        <p className="text-white/40 text-sm mt-1">Track your earnings and payout history</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned',   value: `₹${summary.total.toLocaleString()}`,   color: 'text-white' },
          { label: 'Paid Out',       value: `₹${summary.paid.toLocaleString()}`,     color: 'text-green-400' },
          { label: 'Pending Payout', value: `₹${summary.pending.toLocaleString()}`,  color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-5">
            <Wallet size={18} className="text-white/30 mb-3" />
            <p className={`font-display font-extrabold text-2xl mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/30">Loading…</div>
      ) : payouts.length === 0 ? (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-16 text-center">
          <Wallet size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm">No payouts yet</p>
          <p className="text-white/20 text-[12px] mt-1">Payouts are processed after orders are completed</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['Date', 'Reference', 'Amount', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4 text-white/50 text-[12.5px]">
                    {p.payout_date ? new Date(p.payout_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-4 font-mono text-white/50 text-[12px]">{p.reference || '—'}</td>
                  <td className="px-5 py-4 font-semibold text-white">{SYM[p.currency] || '₹'}{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/30 text-[12.5px]">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
