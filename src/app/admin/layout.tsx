export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin',                label: 'Overview',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/products',       label: 'Products',       icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z' },
  { href: '/admin/orders',         label: 'Orders',         icon: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' },
  { href: '/admin/quotes',         label: 'Quotes',         icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/admin/users',          label: 'Users',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/venues',         label: 'Venues',         icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { href: '/admin/categories',     label: 'Categories',     icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { href: '/admin/exchange-rates', label: 'Exchange Rates', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles').select('role, email').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-cream flex">
      <aside className="w-58 bg-navy flex-shrink-0 flex flex-col min-h-screen sticky top-0" style={{ width: 232 }}>
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-navy-light border border-white/10 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2"/>
              </svg>
            </div>
            <span className="font-display font-bold text-white text-[17px]">
              Booth<span className="text-gold">Market</span>
            </span>
          </Link>
          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/25">Admin Panel</span>
        </div>
        <nav className="p-2.5 flex-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/55 hover:text-white hover:bg-white/8 transition-colors mb-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon}/>
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-[11px] text-white/30 mb-2 truncate">{profile?.email}</p>
          <Link href="/dashboard" className="text-[12px] text-white/40 hover:text-white/70 transition-colors">← Back to Account</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-[#DDD8CF] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <p className="text-sm text-[#6B6B6B]">Admin · <strong className="text-navy">{profile?.email}</strong></p>
          <Link href="/" className="text-[13px] text-gold hover:text-gold-light transition-colors">View Site →</Link>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
