export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate, QUOTE_STATUS_STYLES } from '@/lib/utils/format'
import type { QuoteStatus } from '@/types/database'

export const metadata: Metadata = { title: 'My Quotes' }

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, region, currency, event_name, event_date, quoted_amount, created_at, venue_id')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1280px] mx-auto px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard" className="text-[13px] text-gold hover:text-gold-light mb-1 block">
            ← Dashboard
          </Link>
          <h1 className="font-display font-extrabold text-3xl text-navy">Quote Requests</h1>
        </div>
        <Link href="/quote" className="btn-primary px-5 py-2.5 text-sm">+ New Quote</Link>
      </div>

      {!quotes?.length ? (
        <div className="card p-16 text-center">
          <svg className="w-14 h-14 mx-auto mb-4 text-[#DDD8CF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h2 className="font-display font-bold text-xl text-navy mb-2">No quote requests yet</h2>
          <p className="text-[#6B6B6B] mb-6">Need a custom price for a large or complex order?</p>
          <Link href="/quote" className="btn-primary inline-block">Request a Quote</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#DDD8CF] bg-cream">
                {['Reference', 'Event', 'Region', 'Quoted Amount', 'Status', 'Submitted'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => {
                const s = QUOTE_STATUS_STYLES[q.status as QuoteStatus]
                const sym = q.currency === 'GBP' ? '£' : q.currency === 'INR' ? '₹' : '€'
                return (
                  <tr key={q.id} className="border-b border-cream-dark hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-navy text-[13px]">{q.quote_number}</td>
                    <td className="px-5 py-4 text-[#6B6B6B] max-w-[160px] truncate">{q.event_name || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={q.region === 'EU' ? 'tag-eu' : q.region === 'UK' ? 'tag-uk' : 'tag-in'}>
                        {q.region === 'EU' ? '🇪🇺' : q.region === 'UK' ? '🇬🇧' : '🇮🇳'} {q.region}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-navy">
                      {q.quoted_amount ? `${sym}${q.quoted_amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${s?.className ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {s?.label ?? q.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#6B6B6B] text-[12.5px] whitespace-nowrap">
                      {fmtDate(q.created_at)}
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
