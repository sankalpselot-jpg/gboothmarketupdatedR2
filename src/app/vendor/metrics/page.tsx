'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Truck, RefreshCw, Headphones, Star, Package, Info } from 'lucide-react'

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 bg-white/8 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

export default function VendorMetricsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [metrics,  setMetrics]  = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return

      const [{ data: m }, { data: o }] = await Promise.all([
        db.from('vendor_metrics').select('*').eq('vendor_id', vp.id).single(),
        db.from('vendor_orders').select('status, created_at, delivery_date, total, currency')
          .eq('vendor_id', vp.id).order('created_at', { ascending: false }),
      ])

      // Auto-calculate from orders if no stored metrics
      const allOrders = o || []
      const completed = allOrders.filter((x: any) => x.status === 'completed')
      const cancelled = allOrders.filter((x: any) => x.status === 'cancelled')
      const delivered = allOrders.filter((x: any) =>
        ['delivered','completed'].includes(x.status) && x.delivery_date
      )

      const onTimeDelivery = delivered.length > 0
        ? Math.round((delivered.filter((x: any) => {
            const deliveryDate = new Date(x.delivery_date)
            const orderDate    = new Date(x.created_at)
            return deliveryDate >= orderDate
          }).length / delivered.length) * 100)
        : 0

      const computed = {
        total_orders:            allOrders.length,
        completed_orders:        completed.length,
        cancelled_orders:        cancelled.length,
        on_time_delivery_pct:    m?.on_time_delivery_pct    ?? onTimeDelivery,
        on_time_pickup_pct:      m?.on_time_pickup_pct      ?? 0,
        avg_response_hours:      m?.avg_response_hours      ?? 0,
        replacement_success_pct: m?.replacement_success_pct ?? 0,
        avg_rating:              m?.avg_rating               ?? 0,
        completion_rate:         allOrders.length > 0
          ? Math.round((completed.length / allOrders.length) * 100) : 0,
      }

      setMetrics(computed)
      setOrders(allOrders)
      setLoading(false)
    }
    load()
  }, [db])

  if (loading) return <div className="p-8 text-white/30 text-sm">Loading metrics…</div>

  const m = metrics || {}

  const metricCards = [
    {
      label: 'On-time Delivery',
      value: m.on_time_delivery_pct || 0,
      unit: '%',
      icon: Truck,
      color: 'bg-blue-400',
      textColor: 'text-blue-400',
      desc: 'Orders delivered on or before agreed date',
    },
    {
      label: 'On-time Pickup',
      value: m.on_time_pickup_pct || 0,
      unit: '%',
      icon: RefreshCw,
      color: 'bg-purple-400',
      textColor: 'text-purple-400',
      desc: 'Items collected within agreed window after event',
    },
    {
      label: 'Avg Support Response',
      value: m.avg_response_hours || 0,
      unit: 'hrs',
      icon: Headphones,
      color: 'bg-green-400',
      textColor: 'text-green-400',
      desc: 'Average hours to respond to support requests',
      lowerIsBetter: true,
    },
    {
      label: 'Replacement Success',
      value: m.replacement_success_pct || 0,
      unit: '%',
      icon: RefreshCw,
      color: 'bg-amber-400',
      textColor: 'text-amber-400',
      desc: 'Failed items replaced within committed time',
    },
    {
      label: 'Order Completion',
      value: m.completion_rate || 0,
      unit: '%',
      icon: Package,
      color: 'bg-teal-400',
      textColor: 'text-teal-400',
      desc: 'Orders completed vs total orders placed',
    },
    {
      label: 'Avg Rating',
      value: m.avg_rating || 0,
      unit: '/5',
      icon: Star,
      color: 'bg-gold',
      textColor: 'text-gold-light',
      desc: 'Average consultant rating across all orders',
    },
  ]

  return (
    <div className="p-8 text-white">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp size={22} className="text-gold-light" />
        <h1 className="font-display font-extrabold text-2xl text-white">Operational Metrics</h1>
      </div>
      <p className="text-white/40 text-sm mb-8 ml-9">
        These metrics are shown to consultants when choosing vendors. They're calculated from your order history.
      </p>

      {/* Info banner */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Info size={15} className="text-white/40 flex-shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-white/50 leading-relaxed">
          Metrics are automatically calculated from your completed orders.
          Response time and replacement metrics will populate as you handle more orders.
          <strong className="text-white/70"> These replace star ratings</strong> — consultants see real operational data, not just stars.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Orders',     value: m.total_orders     || 0, color: 'text-white' },
          { label: 'Completed',        value: m.completed_orders || 0, color: 'text-green-400' },
          { label: 'Cancelled',        value: m.cancelled_orders || 0, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-5">
            <p className="text-[12px] text-white/40 mb-1">{s.label}</p>
            <p className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {metricCards.map(card => {
          const displayVal = card.unit === 'hrs'
            ? card.value === 0 ? '—' : `${card.value.toFixed(1)}h`
            : card.unit === '/5'
              ? card.value === 0 ? '—' : `${card.value.toFixed(1)}/5`
              : `${card.value}%`

          const barVal = card.unit === 'hrs'
            ? Math.max(0, 100 - (card.value / 24 * 100))
            : card.unit === '/5'
              ? card.value / 5 * 100
              : card.value

          const quality = card.lowerIsBetter
            ? card.value === 0 ? 'no-data'
              : card.value <= 1 ? 'excellent'
              : card.value <= 2 ? 'good'
              : card.value <= 4 ? 'fair' : 'poor'
            : card.value === 0 ? 'no-data'
              : card.value >= 95 ? 'excellent'
              : card.value >= 85 ? 'good'
              : card.value >= 70 ? 'fair' : 'poor'

          const qualityLabel: Record<string, string> = {
            'excellent': '🟢 Excellent',
            'good':      '🟡 Good',
            'fair':      '🟠 Fair',
            'poor':      '🔴 Needs improvement',
            'no-data':   '⚪ No data yet',
          }

          return (
            <div key={card.label} className="bg-white/5 border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <card.icon size={16} className={card.textColor} />
                <h3 className="font-display font-semibold text-white text-sm">{card.label}</h3>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <p className={`font-display font-extrabold text-3xl ${card.textColor}`}>{displayVal}</p>
                <div className="flex-1">
                  <MetricBar value={barVal} color={card.color} />
                </div>
              </div>
              <p className="text-[11.5px] text-white/30 mb-1">{card.desc}</p>
              <p className="text-[11px] text-white/40">{qualityLabel[quality]}</p>
            </div>
          )
        })}
      </div>

      {/* How metrics are calculated */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-6">
        <h2 className="font-display font-bold text-white text-sm mb-4">How metrics are calculated</h2>
        <div className="grid md:grid-cols-2 gap-4 text-[12.5px] text-white/50 leading-relaxed">
          <div>
            <p className="font-medium text-white/70 mb-1">On-time Delivery %</p>
            <p>Orders where delivery happened before the event start date ÷ total delivered orders</p>
          </div>
          <div>
            <p className="font-medium text-white/70 mb-1">On-time Pickup %</p>
            <p>Orders where pickup happened within your SLA window after event end</p>
          </div>
          <div>
            <p className="font-medium text-white/70 mb-1">Avg Support Response</p>
            <p>Average time between consultant support message and your first response</p>
          </div>
          <div>
            <p className="font-medium text-white/70 mb-1">Replacement Success %</p>
            <p>Failed/damaged items replaced within your committed SLA window</p>
          </div>
        </div>
        <p className="text-[11.5px] text-white/30 mt-4 pt-4 border-t border-white/8">
          Response time and replacement tracking will be added automatically as consultants use the in-app support messaging feature (coming soon).
        </p>
      </div>
    </div>
  )
}
