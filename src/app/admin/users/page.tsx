import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { fmtDate } from '@/lib/utils/format'
import type { UserRole } from '@/types/database'

export const metadata: Metadata = { title: 'Admin — Users' }

const ROLE_STYLES: Record<UserRole, string> = {
  admin:    'bg-navy text-white',
  staff:    'bg-blue-50 text-blue-700',
  customer: 'bg-cream-dark text-[#6B6B6B]',
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles').select('*').order('created_at', { ascending: false })

  const counts = {
    total:    profiles?.length || 0,
    admin:    profiles?.filter(p => p.role === 'admin').length   || 0,
    staff:    profiles?.filter(p => p.role === 'staff').length   || 0,
    customer: profiles?.filter(p => p.role === 'customer').length || 0,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">Users</h1>
        <div className="flex gap-3 text-[13px] text-[#6B6B6B]">
          <span>{counts.total} total</span>
          <span>·</span>
          <span>{counts.admin} admins</span>
          <span>·</span>
          <span>{counts.customer} customers</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users',   value: counts.total,    color: 'text-navy' },
          { label: 'EU Region',     value: profiles?.filter(p => p.region === 'EU').length || 0, color: 'text-blue-600' },
          { label: 'India Region',  value: profiles?.filter(p => p.region === 'IN').length || 0, color: 'text-orange-600' },
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
              {['Name', 'Email', 'Company', 'Region', 'Role', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                <td className="px-4 py-3 font-medium text-navy text-[13px]">{p.full_name || '—'}</td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px] max-w-[180px] truncate">{p.email}</td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{p.company_name || '—'}</td>
                <td className="px-4 py-3">
                  {p.region && (
                    <span className={p.region === 'EU' ? 'tag-eu' : p.region === 'UK' ? 'tag-uk' : 'tag-in'}>
                      {p.region === 'EU' ? '🇪🇺' : p.region === 'UK' ? '🇬🇧' : '🇮🇳'} {p.region}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_STYLES[p.role as UserRole]}`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12px]">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.id}`} className="text-gold hover:text-gold-light text-[12.5px]">
                    Edit →
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
