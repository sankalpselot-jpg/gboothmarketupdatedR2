export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate } from '@/lib/utils/format'
import type { UserRole } from '@/types/database'

export const metadata: Metadata = { title: 'Admin — Users' }

const ROLE_STYLES: Record<string, string> = {
  admin:      'bg-navy text-white',
  staff:      'bg-blue-50 text-blue-700',
  customer:   'bg-cream-dark text-[#6B6B6B]',
}
const TYPE_STYLES: Record<string, string> = {
  vendor:     'bg-gold/15 text-gold border border-gold/30',
  consultant: 'bg-blue-50 text-blue-700',
  admin:      'bg-navy/10 text-navy',
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles').select('*').order('created_at', { ascending: false })

  const all    = profiles || []
  const counts = {
    total:      all.length,
    vendors:    all.filter(p => (p as any).user_type === 'vendor').length,
    consultants:all.filter(p => (p as any).user_type === 'consultant').length,
    admins:     all.filter(p => p.role === 'admin').length,
    active:     all.length, // all are active unless suspended
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Users</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Manage all platform users</p>
        </div>
        <Link href="/admin/users/new"
          className="bg-navy text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-navy-light transition-colors">
          + Add User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',    value: counts.total,       color: 'text-navy' },
          { label: 'Vendors',        value: counts.vendors,     color: 'text-gold' },
          { label: 'Consultants',    value: counts.consultants, color: 'text-blue-600' },
          { label: 'Admins',         value: counts.admins,      color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-[12px] text-[#6B6B6B] mb-1">{s.label}</p>
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-[#DDD8CF]">
              {['Name', 'Email', 'Company', 'Type', 'Role', 'Region', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map(p => (
              <tr key={p.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                <td className="px-4 py-3 font-medium text-navy text-[13px]">{p.full_name || '—'}</td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px] max-w-[180px] truncate">{p.email}</td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{p.company_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[(p as any).user_type || 'consultant'] || ''}`}>
                    {(p as any).user_type || 'consultant'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[p.role as UserRole] || ''}`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.region && (
                    <span className={p.region === 'EU' ? 'tag-eu' : p.region === 'UK' ? 'tag-uk' : 'tag-in'}>
                      {p.region === 'EU' ? '🇪🇺' : p.region === 'UK' ? '🇬🇧' : '🇮🇳'} {p.region}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12px]">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.id}`} className="text-gold hover:text-gold-light text-[12.5px]">
                    Manage →
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
