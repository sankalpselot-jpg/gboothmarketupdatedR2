'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingBag, Zap,
  BarChart3, Wallet, LogOut, ChevronRight, Store
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import NotificationBell from '@/components/ui/NotificationBell'
import { useNotifications } from '@/hooks/useNotifications'

const navItems = [
  { href: '/vendor/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/vendor/products',   label: 'My Products', icon: Package },
  { href: '/vendor/orders',     label: 'Orders',      icon: ShoppingBag },
  { href: '/vendor/emergency',  label: 'Emergency',   icon: Zap, badge: 'LIVE' },
  { href: '/vendor/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/vendor/payouts',    label: 'Payouts',     icon: Wallet },
]

type Props = { userName: string; companyName: string }

export default function VendorSidebar({ userName, companyName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { unreadCount } = useNotifications()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-[240px] bg-[#0A0D14] border-r border-white/5 flex flex-col min-h-screen sticky top-0 flex-shrink-0">
      {/* Logo + notification bell */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center">
              <Store size={16} className="text-gold-light" />
            </div>
            <span className="font-display font-bold text-white text-base">
              Booth<span className="text-gold">Market</span>
            </span>
          </Link>
          <NotificationBell dark />
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-2.5">
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Vendor Portal</p>
          <p className="text-[13px] font-medium text-white truncate">{companyName || userName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          const showOrderBadge = item.href === '/vendor/orders' && unreadCount > 0
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group',
                active
                  ? 'bg-gold/15 text-gold-light'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}>
              <item.icon size={16} className={active ? 'text-gold-light' : 'text-white/40 group-hover:text-white/70'} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
              {showOrderBadge && (
                <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  {unreadCount}
                </span>
              )}
              {active && <ChevronRight size={12} className="text-gold/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link href="/vendor/onboarding"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <Store size={15} /> Store Settings
        </Link>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all w-full text-left">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
