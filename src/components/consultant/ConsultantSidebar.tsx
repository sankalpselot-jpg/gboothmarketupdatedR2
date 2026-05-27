'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FolderOpen, Search, Zap, ShoppingBag,
  User, LogOut, ChevronRight, LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

const navItems = [
  { href: '/projects',          label: 'My Projects',    icon: FolderOpen },
  { href: '/browse',            label: 'Browse Products', icon: Search },
  { href: '/emergency',         label: 'Emergency',       icon: Zap, badge: 'URGENT' },
  { href: '/dashboard',         label: 'Account',         icon: User },
]

type Props = { userName: string; companyName: string }

export default function ConsultantSidebar({ userName, companyName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-[220px] bg-navy flex flex-col min-h-screen sticky top-0 flex-shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9882A" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 014 0v2"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-base">
            Booth<span className="text-gold">Market</span>
          </span>
        </Link>
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Consultant</p>
          <p className="text-[12.5px] font-medium text-white truncate">{companyName || userName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group',
                active
                  ? 'bg-gold/15 text-gold-light'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon size={15} className={active ? 'text-gold-light' : 'text-white/30 group-hover:text-white/60'} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={12} className="text-gold/40" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all w-full text-left">
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
