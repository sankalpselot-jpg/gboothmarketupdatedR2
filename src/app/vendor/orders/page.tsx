'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { ORDER_STATUSES } from '@/components/ui/OrderTimeline'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }
const ALL_STATUSES = ['all', ...ORDER_STATUSES.map(s => s.id)]

export default function VendorOrdersPage() {
  const db = useMemo(() => createClient() as any, [])
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      const { data } = await db.from('vendor_orders')
        .select('*, vendor_order_items(*)')
        .eq('vendor_id', vp.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [db])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const getCounts = () => {
    const map: Record<string, number> = { all: orders.length }
    for (const s of ORDER_STATUSES) {
      map[s.id] = orders.filter(o => o.status === s.id).length
    }
    return map
  }
  const counts = getCounts()

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{orders.length} total</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/8 rounded-lg p-1 mb-6 overflow-x-auto">
        {ALL_STATUSES.map(f => {
          const cnt = counts[f] || 0
          const cfg = ORDER_STATUSES.find(s => s.id === f)
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11.5px] font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-gold/20 text-gold-light' : 'text-white/40 hover:text-white/70'
              }`}>
              {f === 'all' ? `All (${orders.length})` : (
                <>
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  <span className="capitalize">{f.replace('_', ' ')}</span>
                  {cnt > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{cnt}</span>}
                </>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/30">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-16 text-center">
          <ShoppingBag size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm">No {filter !== 'all' ? filter.replace('_', ' ') : ''} orders</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['Order', 'Items', 'Total', 'Delivery Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const cfg = ORDER_STATUSES.find(s => s.id === o.status)
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono font-medium text-white text-[12.5px]">{o.order_number}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-white/50 text-[12.5px]">
                      {o.vendor_order_items?.length || 0} item{o.vendor_order_items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      {SYM[o.currency] || '₹'}{o.total.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-white/40 text-[12.5px]">
                      {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {cfg && (
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/vendor/orders/${o.id}`} className="text-gold-light hover:text-gold text-[12.5px] transition-colors">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
