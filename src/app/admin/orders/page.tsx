export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Admin — Orders' }

const STATUS: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  delivered: 'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}
const SYM: Record<string, string> = { EUR: '€', GBP: '£', INR: '₹' }

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('id, order_number, status, total, currency, region, created_at, billing_name, venue_id')
    .order('created_at', { ascending: false })

  // Separate venues query to avoid join type issues
  const orders = ordersRaw || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">All Orders</h1>
        <p className="text-[13px] text-[#6B6B6B]">{orders.length} total</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-[#DDD8CF]">
              {['Order', 'Customer', 'Region', 'Total', 'Status', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-navy text-[12.5px]">{o.order_number}</td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{o.billing_name}</td>
                <td className="px-4 py-3">
                  <span className={o.region === 'EU' ? 'tag-eu' : o.region === 'UK' ? 'tag-uk' : 'tag-in'}>{o.region}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{SYM[o.currency] ?? '€'}{o.total.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12px]">{fmtDate(o.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-gold hover:text-gold-light text-[12.5px]">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
