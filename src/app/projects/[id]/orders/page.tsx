'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import OrderTimeline, { ORDER_STATUSES } from '@/components/ui/OrderTimeline'
import type { ExtendedOrderStatus } from '@/types/database'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }

export default function ProjectOrdersPage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])
  const [project,  setProject]  = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [history,  setHistory]  = useState<Record<string, any[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: proj }, { data: ords }] = await Promise.all([
        db.from('projects').select('*').eq('id', params.id).single(),
        db.from('vendor_orders')
          .select('*, vendor_order_items(*), vendor_profiles(company_name, phone)')
          .eq('project_id', params.id)
          .order('created_at', { ascending: false }),
      ])
      setProject(proj)
      const normalized = (ords || []).map((o: any) => ({
        ...o,
        vendor_profiles: Array.isArray(o.vendor_profiles) ? o.vendor_profiles[0] : o.vendor_profiles,
      }))
      setOrders(normalized)

      // Load history for all orders
      if (ords?.length) {
        const { data: hist } = await db
          .from('order_status_history')
          .select('*')
          .in('vendor_order_id', ords.map((o: any) => o.id))
          .order('created_at', { ascending: false })

        const map: Record<string, any[]> = {}
        for (const h of (hist || [])) {
          if (!map[h.vendor_order_id]) map[h.vendor_order_id] = []
          map[h.vendor_order_id].push(h)
        }
        setHistory(map)
      }
      setLoading(false)
    }
    load()
    // Poll for updates every 30s
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [params.id, db])

  if (loading || !project) return <div className="p-8 text-[#6B6B6B] text-sm">Loading…</div>

  const sym   = SYM[project.currency || 'INR']
  const total = orders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="p-8 max-w-[960px]">
      <Link href={`/projects/${params.id}`} className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Project
      </Link>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-extrabold text-2xl text-navy">Order Tracking</h1>
        <span className="text-[12.5px] text-[#6B6B6B] bg-[#F5F2EC] border border-[#DDD8CF] px-3 py-1.5 rounded-full">
          Auto-refreshes every 30s
        </span>
      </div>
      <p className="text-[#6B6B6B] text-sm mb-8">{project.name}</p>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <p className="text-navy font-bold text-lg mb-2">No orders yet</p>
          <p className="text-[#6B6B6B] text-sm mb-5">Checkout your project cart to place orders.</p>
          <Link href={`/projects/${params.id}`} className="bg-navy text-white font-bold px-6 py-3 rounded-lg inline-block hover:bg-navy-light transition-colors">
            Go to Project
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const cfg     = ORDER_STATUSES.find(s => s.id === order.status)
            const vendor  = order.vendor_profiles
            const isOpen  = expanded === order.id
            const hist    = history[order.id] || []

            return (
              <div key={order.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDD8CF]">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-display font-bold text-navy text-sm">{vendor?.company_name || 'Vendor'}</p>
                      <p className="text-[11.5px] text-[#6B6B6B] font-mono">{order.order_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-navy">{sym}{order.total.toLocaleString()}</p>
                      {cfg && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="p-2 text-[#6B6B6B] hover:text-navy transition-colors">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Compact timeline always visible */}
                <div className="px-5 py-4 bg-[#FAFAF8] border-b border-[#DDD8CF] overflow-x-auto">
                  <OrderTimeline
                    currentStatus={order.status as ExtendedOrderStatus}
                    compact
                    dark={false}
                  />
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="p-5 grid md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <p className="font-display font-bold text-navy text-sm mb-3">Items</p>
                      <div className="space-y-2">
                        {(order.vendor_order_items || []).map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>
                              <span className="text-navy font-medium">{item.product_name}</span>
                              <span className="text-[#6B6B6B] ml-2 text-[12px]">×{item.quantity} · {item.days}d</span>
                            </div>
                            <span className="font-medium text-navy">{sym}{item.total_price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      {order.delivery_date && (
                        <p className="text-[12.5px] text-[#6B6B6B] mt-3">
                          📅 Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {vendor?.phone && (
                        <p className="text-[12.5px] text-[#6B6B6B] mt-1">📞 {vendor.phone}</p>
                      )}
                      {order.vendor_notes && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-[12px] font-semibold text-blue-700 mb-1">Vendor note</p>
                          <p className="text-[12.5px] text-blue-800">{order.vendor_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Full timeline */}
                    <div>
                      <p className="font-display font-bold text-navy text-sm mb-3">Status History</p>
                      <OrderTimeline
                        currentStatus={order.status as ExtendedOrderStatus}
                        history={hist}
                        dark={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Total */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 flex justify-between items-center">
            <span className="font-display font-bold text-navy">Total across all vendors</span>
            <span className="font-display font-extrabold text-2xl text-navy">{sym}{total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
