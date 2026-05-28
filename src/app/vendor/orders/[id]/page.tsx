'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import OrderTimeline, { ORDER_STATUSES } from '@/components/ui/OrderTimeline'
import type { ExtendedOrderStatus } from '@/types/database'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }

export default function VendorOrderDetailPage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])
  const [order,   setOrder]   = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [status,  setStatus]  = useState('')
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: o }, { data: h }] = await Promise.all([
        db.from('vendor_orders').select('*, vendor_order_items(*)').eq('id', params.id).single(),
        db.from('order_status_history').select('*').eq('vendor_order_id', params.id).order('created_at', { ascending: false }),
      ])
      if (o) { setOrder(o); setStatus(o.status) }
      setHistory(h || [])
    }
    load()
  }, [params.id, db])

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vendor/orders/${params.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status, vendor_notes: note || null }),
      })
      const { error } = await res.json()
      if (error) { toast.error(error); return }

      toast.success('Order updated — consultant notified!')
      // Reload history
      const { data: h } = await db.from('order_status_history')
        .select('*').eq('vendor_order_id', params.id).order('created_at', { ascending: false })
      setHistory(h || [])
      setOrder((o: any) => ({ ...o, status }))
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  if (!order) return <div className="p-8 text-white/30 text-sm">Loading…</div>

  const sym = SYM[order.currency] || '₹'
  const cfg = ORDER_STATUSES.find(s => s.id === order.status)

  return (
    <div className="p-8 text-white max-w-[1000px]">
      <Link href="/vendor/orders" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> All Orders
      </Link>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">{order.order_number}</h1>
          <p className="text-white/40 text-sm mt-1">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {cfg && (
          <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Order items */}
          <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 font-display font-bold text-white text-sm">Order Items</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/3 border-b border-white/5">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">Item</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">Qty</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">Days</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.vendor_order_items || []).map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-white">{item.product_name}</td>
                    <td className="px-4 py-3.5 text-right text-white/50">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right text-white/50">{item.days}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-white">{sym}{item.total_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 bg-white/3 text-sm space-y-1.5">
              <div className="flex justify-between text-white/40"><span>Subtotal</span><span>{sym}{order.subtotal.toLocaleString()}</span></div>
              {order.tax_amount > 0 && <div className="flex justify-between text-white/40"><span>Tax</span><span>+{sym}{order.tax_amount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-2"><span>Total</span><span>{sym}{order.total.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Delivery info */}
          {(order.delivery_address || order.delivery_date || order.notes) && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-5">
              <p className="font-display font-bold text-white text-sm mb-4">Delivery Details</p>
              <div className="space-y-2 text-sm">
                {order.delivery_date && <div className="flex gap-3"><span className="text-white/30 w-24">Date</span><span className="text-white">{new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>}
                {order.delivery_address && <div className="flex gap-3"><span className="text-white/30 w-24">Address</span><span className="text-white">{order.delivery_address}</span></div>}
                {order.notes && <div className="flex gap-3"><span className="text-white/30 w-24">Notes</span><span className="text-white">{order.notes}</span></div>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6">
            <p className="font-display font-bold text-white text-sm mb-5">Order Timeline</p>
            <OrderTimeline
              currentStatus={order.status as ExtendedOrderStatus}
              history={history}
              dark
            />
          </div>
        </div>

        {/* Update status panel */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/8 rounded-xl p-5">
            <p className="font-display font-bold text-white text-sm mb-4">Update Status</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">New Status</label>
                <div className="space-y-1.5">
                  {ORDER_STATUSES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-[12.5px] font-medium text-left transition-all ${
                        status === s.id
                          ? `${s.bg} ${s.color} border-transparent ring-1 ring-current`
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === s.id ? s.dot : 'bg-white/20'}`} />
                      <span className="flex-1">{s.label}</span>
                      {status === s.id && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">Note (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold/50 transition-colors resize-none min-h-[80px]"
                  placeholder="Add note for the consultant…" />
              </div>
              <button onClick={handleUpdate} disabled={saving || status === order.status}
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm">
                {saving ? 'Updating…' : 'Update & Notify Consultant'}
              </button>
              <p className="text-[11px] text-white/25 text-center">
                Consultant will see this update instantly
              </p>
            </div>
          </div>

          {/* Quick status guide */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-3">Status Guide</p>
            <div className="space-y-2">
              {ORDER_STATUSES.filter(s => s.id !== 'cancelled').map(s => (
                <div key={s.id} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${s.dot}`} />
                  <div>
                    <span className="text-[12px] font-medium text-white/70">{s.label}</span>
                    <span className="text-[11px] text-white/30 ml-1.5">— {s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
