'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const POPULAR = [
  'Coffee Machine', 'LED Video Wall', '65" TV Screen',
  'Lounge Sofa', 'iPad Kiosk', 'PA System',
]

export default function HeroSection() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/browse?q=${encodeURIComponent(query)}`)
  }

  return (
    <section className="bg-navy relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="relative max-w-[1100px] mx-auto px-8 pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/25 text-gold-light text-[12px] font-semibold px-4 py-1.5 rounded-full mb-7 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-light" />
          B2B Exhibition Rental Marketplace · EU · UK · India
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-[52px] leading-[1.1] text-white mb-5 tracking-tight">
          Rent Furniture & Electronics
          <br />
          <span className="text-gold">for Your Exhibition Booth</span>
        </h1>

        <p className="text-white/60 text-[17px] leading-relaxed mb-10 max-w-[620px] mx-auto">
          Source sofas, TVs, coffee machines, AV equipment, display shelving and more —
          from verified rental vendors across Europe, UK and India.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex max-w-[560px] mx-auto mb-5 shadow-xl">
          <div className="flex-1 flex items-center bg-white rounded-l-xl overflow-hidden border-y border-l border-white">
            <Search size={17} className="ml-4 text-[#6B6B6B] flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Try "65 inch TV" or "coffee machine Frankfurt"…'
              className="flex-1 px-3 py-4 text-[14px] outline-none bg-transparent text-navy placeholder-[#9B9B9B]"
            />
          </div>
          <button type="submit"
            className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-4 rounded-r-xl transition-colors text-sm whitespace-nowrap">
            Search
          </button>
        </form>

        {/* Popular searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="text-white/30 text-[12.5px]">Popular:</span>
          {POPULAR.map(p => (
            <button key={p} onClick={() => router.push(`/browse?q=${encodeURIComponent(p)}`)}
              className="text-[12.5px] bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 pt-8 border-t border-white/10">
          {[
            { value: '500+', label: 'Rental Items' },
            { value: '3',    label: 'Regions' },
            { value: '24h',  label: 'Delivery SLA' },
            { value: '100%', label: 'Verified Vendors' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display font-extrabold text-2xl text-gold-light">{s.value}</p>
              <p className="text-[12px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
