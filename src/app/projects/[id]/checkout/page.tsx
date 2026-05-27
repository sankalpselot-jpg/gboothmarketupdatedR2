'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function ProjectCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [project,   setProject]   = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [vendorGroups, setVendorGroups] = useState<any[]>([])
  const [placing, setPlacing]  = useState(false)
  const [done,    setDone]     = useState(false)
  const [form, setForm] = useState({
    delivery_address: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await db.from('projects').select('*').eq('id', params.id).single()
      if (!proj) return
      setProject(proj)

      const { data: items } = await db.from('project_items')
        .select('*, vendor_products(*, vendor_profiles(*), product_images(*))')
        .eq('project_id', params.id)

      if (!items) return
      setCartItems(items)

      // Group by vendor
      const groups: Record<string, any> = {}
      for (const item of items) {
        const vp = Array.isArray(item.vendor_products.vendor_profiles)
          ? item.vendor_products.vendor_profiles[0]
          : item.vendor_products.vendor_profiles
        const vid = item.vendor_id
        if (!groups[vid]) {
          groups[vid] = {
            vendor_id:    vid,
            vendor_name:  vp?.company_name || 'Unknown Vendor',
            items:        [],
            subtotal:     0,
          }
        }
        groups[vid].items.push({ ...item, vendor_product: item.vendor_products })
        groups[vid].subtotal += item.total_price
      }
      setVendorGroups(Object.values(groups))
    }
    load()
  }, [params.id, db])

  const handleCheckout = async () => {
    setPlacing(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    try {
      for (const group of vendorGroups) {
        // Create vendor order
        const { data: order, error: orderErr } = await db.from('vendor_orders').insert({
          project_id:       params.id,
          consultant_id:    user.id,
          vendor_id:        group.vendor_id,
          status:           'pending',
          subtotal:         group.subtotal,
          tax_amount:       0,
          total:            group.subtotal,
          currency:         project.currency || 'INR',
          delivery_address: form.delivery_address || null,
          delivery_date:    project.start_date    || null,
          notes:            form.notes            || null,
        }).select().single()

        if (orderErr) throw orderErr

        // Create order items
        for (const item of group.items) {
          await db.from('vendor_order_items').insert({
            vendor_order_id:   order.id,
            vendor_product_id: item.vendor_product_id,
            product_name:      item.vendor_product.name,
            quantity:          item.quantity,
            days:              item.days,
            unit_price:        item.unit_price,
            total_price:       item.total_price,
          })
        }
      }

      // Update project status
      await db.from('projects').update({ status: 'ordered' }).eq('id', params.id)
      // Clear project items
      await db.from('project_items').delete().eq('project_id', params.id)

      setDone(true)
      toast.success('Orders placed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to place orders')
      setPlacing(false)
    }
  }

  if (!project) return <div className="p-8 text-[#6B6B6B] text-sm">Loading…</div>

  const sym      = SYM[project.currency || 'INR']
  const total    = vendorGroups.reduce((s, g) => s + g.subtotal, 0)

  if (done) return (
    <div className="p-8 max-w-[600px] mx-auto text-center mt-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-navy mb-3">Orders Placed!</h1>
      <p className="text-[#6B6B6B] mb-2">Your orders have been sent to {vendorGroups.length} vendor{vendorGroups.length !== 1 ? 's' : ''}.</p>
      <p className="text-[#6B6B6B] text-sm mb-8">Each vendor will confirm and provide delivery details.</p>
      <div className="flex gap-3 justify-center">
        <Link href={`/projects/${params.id}/orders`}
          className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-navy-light transition-colors">
          Track Orders
        </Link>
        <Link href="/projects"
          className="border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium px-6 py-3 rounded-lg hover:border-navy hover:text-navy transition-colors">
          Back to Projects
        </Link>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-[900px]">
      <Link href={`/projects/${params.id}`} className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Project
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-8">Checkout — {project.name}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          {/* Vendor groups */}
          {vendorGroups.map((group, i) => (
            <div key={group.vendor_id} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-[#F9F6F0] border-b border-[#DDD8CF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{i + 1}</div>
                  <span className="font-display font-bold text-navy text-sm">{group.vendor_name}</span>
                </div>
                <span className="text-[12.5px] font-semibold text-navy">{sym}{group.subtotal.toLocaleString()}</span>
              </div>
              <div className="divide-y divide-[#F0ECE4]">
                {group.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-[13px] font-medium text-navy">{item.vendor_product.name}</p>
                      <p className="text-[11.5px] text-[#6B6B6B]">×{item.quantity} · {item.days} day{item.days !== 1 ? 's' : ''} · {sym}{item.unit_price.toLocaleString()}/day</p>
                    </div>
                    <span className="font-semibold text-navy text-sm">{sym}{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Delivery info */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
            <h2 className="font-display font-bold text-navy mb-5">Delivery Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">Delivery Address / Hall Number</label>
                <textarea
                  value={form.delivery_address}
                  onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                  className="w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors resize-none min-h-[80px]"
                  placeholder={`${project.venue ? project.venue + ', ' : ''}Hall number, stand number, special instructions…`}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">Additional Notes for Vendors</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy transition-colors resize-none min-h-[80px]"
                  placeholder="Setup timing, access restrictions, contact on site…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-5 sticky top-24">
            <h2 className="font-display font-bold text-navy mb-4">Order Summary</h2>
            {vendorGroups.map(g => (
              <div key={g.vendor_id} className="flex justify-between text-[13px] mb-2">
                <span className="text-[#6B6B6B] truncate mr-2">{g.vendor_name}</span>
                <span className="font-medium text-navy flex-shrink-0">{sym}{g.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-navy text-base border-t border-[#DDD8CF] pt-3 mt-3">
              <span>Total</span>
              <span>{sym}{total.toLocaleString()}</span>
            </div>
            <p className="text-[11.5px] text-[#6B6B6B] mt-2 mb-5">
              Split into {vendorGroups.length} order{vendorGroups.length !== 1 ? 's' : ''}, one per vendor
            </p>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <Lock size={13} className="text-blue-500 flex-shrink-0" />
              <p className="text-[11.5px] text-blue-700">Each vendor receives their own order separately</p>
            </div>
            <button onClick={handleCheckout} disabled={placing || cartItems.length === 0}
              className="w-full bg-navy hover:bg-gold text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
              {placing ? 'Placing Orders…' : `Place ${vendorGroups.length} Order${vendorGroups.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
