import Link from 'next/link'

type Props = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="card p-16 text-center">
      {icon && <div className="flex justify-center mb-4 text-[#DDD8CF]">{icon}</div>}
      <h3 className="font-display font-bold text-xl text-navy mb-2">{title}</h3>
      {description && <p className="text-[#6B6B6B] text-sm mb-6 max-w-xs mx-auto">{description}</p>}
      {action && (
        <Link href={action.href} className="btn-primary inline-block px-6 py-2.5">
          {action.label}
        </Link>
      )}
    </div>
  )
}
