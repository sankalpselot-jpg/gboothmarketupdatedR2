import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate, ORDER_STATUS_STYLES, CURRENCY_SYMBOLS } from '@/lib/utils/format'
import type { OrderStatus, Currency } from '@/types/database'

export const metadata: Metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, venues(name, city)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1280px] mx-auto px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-[13px] text-gold hover:text-gold-light mb-1 block">← Dashboard</Link>
          <h1 className="font-display font-extrabold text-3xl text-navy">My Orders</h1>
        </div>
        <Link href="/products" className="btn-primary px-5 py-2.5 text-sm">+ New Order</Link>
      </div>

      {!orders?.length ? (
        <div className="card p-16 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-[#DDD8CF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          <h2 className="font-display font-bold text-xl text-navy mb-2">No orders yet</h2>
          <p className="text-[#6B6B6B] mb-6">Your placed orders will appear here.</p>
          <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-[#DDD8CF] bg-cream">
                {['Order #', 'Event', 'Venue', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const s = ORDER_STATUS_STYLES[o.status as OrderStatus]
                const sym = CURRENCY_SYMBOLS[o.currency as Currency]
                return (
                  <tr key={o.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-navy text-[13px]">{o.order_number}</td>
                    <td className="px-5 py-4 text-[#6B6B6B] max-w-[160px] truncate">{o.event_name || '—'}</td>
                    <td className="px-5 py-4 text-[#6B6B6B] text-[12.5px]">{(o.venues as any)?.name || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-navy whitespace-nowrap">{sym}{o.total.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${s.className}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-[#6B6B6B] text-[12.5px] whitespace-nowrap">{fmtDate(o.created_at)}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/orders/${o.id}`} className="text-gold hover:text-gold-light text-[12.5px] font-medium">View →</Link>
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
