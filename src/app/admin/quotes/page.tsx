export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Admin — Quotes' }

const STATUS: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700',
  sent:     'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
  expired:  'bg-gray-100 text-gray-500',
}

export default async function AdminQuotesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, region, contact_name, contact_email, contact_company, event_name, created_at')
    .order('created_at', { ascending: false })

  const pending = (quotes || []).filter(q => q.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Quote Requests</h1>
          {pending > 0 && <p className="text-sm text-gold mt-0.5">{pending} pending your response</p>}
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-[#DDD8CF]">
              {['Ref', 'Contact', 'Company', 'Region', 'Event', 'Status', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(quotes || []).map(q => (
              <tr key={q.id} className={`border-b border-cream-dark hover:bg-cream/40 transition-colors ${q.status === 'pending' ? 'bg-yellow-50/20' : ''}`}>
                <td className="px-4 py-3 font-mono font-semibold text-navy text-[12.5px]">{q.quote_number}</td>
                <td className="px-4 py-3 text-[12.5px]">
                  <p className="font-medium text-navy">{q.contact_name}</p>
                  <p className="text-[#6B6B6B] text-[11.5px]">{q.contact_email}</p>
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{q.contact_company || '—'}</td>
                <td className="px-4 py-3">
                  <span className={q.region === 'EU' ? 'tag-eu' : q.region === 'UK' ? 'tag-uk' : 'tag-in'}>{q.region}</span>
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px] max-w-[140px] truncate">{q.event_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS[q.status] ?? 'bg-gray-100 text-gray-600'}`}>{q.status}</span>
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12px]">{fmtDate(q.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${q.id}`} className="text-gold hover:text-gold-light text-[12.5px]">
                    {q.status === 'pending' ? 'Respond →' : 'View'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
