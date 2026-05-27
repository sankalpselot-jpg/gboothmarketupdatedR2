'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Package, ShoppingBag, TrendingUp, Zap, Plus, ArrowRight, Clock } from 'lucide-react'

type Stats = { products: number; orders: number; revenue: number; pending: number; emergency: number }
type Order = { id: string; order_number: string; status: string; total: number; currency: string; created_at: string }

const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
  completed:   'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled:   'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function VendorDashboardPage() {
  const db = useMemo(() => createClient() as any, [])
  const [stats,  setStats]  = useState<Stats>({ products: 0, orders: 0, revenue: 0, pending: 0, emergency: 0 })
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return

      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      setVendorId(vp.id)

      const [
        { count: productCount },
        { data: ordersData },
        { count: emergencyCount },
      ] = await Promise.all([
        db.from('vendor_products').select('*', { count: 'exact', head: true }).eq('vendor_id', vp.id).eq('is_active', true),
        db.from('vendor_orders').select('id, order_number, status, total, currency, created_at').eq('vendor_id', vp.id).order('created_at', { ascending: false }).limit(6),
        db.from('emergency_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ])

      const allOrders: Order[] = ordersData || []
      const revenue = allOrders.filter(o => o.status === 'completed').reduce((s: number, o: Order) => s + o.total, 0)
      const pending = allOrders.filter(o => o.status === 'pending').length

      setStats({ products: productCount || 0, orders: allOrders.length, revenue, pending, emergency: emergencyCount || 0 })
      setOrders(allOrders)
      setLoading(false)
    }
    load()
  }, [db])

  const statCards = [
    { label: 'Active Products',    value: stats.products, icon: Package,     color: 'text-blue-400',   href: '/vendor/products' },
    { label: 'Total Orders',       value: stats.orders,   icon: ShoppingBag, color: 'text-purple-400', href: '/vendor/orders' },
    { label: 'Revenue (Completed)', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', href: '/vendor/analytics' },
    { label: 'Pending Orders',     value: stats.pending,  icon: Clock,       color: 'text-yellow-400', href: '/vendor/orders' },
  ]

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Overview of your rental business</p>
        </div>
        <Link href="/vendor/products/new"
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white/5 border border-white/8 rounded-xl p-5 hover:bg-white/8 hover:border-white/15 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <s.icon size={18} className={s.color} />
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <p className={`font-display font-extrabold text-2xl mb-1 ${s.color}`}>{loading ? '…' : s.value}</p>
            <p className="text-[12px] text-white/40">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Emergency alert */}
      {stats.emergency > 0 && (
        <Link href="/vendor/emergency"
          className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 hover:bg-red-500/15 transition-colors">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-300">{stats.emergency} Emergency Request{stats.emergency > 1 ? 's' : ''} Open</p>
            <p className="text-[12px] text-red-400/60">Urgent requirements from consultants — respond quickly to secure business</p>
          </div>
          <ArrowRight size={16} className="text-red-400/60" />
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="font-display font-bold text-white text-sm">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-[12px] text-gold-light hover:text-gold transition-colors">View all →</Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/30 text-sm">No orders yet</p>
              <p className="text-white/20 text-[12px] mt-1">Orders will appear when consultants checkout</p>
            </div>
          ) : (
            <div>
              {orders.map(o => (
                <Link key={o.id} href={`/vendor/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
                  <div>
                    <p className="text-[13px] font-mono font-medium text-white">{o.order_number}</p>
                    <p className="text-[11.5px] text-white/30 mt-0.5">
                      {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-white">
                      {o.currency === 'INR' ? '₹' : o.currency === 'GBP' ? '£' : '€'}{o.total.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-white text-sm mb-4">Quick Actions</h2>
          {[
            { href: '/vendor/products/new', icon: Package,     label: 'Add a new product',       sub: 'List items with photos, pricing and availability' },
            { href: '/vendor/orders',       icon: ShoppingBag, label: 'Manage orders',           sub: 'Confirm, update and track deliveries' },
            { href: '/vendor/emergency',    icon: Zap,         label: 'Check emergency requests', sub: 'Urgent requirements from consultants' },
            { href: '/vendor/analytics',    icon: TrendingUp,  label: 'View analytics',          sub: 'Revenue, utilisation and top items' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-xl p-4 hover:bg-white/8 hover:border-white/15 transition-all group">
              <div className="w-10 h-10 bg-white/8 rounded-lg flex items-center justify-center flex-shrink-0">
                <a.icon size={18} className="text-white/50 group-hover:text-gold-light transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-white">{a.label}</p>
                <p className="text-[12px] text-white/30 mt-0.5 truncate">{a.sub}</p>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
