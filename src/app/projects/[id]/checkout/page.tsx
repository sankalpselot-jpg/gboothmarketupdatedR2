'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Lock, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }

export default function ProjectCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [project,       setProject]       = useState<any>(null)
  const [cartItems,     setCartItems]     = useState<any[]>([])
  const [vendorGroups,  setVendorGroups]  = useState<any[]>([])
  const [paymentTerms,  setPaymentTerms]  = useState<any>(null)
  const [placing,       setPlacing]       = useState(false)
  const [done,          setDone]          = useState(false)
  const [depositMode,   setDepositMode]   = useState(false) // false = full, true = deposit
  const [form, setForm] = useState({ delivery_address: '', notes: '' })

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
        const vp  = Array.isArray(item.vendor_products.vendor_profiles)
          ? item.vendor_products.vendor_profiles[0]
          : item.vendor_products.vendor_profiles
        const vid = item.vendor_id
        if (!groups[vid]) {
          groups[vid] = { vendor_id: vid, vendor_name: vp?.company_name || 'Vendor', items: [], subtotal: 0 }
        }
        groups[vid].items.push({ ...item, vendor_product: item.vendor_products })
        groups[vid].subtotal += item.total_price
      }
      setVendorGroups(Object.values(groups))

      // Check if consultant has approved payment terms
      const { data: { user } } = await db.auth.getUser()
      if (user) {
        const { data: pt } = await db.from('payment_terms').select('*').eq('consultant_id', user.id).single()
        setPaymentTerms(pt)
        if (pt?.deposit_pct < 100) setDepositMode(true) // default to deposit if they have terms
      }
    }
    load()
  }, [params.id, db])

  const handleCheckout = async () => {
    setPlacing(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const depositPct = depositMode && paymentTerms ? paymentTerms.deposit_pct : 100

    try {
      for (const group of vendorGroups) {
        const depositAmt  = Math.round(group.subtotal * depositPct / 100 * 100) / 100
        const balanceAmt  = group.subtotal - depositAmt
        const dueDate     = project.start_date
          ? new Date(new Date(project.start_date).getTime() - 7 * 86400000).toISOString().split('T')[0]
          : null

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
          deposit_pct:      depositPct,
          deposit_paid:     depositPct === 100,
          deposit_amount:   depositAmt,
          balance_amount:   balanceAmt,
          balance_due_date: balanceAmt > 0 ? dueDate : null,
        }).select().single()

        if (orderErr) throw orderErr

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

        // Notify vendor
        await fetch('/api/notifications', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            vendor_order_id: order.id,
            type:            'new_order',
          }),
        }).catch(() => {}) // non-blocking
      }

      await db.from('projects').update({ status: 'ordered' }).eq('id', params.id)
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
  const depositPct = depositMode && paymentTerms ? paymentTerms.deposit_pct : 100
  const depositAmt = Math.round(total * depositPct / 100 * 100) / 100
  const balanceAmt = total - depositAmt

  if (done) return (
    <div className="p-8 max-w-[600px] mx-auto text-center mt-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-navy mb-3">Orders Placed!</h1>
      <p className="text-[#6B6B6B] mb-2">Your orders have been sent to {vendorGroups.length} vendor{vendorGroups.length !== 1 ? 's' : ''}.</p>
      {depositMode && paymentTerms && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 my-5 text-left">
          <p className="text-[13px] font-semibold text-blue-800 mb-1">Payment Schedule</p>
          <p className="text-[12.5px] text-blue-700">Deposit ({depositPct}%): {sym}{depositAmt.toLocaleString()} — due now</p>
          <p className="text-[12.5px] text-blue-700">Balance ({100 - depositPct}%): {sym}{balanceAmt.toLocaleString()} — due 7 days before event</p>
        </div>
      )}
      <div className="flex gap-3 justify-center mt-6">
        <Link href={`/projects/${params.id}/orders`} className="bg-navy text-white font-bold px-6 py-3 rounded-lg hover:bg-navy-light transition-colors">Track Orders</Link>
        <Link href="/projects" className="border-[1.5px] border-[#DDD8CF] text-[#6B6B6B] font-medium px-6 py-3 rounded-lg hover:border-navy hover:text-navy transition-colors">Back to Projects</Link>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-[960px]">
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
                  <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center text-white text-[11px] font-bold">{i + 1}</div>
                  <span className="font-display font-bold text-navy text-sm">{group.vendor_name}</span>
                </div>
                <span className="font-semibold text-navy">{sym}{group.subtotal.toLocaleString()}</span>
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

          {/* Delivery */}
          <div className="bg-white border border-[#DDD8CF] rounded-xl p-6">
            <h2 className="font-display font-bold text-navy mb-5">Delivery Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">Delivery Address / Hall Number</label>
                <textarea value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                  className="w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy resize-none min-h-[80px]"
                  placeholder={`${project.venue ? project.venue + ', ' : ''}Hall number, stand number…`} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">Notes for Vendors</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border-[1.5px] border-[#DDD8CF] rounded-lg px-4 py-3 text-sm outline-none focus:border-navy resize-none min-h-[80px]"
                  placeholder="Setup timing, access restrictions, on-site contact…" />
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

            {/* Payment options */}
            {paymentTerms && paymentTerms.deposit_pct < 100 && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Payment Option</p>
                <button onClick={() => setDepositMode(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border-[1.5px] text-sm transition-all ${!depositMode ? 'border-navy bg-navy/5' : 'border-[#DDD8CF] hover:border-navy'}`}>
                  <div className="text-left">
                    <p className="font-semibold text-navy text-[13px]">Full Payment</p>
                    <p className="text-[11.5px] text-[#6B6B6B]">Pay 100% now</p>
                  </div>
                  <span className="font-bold text-navy">{sym}{total.toLocaleString()}</span>
                </button>
                <button onClick={() => setDepositMode(true)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border-[1.5px] text-sm transition-all ${depositMode ? 'border-navy bg-navy/5' : 'border-[#DDD8CF] hover:border-navy'}`}>
                  <div className="text-left">
                    <p className="font-semibold text-navy text-[13px]">Deposit ({paymentTerms.deposit_pct}%)</p>
                    <p className="text-[11.5px] text-[#6B6B6B]">Balance 7 days before event</p>
                  </div>
                  <span className="font-bold text-gold">{sym}{depositAmt.toLocaleString()}</span>
                </button>
              </div>
            )}

            {depositMode && paymentTerms && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3 text-[12px] text-blue-800">
                <p className="font-semibold mb-0.5">Deposit ({depositPct}%): {sym}{depositAmt.toLocaleString()}</p>
                <p className="text-blue-600">Balance: {sym}{balanceAmt.toLocaleString()} due 7 days before event</p>
              </div>
            )}

            <div className="flex items-center gap-2 bg-cream border border-[#DDD8CF] rounded-lg p-3 mt-4 mb-4">
              <Lock size={13} className="text-[#6B6B6B] flex-shrink-0" />
              <p className="text-[11.5px] text-[#6B6B6B]">Each vendor receives their own separate order</p>
            </div>

            <button onClick={handleCheckout} disabled={placing || cartItems.length === 0}
              className="w-full bg-navy hover:bg-gold text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
              {placing ? 'Placing Orders…' : depositMode && paymentTerms
                ? `Pay Deposit ${sym}${depositAmt.toLocaleString()}`
                : `Place ${vendorGroups.length} Order${vendorGroups.length !== 1 ? 's' : ''}`}
            </button>

            {!paymentTerms && (
              <p className="text-[11px] text-[#6B6B6B] text-center mt-2">
                Complete 3 projects to unlock deposit payment options
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
