'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Package, ShoppingBag, Wallet } from 'lucide-react'
import { formatPrice, normalizeToReportingCurrency, FALLBACK_RATES } from '@/lib/utils/currency'

export default function VendorAnalyticsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [baseCurrency, setBaseCurrency] = useState('INR')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return

      // Fetch live exchange rates
      const { data: ratesData } = await db.from('exchange_rates').select('*')
      const rates: Record<string, Record<string, number>> = {}
      for (const r of (ratesData || [])) {
        if (!rates[r.from_currency]) rates[r.from_currency] = {}
        rates[r.from_currency][r.to_currency] = r.rate
      }

      const [{ data: orders }, { data: products }, { count: totalProducts }] = await Promise.all([
        db.from('vendor_orders').select('*, vendor_order_items(*)').eq('vendor_id', vp.id),
        db.from('vendor_products').select('id, name, base_currency').eq('vendor_id', vp.id).eq('is_active', true),
        db.from('vendor_products').select('*', { count: 'exact', head: true }).eq('vendor_id', vp.id),
      ])

      const allOrders  = orders || []
      const completed  = allOrders.filter((o: any) => o.status === 'completed')

      // Normalize revenue to INR (reporting currency)
      const revenue = completed.reduce((s: number, o: any) => {
        return s + normalizeToReportingCurrency(o.total, o.currency || 'INR', baseCurrency, { ...FALLBACK_RATES, ...rates })
      }, 0)

      const pending = allOrders.filter((o: any) => o.status === 'pending').length

      // Top products
      const productMap: Record<string, { name: string; count: number; revenue: number; currency: string }> = {}
      for (const order of allOrders) {
        for (const item of (order.vendor_order_items || [])) {
          if (!productMap[item.product_name]) {
            productMap[item.product_name] = { name: item.product_name, count: 0, revenue: 0, currency: order.currency || 'INR' }
          }
          productMap[item.product_name].count   += item.quantity
          productMap[item.product_name].revenue +=
            normalizeToReportingCurrency(item.total_price, order.currency || 'INR', baseCurrency, { ...FALLBACK_RATES, ...rates })
        }
      }
      const topProducts = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5)

      // Monthly revenue normalised
      const monthlyMap: Record<string, number> = {}
      for (const order of completed) {
        const month = new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
        monthlyMap[month] = (monthlyMap[month] || 0) +
          normalizeToReportingCurrency(order.total, order.currency || 'INR', baseCurrency, { ...FALLBACK_RATES, ...rates })
      }

      setData({ allOrders, revenue, pending, topProducts, monthlyMap, totalProducts: totalProducts || 0 })
      setLoading(false)
    }
    load()
  }, [db, baseCurrency])

  if (loading) return <div className="p-8 text-white/30 text-sm">Loading analytics…</div>
  if (!data)   return <div className="p-8 text-white/30 text-sm">No data available.</div>

  const maxRev = Math.max(...Object.values(data.monthlyMap as Record<string, number>), 1)

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">All revenue normalised to reporting currency</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-white/40">Reporting currency:</span>
          <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors cursor-pointer">
            <option value="INR">₹ INR</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="USD">$ USD</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue',   value: formatPrice(data.revenue, baseCurrency), icon: Wallet,     color: 'text-green-400' },
          { label: 'Total Orders',    value: data.allOrders.length,                   icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Active Products', value: data.totalProducts,                      icon: Package,     color: 'text-purple-400' },
          { label: 'Pending Orders',  value: data.pending,                            icon: TrendingUp,  color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-5">
            <s.icon size={18} className={s.color + ' mb-3'} />
            <p className={`font-display font-extrabold text-2xl mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly revenue */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white text-sm mb-1">Monthly Revenue</h2>
          <p className="text-[11.5px] text-white/30 mb-5">Normalised to {baseCurrency}</p>
          {Object.keys(data.monthlyMap).length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">No completed orders yet</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.monthlyMap as Record<string, number>).slice(-6).map(([month, rev]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-[12px] text-white/40 w-14 flex-shrink-0">{month}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="bg-gold h-2 rounded-full transition-all" style={{ width: `${(rev / maxRev) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-medium text-white w-24 text-right">{formatPrice(rev, baseCurrency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white text-sm mb-5">Top Rented Items</h2>
          {data.topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p: any, i: number) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[11px] font-bold text-white/40 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{p.name}</p>
                    <p className="text-[11.5px] text-white/30">{p.count} units rented</p>
                  </div>
                  <span className="text-[12.5px] font-semibold text-green-400">{formatPrice(p.revenue, baseCurrency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white text-sm mb-5">Order Status Breakdown</h2>
          {(['pending','confirmed','in_progress','delivered','completed','cancelled'] as const).map(s => {
            const count = data.allOrders.filter((o: any) => o.status === s).length
            const pct   = data.allOrders.length ? Math.round((count / data.allOrders.length) * 100) : 0
            const colors: Record<string, string> = {
              pending: 'bg-yellow-400', confirmed: 'bg-blue-400', in_progress: 'bg-purple-400',
              delivered: 'bg-teal-400', completed: 'bg-green-400', cancelled: 'bg-red-400',
            }
            return (
              <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="text-[12px] text-white/40 w-24 flex-shrink-0 capitalize">{s.replace('_', ' ')}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${colors[s]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] font-medium text-white/60 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>

        {/* Business summary */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white text-sm mb-5">Business Summary</h2>
          <div className="space-y-4">
            {[
              { label: 'Completion Rate',   value: data.allOrders.length ? `${Math.round((data.allOrders.filter((o: any) => o.status === 'completed').length / data.allOrders.length) * 100)}%` : '—', color: 'text-green-400' },
              { label: 'Cancellation Rate', value: data.allOrders.length ? `${Math.round((data.allOrders.filter((o: any) => o.status === 'cancelled').length / data.allOrders.length) * 100)}%` : '—', color: 'text-red-400' },
              { label: 'Avg Order Value',   value: data.allOrders.length ? formatPrice(data.allOrders.reduce((s: number, o: any) => s + normalizeToReportingCurrency(o.total, o.currency || 'INR', baseCurrency, FALLBACK_RATES), 0) / data.allOrders.length, baseCurrency) : '—', color: 'text-blue-400' },
              { label: 'Reporting Currency', value: baseCurrency, color: 'text-gold-light' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-[13px] text-white/50">{s.label}</span>
                <span className={`font-display font-bold text-lg ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
