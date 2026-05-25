export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package, FileText, User, ShoppingCart } from 'lucide-react'
import { fmtDate, ORDER_STATUS_STYLES, QUOTE_STATUS_STYLES } from '@/lib/utils/format'
import type { OrderStatus, QuoteStatus } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, currency, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: cartCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="max-w-[1280px] mx-auto px-10 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl text-navy">
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-[#6B6B6B] mt-1">{profile?.company_name ?? 'Your BoothMarket account'}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { icon: Package,      label: 'Total Orders',    value: orders?.length  ?? 0, href: '/dashboard/orders' },
          { icon: FileText,     label: 'Quote Requests',  value: quotes?.length  ?? 0, href: '/dashboard/quotes' },
          { icon: ShoppingCart, label: 'Items in Cart',   value: cartCount       ?? 0, href: '/cart' },
          { icon: User,         label: 'Region',          value: profile?.region ?? 'Not set', href: '/dashboard/profile' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <s.icon className="w-5 h-5 text-gold mb-3" />
            <div className="font-display font-bold text-2xl text-navy mb-0.5">{s.value}</div>
            <div className="text-[13px] text-[#6B6B6B]">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DDD8CF] flex justify-between items-center">
            <h2 className="font-display font-bold text-navy">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-[13px] text-gold hover:text-gold-light">View all</Link>
          </div>
          {!orders?.length ? (
            <div className="p-8 text-center text-[#6B6B6B] text-sm">
              No orders yet.{' '}
              <Link href="/products" className="text-gold">Browse products →</Link>
            </div>
          ) : (
            <div>
              {orders.map(o => {
                const s = ORDER_STATUS_STYLES[o.status as OrderStatus]
                return (
                  <Link key={o.id} href={`/dashboard/orders/${o.id}`}
                    className="flex items-center justify-between px-6 py-3.5 border-b border-cream-dark hover:bg-cream/50 transition-colors last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-medium text-navy text-sm">{o.order_number}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${s.className}`}>{s.label}</span>
                    </div>
                    <span className="text-[12.5px] text-[#6B6B6B]">{fmtDate(o.created_at)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent quotes */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DDD8CF] flex justify-between items-center">
            <h2 className="font-display font-bold text-navy">Quote Requests</h2>
            <Link href="/dashboard/quotes" className="text-[13px] text-gold hover:text-gold-light">View all</Link>
          </div>
          {!quotes?.length ? (
            <div className="p-8 text-center text-[#6B6B6B] text-sm">
              No quotes yet.{' '}
              <Link href="/quote" className="text-gold">Request one →</Link>
            </div>
          ) : (
            <div>
              {quotes.map(q => {
                const s = QUOTE_STATUS_STYLES[q.status as QuoteStatus]
                return (
                  <div key={q.id}
                    className="flex items-center justify-between px-6 py-3.5 border-b border-cream-dark last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-medium text-navy text-sm">{q.quote_number}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${s.className}`}>{s.label}</span>
                    </div>
                    <span className="text-[12.5px] text-[#6B6B6B]">{fmtDate(q.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 card p-6">
        <h2 className="font-display font-bold text-navy mb-4 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary px-5 py-2.5 text-sm">Browse Products</Link>
          <Link href="/quote" className="btn-outline px-5 py-2.5 text-sm">Request a Quote</Link>
          <Link href="/cart" className="btn-outline px-5 py-2.5 text-sm">View Cart</Link>
          <Link href="/dashboard/profile" className="btn-outline px-5 py-2.5 text-sm">Edit Profile</Link>
        </div>
      </div>
    </div>
  )
}
