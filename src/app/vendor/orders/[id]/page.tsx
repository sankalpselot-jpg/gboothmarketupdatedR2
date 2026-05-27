'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUSES = ['pending','confirmed','in_progress','delivered','completed','cancelled']
const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
  completed:   'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled:   'bg-red-500/10 text-red-400 border-red-500/20',
}
const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function VendorOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [order,  setOrder]  = useState<any>(null)
  const [status, setStatus] = useState('')
  const [notes,  setNotes]  = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    db.from('vendor_orders')
      .select('*, vendor_order_items(*)')
      .eq('id', params.id).single()
      .then(({ data }: any) => {
        if (data) { setOrder(data); setStatus(data.status); setNotes(data.vendor_notes || '') }
      })
  }, [params.id, db])

  const handleUpdate = async () => {
    setSaving(true)
    const { error } = await db.from('vendor_orders')
      .update({ status, vendor_notes: notes || null })
      .eq('id', params.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Order updated')
    router.push('/vendor/orders')
  }

  if (!order) return <div className="p-8 text-white/30 text-sm">Loading…</div>

  const sym = SYM[order.currency] || '₹'

  return (
    <div className="p-8 text-white max-w-[860px]">
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
        <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border capitalize ${STATUS_STYLE[order.status] || ''}`}>
          {order.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
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
            <div className="px-5 py-4 bg-white/3 space-y-1.5 text-sm">
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
                {order.delivery_date && <div className="flex gap-3"><span className="text-white/30 w-28">Date</span><span className="text-white">{new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>}
                {order.delivery_address && <div className="flex gap-3"><span className="text-white/30 w-28">Address</span><span className="text-white">{order.delivery_address}</span></div>}
                {order.notes && <div className="flex gap-3"><span className="text-white/30 w-28">Consultant note</span><span className="text-white">{order.notes}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Update status */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/8 rounded-xl p-5">
            <p className="font-display font-bold text-white text-sm mb-4">Update Order</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-gold/50 transition-colors cursor-pointer">
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">Note to Consultant</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold/50 transition-colors resize-none min-h-[80px]"
                  placeholder="Delivery time, instructions…" />
              </div>
              <button onClick={handleUpdate} disabled={saving}
                className="w-full bg-gold hover:bg-gold-light text-navy font-bold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm">
                {saving ? 'Updating…' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
