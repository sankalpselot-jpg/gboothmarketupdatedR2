export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: productCount },
    { count: orderCount },
    { count: quoteCount },
    { count: userCount },
    { data: recentOrders },
    { data: recentQuotes },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders')
      .select('id, order_number, status, total, currency, region, created_at')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('quotes')
      .select('id, quote_number, status, region, contact_email, created_at')
      .order('created_at', { ascending: false }).limit(8),
  ])

  const stats = [
    { label: 'Active Products',  value: productCount ?? 0, color: 'text-navy' },
    { label: 'Total Orders',     value: orderCount   ?? 0, color: 'text-blue-600' },
    { label: 'Quote Requests',   value: quoteCount   ?? 0, color: 'text-gold' },
    { label: 'Registered Users', value: userCount    ?? 0, color: 'text-green-600' },
  ]

  const SYM: Record<string, string> = { EUR: '€', GBP: '£', INR: '₹' }

  const orderStatusClass = (s: string) => ({
    pending:   'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    delivered: 'bg-purple-50 text-purple-700',
    cancelled: 'bg-red-50 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600')

  const quoteStatusClass = (s: string) => ({
    pending:  'bg-yellow-50 text-yellow-700',
    sent:     'bg-blue-50 text-blue-700',
    accepted: 'bg-green-50 text-green-700',
    declined: 'bg-red-50 text-red-700',
    expired:  'bg-gray-100 text-gray-500',
  }[s] ?? 'bg-gray-100 text-gray-600')

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-6">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-[12.5px] text-[#6B6B6B] mb-1">{s.label}</p>
            <p className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDD8CF] flex justify-between items-center">
            <h2 className="font-display font-bold text-navy text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[12.5px] text-gold hover:text-gold-light">View all</Link>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-cream border-b border-[#DDD8CF]">
                <th className="text-left px-5 py-2.5 font-semibold text-navy">Order</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Region</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Total</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Status</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders || []).map(o => (
                <tr key={o.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                  <td className="px-5 py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-navy hover:text-gold transition-colors">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={o.region === 'EU' ? 'tag-eu' : o.region === 'UK' ? 'tag-uk' : 'tag-in'}>{o.region}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-navy">
                    {SYM[o.currency] ?? '€'}{o.total.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${orderStatusClass(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B6B6B]">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent quotes */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDD8CF] flex justify-between items-center">
            <h2 className="font-display font-bold text-navy text-sm">Recent Quotes</h2>
            <Link href="/admin/quotes" className="text-[12.5px] text-gold hover:text-gold-light">View all</Link>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-cream border-b border-[#DDD8CF]">
                <th className="text-left px-5 py-2.5 font-semibold text-navy">Ref</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Contact</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Region</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Status</th>
                <th className="text-left px-3 py-2.5 font-semibold text-navy">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentQuotes || []).map(q => (
                <tr key={q.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                  <td className="px-5 py-2.5">
                    <Link href={`/admin/quotes/${q.id}`} className="font-mono font-medium text-navy hover:text-gold transition-colors">
                      {q.quote_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B6B6B] max-w-[120px] truncate">{q.contact_email}</td>
                  <td className="px-3 py-2.5">
                    <span className={q.region === 'EU' ? 'tag-eu' : q.region === 'UK' ? 'tag-uk' : 'tag-in'}>{q.region}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${quoteStatusClass(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#6B6B6B]">{fmtDate(q.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
