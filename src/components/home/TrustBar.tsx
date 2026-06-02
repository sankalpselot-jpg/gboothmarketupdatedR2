export default function TrustBar() {
  const items = [
    { icon: '✅', label: 'Condition-Verified Inventory' },
    { icon: '🚚', label: 'Delivery SLA on Every Order' },
    { icon: '🔁', label: 'Replacement Guarantee' },
    { icon: '📞', label: 'On-site Support Available' },
    { icon: '💳', label: 'Deposit Payment Options' },
    { icon: '🌍', label: 'EU · UK · India Coverage' },
  ]
  return (
    <div className="bg-navy border-b border-white/5 py-3.5">
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[14px]">{item.icon}</span>
              <span className="text-[12px] font-medium text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
