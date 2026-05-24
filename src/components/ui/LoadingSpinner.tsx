import { cn } from '@/lib/utils/helpers'

type Props = { size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }

export default function LoadingSpinner({ size = 'md', className, label }: Props) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('border-2 border-gold border-t-transparent rounded-full animate-spin', sizes[size])} />
      {label && <p className="text-[13px] text-[#6B6B6B]">{label}</p>}
    </div>
  )
}
