export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package, FolderOpen, ShoppingCart, MapPin } from 'lucide-react'
import { fmtDate } from '@/lib/utils/format'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = supabase as any

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user!.id).single()

  // Fix #7 — query vendor_orders not orders
  const { data: vendorOrders } = await db
    .from('vendor_orders')
    .select('id, order_number, status, total, currency, created_at')
    .eq('consultant_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalOrders } = await db
    .from('vendor_orders')
    .select('*', { count: 'exact', head: true })
    .eq('consultant_id', user!.id)

  // Fix #8 — sum vendor_orders for budget used
  const { data: allOrders } = await db
    .from('vendor_orders')
    .select('total, currency')
    .eq('consultant_id', user!.id)
    .not('status', 'eq', 'cancelled')

  const budgetUsed = (allOrders || []).reduce((s: number, o: any) => s + (o.total || 0), 0)

  const { data: projects } = await db
    .from('projects')
    .select('id, name, status, budget, currency')
    .eq('consultant_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  const { count: cartCount } = await supabase
    .from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', user!.id)

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const STATUS_STYLES: Record<string, string> = {
    pending:     'bg-yellow-50 text-yellow-700 border-yellow-200',
    accepted:    'bg-blue-50 text-blue-700 border-blue-200',
    in_production:'bg-purple-50 text-purple-700 border-purple-200',
    packed:      'bg-amber-50 text-amber-700 border-amber-200',
    in_transit:  'bg-orange-50 text-orange-700 border-orange-200',
    delivered:   'bg-teal-50 text-teal-700 border-teal-200',
    completed:   'bg-green-50 text-green-700 border-green-200',
    cancelled:   'bg-red-50 text-red-700 border-red-200',
    draft:       'bg-gray-50 text-gray-600 border-gray-200',
    active:      'bg-blue-50 text-blue-700 border-blue-200',
    ordered:     'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    // Fix #9 — compact layout that fits one screen
    <div className="max-w-[1200px] mx-auto px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-[#6B6B6B] text-sm mt-0.5">{profile?.company_name ?? 'BoothMarket Account'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new" className="bg-navy text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-navy-light transition-colors">
            + New Project
          </Link>
          <Link href="/browse" className="border border-[#DDD8CF] text-navy font-medium px-4 py-2 rounded-lg text-sm hover:border-navy transition-colors">
            Browse
          </Link>
        </div>
      </div>

      {/* Stats row — compact */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { icon: Package,     label: 'Total Orders',  value: totalOrders ?? 0, href: '/projects',         color: 'text-blue-600' },
          { icon: FolderOpen,  label: 'My Projects',   value: projects?.length ?? 0, href: '/projects',    color: 'text-purple-600' },
          { icon: ShoppingCart,label: 'Cart Items',    value: cartCount ?? 0,   href: '/cart',             color: 'text-gold' },
          { icon: MapPin,      label: 'Region',        value: profile?.region ?? '—', href: '/dashboard/profile', color: 'text-green-600' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <s.icon size={18} className={s.color + ' mb-2'} />
            <div className={`font-display font-bold text-xl mb-0.5 ${s.color}`}>{s.value}</div>
            <div className="text-[12px] text-[#6B6B6B]">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent orders — vendor_orders */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DDD8CF] flex justify-between items-center">
            <h2 className="font-display font-bold text-navy text-sm">Recent Orders</h2>
            <Link href="/projects" className="text-[12px] text-gold hover:text-gold-light">View all</Link>
          </div>
          {!vendorOrders?.length ? (
            <div className="p-6 text-center text-[#6B6B6B] text-sm">
              No orders yet. <Link href="/browse" className="text-gold">Browse products →</Link>
            </div>
          ) : (
            <div>
              {vendorOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 border-b border-cream-dark last:border-0">
                  <div>
                    <p className="font-mono font-medium text-navy text-[12.5px]">{o.order_number}</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{fmtDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy text-[13px]">
                      {SYM[o.currency] || '₹'}{o.total?.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[o.status] || ''}`}>
                      {o.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects + Budget */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#DDD8CF] flex justify-between items-center">
              <h2 className="font-display font-bold text-navy text-sm">My Projects</h2>
              <Link href="/projects" className="text-[12px] text-gold hover:text-gold-light">View all</Link>
            </div>
            {!projects?.length ? (
              <div className="p-6 text-center text-[#6B6B6B] text-sm">
                No projects. <Link href="/projects/new" className="text-gold">Create one →</Link>
              </div>
            ) : (
              <div>
                {projects.map((p: any) => (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 border-b border-cream-dark last:border-0 hover:bg-cream/40 transition-colors">
                    <p className="font-medium text-navy text-[13px] truncate flex-1">{p.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ml-2 ${STATUS_STYLES[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Budget summary */}
          <div className="card p-5">
            <h2 className="font-display font-bold text-navy text-sm mb-4">Spend Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6B6B]">Total Spent (all orders)</span>
                <span className="font-display font-bold text-navy">₹{budgetUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6B6B]">Orders placed</span>
                <span className="font-semibold text-navy">{totalOrders ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#6B6B6B]">Active projects</span>
                <span className="font-semibold text-navy">{projects?.filter((p: any) => p.status === 'active' || p.status === 'draft').length ?? 0}</span>
              </div>
              <Link href="/browse"
                className="block w-full text-center bg-cream hover:bg-[#EDE8DF] text-navy font-medium py-2.5 rounded-lg text-sm transition-colors mt-2">
                Browse Products →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
