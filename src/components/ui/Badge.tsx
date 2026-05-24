import { cn } from '@/lib/utils/helpers'

type Variant = 'navy' | 'gold' | 'green' | 'yellow' | 'red' | 'blue' | 'gray'

const variants: Record<Variant, string> = {
  navy:   'bg-navy text-white',
  gold:   'bg-gold text-white',
  green:  'bg-emerald-700 text-white',
  yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  red:    'bg-red-50 text-red-700 border border-red-200',
  blue:   'bg-blue-50 text-blue-700 border border-blue-200',
  gray:   'bg-gray-100 text-gray-600',
}

type Props = {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export default function Badge({ children, variant = 'navy', className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
