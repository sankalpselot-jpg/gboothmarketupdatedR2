export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import { fmtDateLong, CURRENCY_SYMBOLS } from '@/lib/utils/format'
import type { Currency } from '@/types/database'

export const metadata: Metadata = { title: 'Order Confirmed' }

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: orderId } = await searchParams
  const supabase = await createClient()

  const { data: order } = orderId
    ? await supabase
        .from('orders')
        .select('*, order_items(product_name, quantity, unit_price, total_price), venues(name, city)')
        .eq('id', orderId)
        .single()
    : { data: null }

  const sym = order ? (CURRENCY_SYMBOLS[order.currency as Currency] || '€') : '€'

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="min-h-screen bg-cream flex items-center justify-center px-10 py-16">
        <div className="w-full max-w-[600px]">

          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-7">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h1 className="font-display font-extrabold text-4xl text-navy text-center mb-3">
            Order Confirmed!
          </h1>
          <p className="text-[#6B6B6B] text-center mb-8 text-[15px] leading-relaxed">
            Your rental order has been placed successfully. A confirmation email has been sent with your invoice.
          </p>

          {order && (
            <div className="card overflow-hidden mb-6">
              <div className="px-6 py-4 bg-cream border-b border-[#DDD8CF] flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold text-navy text-sm">{order.order_number}</p>
                  {order.event_name && (
                    <p className="text-[12.5px] text-[#6B6B6B] mt-0.5">{order.event_name}</p>
                  )}
                </div>
                {order.event_date && (
                  <p className="text-[12.5px] text-[#6B6B6B]">
                    📅 {fmtDateLong(order.event_date)}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="divide-y divide-cream-dark">
                {(order.order_items as any[]).map((item: any, i: number) => (
                  <div key={i} className="px-6 py-3.5 flex justify-between text-sm">
                    <div>
                      <span className="font-medium text-navy">{item.product_name}</span>
                      <span className="text-[#6B6B6B] ml-2">×{item.quantity}</span>
                    </div>
                    <span className="font-medium text-navy">{sym}{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 bg-cream text-sm space-y-1.5">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span><span>{sym}{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Tax</span><span>+{sym}{order.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-navy text-base border-t border-[#DDD8CF] pt-2">
                  <span>Total</span><span>{sym}{order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Venue */}
              {(order.venues as any)?.name && (
                <div className="px-6 py-3.5 border-t border-[#DDD8CF] text-[12.5px] text-[#6B6B6B]">
                  📍 {(order.venues as any).name}, {(order.venues as any).city}
                </div>
              )}
            </div>
          )}

          {/* What happens next */}
          <div className="card p-6 mb-6">
            <h2 className="font-display font-bold text-navy mb-4 text-sm">What happens next?</h2>
            <div className="space-y-3">
              {[
                { step: '1', text: 'You\'ll receive an order confirmation email with your VAT/GST invoice.' },
                { step: '2', text: 'Our regional logistics team will contact you to confirm delivery timings.' },
                { step: '3', text: 'Items are delivered and installed at your venue before the show opens.' },
                { step: '4', text: 'After the show, we return to pack down and collect everything.' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/orders" className="flex-1 btn-primary py-3.5 text-center text-sm">
              View My Orders
            </Link>
            <Link href="/products" className="flex-1 btn-outline py-3.5 text-center text-sm">
              Continue Browsing
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
