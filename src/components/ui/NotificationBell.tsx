'use client'
import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Package, ShoppingBag, Zap, Clock, Info } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/types/database'
import { cn } from '@/lib/utils/helpers'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  new_order:         { icon: ShoppingBag, color: 'text-blue-600',   bg: 'bg-blue-50'   },
  order_status:      { icon: Package,     color: 'text-purple-600', bg: 'bg-purple-50' },
  delivery_reminder: { icon: Clock,       color: 'text-orange-600', bg: 'bg-orange-50' },
  pickup_reminder:   { icon: Clock,       color: 'text-teal-600',   bg: 'bg-teal-50'   },
  emergency_request: { icon: Zap,         color: 'text-red-600',    bg: 'bg-red-50'    },
  system:            { icon: Info,        color: 'text-gray-600',   bg: 'bg-gray-50'   },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  return `${days}d ago`
}

type Props = { dark?: boolean }

export default function NotificationBell({ dark = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(v => !v)
  }

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markRead([n.id])
    // Navigate based on type
    if (n.data?.vendor_order_id) {
      const isVendor = window.location.pathname.startsWith('/vendor')
      window.location.href = isVendor
        ? `/vendor/orders/${n.data.vendor_order_id}`
        : `/projects/${n.data.project_id || ''}/orders`
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          dark
            ? 'text-white/50 hover:text-white hover:bg-white/8'
            : 'text-[#6B6B6B] hover:text-navy hover:bg-cream'
        )}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 top-full mt-2 w-[360px] rounded-2xl shadow-2xl border overflow-hidden z-50',
          dark ? 'bg-[#0F1117] border-white/10' : 'bg-white border-[#DDD8CF]'
        )}>
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between px-4 py-3.5 border-b',
            dark ? 'border-white/8' : 'border-[#DDD8CF]'
          )}>
            <div className="flex items-center gap-2">
              <h3 className={cn('font-display font-bold text-sm', dark ? 'text-white' : 'text-navy')}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className={cn(
                    'flex items-center gap-1 text-[11.5px] font-medium transition-colors',
                    dark ? 'text-white/40 hover:text-white' : 'text-[#6B6B6B] hover:text-navy'
                  )}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className={cn('p-1 rounded transition-colors', dark ? 'text-white/30 hover:text-white' : 'text-[#6B6B6B] hover:text-navy')}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell size={28} className={dark ? 'text-white/15' : 'text-[#DDD8CF]'} />
                <p className={cn('text-sm', dark ? 'text-white/30' : 'text-[#6B6B6B]')}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg    = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                const Icon   = cfg.icon
                const unread = !n.is_read
                return (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b last:border-0',
                      dark
                        ? `border-white/5 ${unread ? 'bg-white/5 hover:bg-white/8' : 'hover:bg-white/3'}`
                        : `border-[#F0ECE4] ${unread ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-[#F9F6F0]'}`
                    )}>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                      <Icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] leading-snug',
                        dark ? 'text-white' : 'text-navy',
                        unread ? 'font-semibold' : 'font-medium'
                      )}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className={cn('text-[12px] mt-0.5 leading-relaxed line-clamp-2', dark ? 'text-white/40' : 'text-[#6B6B6B]')}>
                          {n.body}
                        </p>
                      )}
                      <p className={cn('text-[11px] mt-1', dark ? 'text-white/25' : 'text-[#9B9B9B]')}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {unread && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
