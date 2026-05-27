'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Truck, Package } from 'lucide-react'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }
const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:     { label: 'Pending',     icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  confirmed:   { label: 'Confirmed',   icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'In Progress', icon: Package,      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  delivered:   { label: 'Delivered',   icon: Truck,        color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200' },
  completed:   { label: 'Completed',   icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  cancelled:   { label: 'Cancelled',   icon: Clock,        color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
}

export default function ProjectOrdersPage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])
  const [project, setProject] = useState<any>(null)
  const [orders,  setOrders]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setOrders((ords || []).map((o: any) => ({
        ...o,
        vendor_profiles: Array.isArray(o.vendor_profiles) ? o.vendor_profiles[0] : o.vendor_profiles,
      })))
      setLoading(false)
    }
    load()
  }, [params.id, db])

  if (loading || !project) return <div className="p-8 text-[#6B6B6B] text-sm">Loading…</div>

  const sym = SYM[project.currency || 'INR']

  return (
    <div className="p-8 max-w-[900px]">
      <Link href={`/projects/${params.id}`} className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Project
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-2">Order Tracking</h1>
      <p className="text-[#6B6B6B] text-sm mb-8">{project.name}</p>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <p className="text-navy font-bold text-lg mb-2">No orders yet</p>
          <p className="text-[#6B6B6B] text-sm mb-5">Add items to your project and checkout to place orders.</p>
          <Link href={`/projects/${params.id}`} className="bg-navy text-white font-bold px-6 py-3 rounded-lg inline-block hover:bg-navy-light transition-colors">
            Go to Project Workspace
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.icon
            const vendor = order.vendor_profiles

            return (
              <div key={order.id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${cfg.bg} border-[#DDD8CF]`}>
                  <div className="flex items-center gap-3">
                    <StatusIcon size={18} className={cfg.color} />
                    <div>
                      <p className="font-display font-bold text-navy text-sm">{vendor?.company_name || 'Vendor'}</p>
                      <p className="text-[11.5px] text-[#6B6B6B] font-mono">{order.order_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">{sym}{order.total.toLocaleString()}</p>
                    <span className={`text-[11px] font-semibold capitalize ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-[#F0ECE4]">
                  {(order.vendor_order_items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-navy">{item.product_name}</p>
                        <p className="text-[11.5px] text-[#6B6B6B]">×{item.quantity} · {item.days} day{item.days !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-[13px] font-medium text-navy">{sym}{item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 bg-[#F9F6F0] flex items-center justify-between text-[12.5px] text-[#6B6B6B]">
                  <span>Delivery: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                  {vendor?.phone && <span>📞 {vendor.phone}</span>}
                  {order.vendor_notes && (
                    <span className="italic">"{order.vendor_notes}"</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 flex justify-between items-center">
            <span className="font-display font-bold text-navy">Total across all vendors</span>
            <span className="font-display font-extrabold text-2xl text-navy">
              {sym}{orders.reduce((s, o) => s + o.total, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
