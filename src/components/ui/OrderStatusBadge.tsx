import { ORDER_STATUS_STYLES } from '@/lib/utils/format'
import type { OrderStatus } from '@/types/database'

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${s.className}`}>
      {s.label}
    </span>
  )
}
