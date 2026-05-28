import { Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import type { ExtendedOrderStatus } from '@/types/database'

export const ORDER_STATUSES: {
  id: ExtendedOrderStatus
  label: string
  desc:  string
  color: string
  bg:    string
  dot:   string
}[] = [
  { id: 'pending',       label: 'Pending',       desc: 'Awaiting vendor confirmation',  color: 'text-gray-500',   bg: 'bg-gray-100',    dot: 'bg-gray-400'   },
  { id: 'quote_sent',    label: 'Quote Sent',     desc: 'Vendor has reviewed the order', color: 'text-blue-600',   bg: 'bg-blue-50',     dot: 'bg-blue-500'   },
  { id: 'accepted',      label: 'Accepted',       desc: 'Order confirmed by vendor',     color: 'text-indigo-600', bg: 'bg-indigo-50',   dot: 'bg-indigo-500' },
  { id: 'in_production', label: 'In Production',  desc: 'Items being prepared',          color: 'text-purple-600', bg: 'bg-purple-50',   dot: 'bg-purple-500' },
  { id: 'packed',        label: 'Packed',         desc: 'Ready for dispatch',            color: 'text-amber-600',  bg: 'bg-amber-50',    dot: 'bg-amber-500'  },
  { id: 'in_transit',    label: 'In Transit',     desc: 'On the way to venue',           color: 'text-orange-600', bg: 'bg-orange-50',   dot: 'bg-orange-500' },
  { id: 'delivered',     label: 'Delivered',      desc: 'Delivered to venue',            color: 'text-teal-600',   bg: 'bg-teal-50',     dot: 'bg-teal-500'   },
  { id: 'completed',     label: 'Completed',      desc: 'Event complete, items returned', color: 'text-green-600', bg: 'bg-green-50',    dot: 'bg-green-500'  },
  { id: 'cancelled',     label: 'Cancelled',      desc: 'Order cancelled',               color: 'text-red-600',    bg: 'bg-red-50',      dot: 'bg-red-500'    },
]

const FLOW_STATUSES = ORDER_STATUSES.filter(s => s.id !== 'cancelled')

type HistoryItem = {
  status:     string
  note:       string | null
  created_at: string
}

type Props = {
  currentStatus: ExtendedOrderStatus
  history?:      HistoryItem[]
  dark?:         boolean
  compact?:      boolean
}

export default function OrderTimeline({ currentStatus, history = [], dark = false, compact = false }: Props) {
  const isCancelled = currentStatus === 'cancelled'
  const currentIdx  = FLOW_STATUSES.findIndex(s => s.id === currentStatus)
  const statuses    = isCancelled ? ORDER_STATUSES : FLOW_STATUSES

  const textMuted  = dark ? 'text-white/40' : 'text-[#6B6B6B]'
  const textMain   = dark ? 'text-white'    : 'text-navy'
  const borderCol  = dark ? 'border-white/8' : 'border-[#DDD8CF]'
  const bgCard     = dark ? 'bg-white/5'    : 'bg-[#F9F6F0]'

  if (compact) {
    // Horizontal compact bar
    return (
      <div className="flex items-center gap-0 overflow-x-auto py-2">
        {FLOW_STATUSES.map((s, i) => {
          const done    = !isCancelled && i <= currentIdx
          const current = s.id === currentStatus
          return (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                  done && !current ? 'bg-green-500 border-green-500' :
                  current          ? 'bg-navy border-navy' :
                                     dark ? 'bg-white/5 border-white/15' : 'bg-white border-[#DDD8CF]'
                )}>
                  {done && !current
                    ? <Check size={12} className="text-white" />
                    : current
                      ? <div className="w-2 h-2 rounded-full bg-white" />
                      : <div className={cn('w-2 h-2 rounded-full', dark ? 'bg-white/20' : 'bg-[#DDD8CF]')} />
                  }
                </div>
                <span className={cn(
                  'text-[9px] font-medium whitespace-nowrap',
                  current ? (dark ? 'text-white' : 'text-navy') : textMuted
                )}>{s.label}</span>
              </div>
              {i < FLOW_STATUSES.length - 1 && (
                <div className={cn(
                  'h-0.5 w-8 -mt-4 mx-0.5',
                  i < currentIdx ? 'bg-green-500' : dark ? 'bg-white/10' : 'bg-[#DDD8CF]'
                )} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Full vertical timeline
  return (
    <div className="space-y-0">
      {history.length > 0 ? (
        // Show actual history
        <div className="relative">
          {history.map((h, i) => {
            const cfg = ORDER_STATUSES.find(s => s.id === h.status)
            const isLast = i === 0
            return (
              <div key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 z-10',
                    isLast
                      ? 'bg-navy border-navy'
                      : dark ? 'bg-white/10 border-white/20' : 'bg-white border-[#DDD8CF]'
                  )}>
                    {isLast
                      ? <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      : <Check size={13} className={dark ? 'text-white/40' : 'text-[#DDD8CF]'} />
                    }
                  </div>
                  {i < history.length - 1 && (
                    <div className={cn('w-0.5 flex-1 mt-1', dark ? 'bg-white/10' : 'bg-[#DDD8CF]')} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('text-[13.5px] font-semibold', textMain)}>
                      {cfg?.label || h.status}
                    </span>
                    <span className={cn('text-[11px] flex-shrink-0', textMuted)}>
                      {new Date(h.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {h.note && (
                    <p className={cn('text-[12.5px] mt-1 leading-relaxed', textMuted)}>{h.note}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Show status steps
        <div>
          {FLOW_STATUSES.map((s, i) => {
            const done    = !isCancelled && i < currentIdx
            const current = s.id === currentStatus
            const future  = !isCancelled && i > currentIdx

            return (
              <div key={s.id} className="flex gap-4 pb-4 last:pb-0 relative">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all',
                    done    ? 'bg-green-500 border-green-500' :
                    current ? 'bg-navy border-navy' :
                    dark    ? 'bg-white/5 border-white/10' : 'bg-white border-[#DDD8CF]'
                  )}>
                    {done
                      ? <Check size={14} className="text-white" />
                      : current
                        ? <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                        : <div className={cn('w-2.5 h-2.5 rounded-full', dark ? 'bg-white/15' : 'bg-[#DDD8CF]')} />
                    }
                  </div>
                  {i < FLOW_STATUSES.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-8 mt-1',
                      done ? 'bg-green-400' : dark ? 'bg-white/8' : 'bg-[#EDE8DF]'
                    )} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className={cn(
                    'text-[13px] font-semibold',
                    done    ? 'text-green-600' :
                    current ? (dark ? 'text-white' : 'text-navy') :
                    future  ? textMuted : textMuted
                  )}>
                    {s.label}
                    {current && (
                      <span className={cn(
                        'ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full',
                        dark ? 'bg-gold/20 text-gold-light' : 'bg-navy text-white'
                      )}>Current</span>
                    )}
                  </p>
                  <p className={cn('text-[12px] mt-0.5', future ? (dark ? 'text-white/20' : 'text-[#C0BBB0]') : textMuted)}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
