'use client'
export default function ShowsTicker() {
  const items = [
    '☕ Coffee Machines — from €45/day',
    '📺 65" TV Screens — from €80/day',
    '🛋️ Lounge Sofas — from €60/day',
    '🔊 PA Systems — from €120/day',
    '💡 LED Lightboxes — from €55/day',
    '💻 iPad Kiosks — from €35/day',
    '❄️ Bar Fridges — from €40/day',
    '📡 LED Video Walls — from €400/day',
    '🎤 Microphone Sets — from €25/day',
    '🗄️ Display Shelving — from €20/day',
  ]

  const ticker = [...items, ...items]

  return (
    <div className="bg-navy-light border-b border-white/10 py-2 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {ticker.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-[12px] text-white/60 mx-6 flex-shrink-0">
            {item}
            <span className="text-white/20">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
