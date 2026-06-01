'use client'
import { useState } from 'react'
import {
  Search, MapPin, Phone, Globe, Star,
  Mail, ExternalLink, X, ChevronRight,
  Building2, Loader2, Info
} from 'lucide-react'
import Link from 'next/link'

const PRESET_CITIES = [
  { label: '🇮🇳 New Delhi',    query: 'exhibition booth rental New Delhi India' },
  { label: '🇮🇳 Mumbai',       query: 'exhibition booth rental Mumbai India' },
  { label: '🇮🇳 Bengaluru',    query: 'exhibition booth rental Bengaluru India' },
  { label: '🇮🇳 Hyderabad',    query: 'exhibition booth rental Hyderabad India' },
  { label: '🇩🇪 Frankfurt',    query: 'Messebau exhibition stand rental Frankfurt Germany' },
  { label: '🇩🇪 Düsseldorf',   query: 'exhibition stand builder rental Düsseldorf Germany' },
  { label: '🇬🇧 London',       query: 'exhibition booth rental London UK' },
  { label: '🇳🇱 Amsterdam',    query: 'exhibition stand rental Amsterdam Netherlands' },
  { label: '🇫🇷 Paris',        query: 'location stand exposition Paris France' },
  { label: '🇪🇸 Barcelona',    query: 'exhibition stand rental Barcelona Spain' },
]

type Vendor = {
  place_id:     string
  name:         string
  address:      string
  phone:        string | null
  website:      string | null
  rating:       number | null
  review_count: number
  is_open:      boolean | null
  maps_url:     string
  photos:       { url: string; ref: string }[]
  types:        string[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-[12px] text-[#6B6B6B] ml-0.5">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function FindVendorsPage() {
  const [search,   setSearch]   = useState('')
  const [results,  setResults]  = useState<Vendor[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [queryUsed, setQueryUsed] = useState('')
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const doSearch = async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(false)
    setResults([])
    setSelected(null)
    try {
      const res  = await fetch(`/api/places?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data.results || [])
      setQueryUsed(data.query || query)
    } catch (err: any) {
      console.error(err)
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(search)
  }

  const getInviteBody = (v: Vendor) =>
    `Hi ${v.name},%0A%0AI came across your company while searching for exhibition rental providers.%0A%0AI'd like to invite you to list your products on BoothMarket — a B2B marketplace connecting exhibition rental vendors with design consultants and event agencies across India, Europe, and the UK.%0A%0AIt's free to list. Your products will be seen by consultants sourcing for trade shows at venues like Pragati Maidan, ExCeL London, and Messe Frankfurt.%0A%0AJoin here: ${window.location.origin}/register%0A%0ALooking forward to connecting.`

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/browse" className="text-[13px] text-gold hover:text-gold-light transition-colors">
            ← Browse
          </Link>
          <ChevronRight size={13} className="text-[#DDD8CF]" />
          <span className="text-[13px] text-[#6B6B6B]">Find Vendors</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-navy">Find Exhibition Rental Vendors</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Discover real companies near any venue using Google — then invite them to join BoothMarket
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3 max-w-[680px]">
          <div className="flex flex-1 bg-white border-[1.5px] border-[#DDD8CF] rounded-xl overflow-hidden focus-within:border-navy transition-colors">
            <MapPin size={18} className="ml-4 mr-2 my-auto text-gold flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="e.g. exhibition booth rental Mumbai, or Messe Frankfurt stand builders…"
              className="flex-1 py-3.5 text-sm outline-none bg-transparent pr-3"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="px-3 text-[#6B6B6B] hover:text-navy">
                <X size={15} />
              </button>
            )}
          </div>
          <button type="submit" disabled={loading || !search.trim()}
            className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Preset city buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-[12px] text-[#6B6B6B] self-center mr-1">Quick search:</span>
        {PRESET_CITIES.map(c => (
          <button key={c.label} onClick={() => { setSearch(c.query); doSearch(c.query) }}
            className="text-[12.5px] font-medium px-3.5 py-2 bg-white border border-[#DDD8CF] rounded-lg hover:border-navy hover:text-navy transition-all">
            {c.label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5 mb-6 flex items-start gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-blue-800 leading-relaxed">
          Results are pulled live from <strong>Google Places</strong>. These companies are not yet on BoothMarket —
          use the <strong>Invite</strong> button to email them and grow the vendor network.
        </p>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-gold" />
          <p className="text-[#6B6B6B] text-sm">Searching Google for exhibition rental companies…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-[#DDD8CF]" />
          <p className="font-display font-bold text-navy text-lg mb-2">No results found</p>
          <p className="text-[#6B6B6B] text-sm">Try a different city or search term. Example: "exhibition stand builder Dubai"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-[13px] text-[#6B6B6B] mb-5">
            <strong className="text-navy">{results.length}</strong> companies found for "{queryUsed}"
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {results.map(vendor => {
              const photo = vendor.photos[0]
              const hasPhoto = photo && !imgErrors[vendor.place_id]

              return (
                <div key={vendor.place_id}
                  className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all group">
                  {/* Photo */}
                  <div className="h-44 bg-[#F5F2EC] relative overflow-hidden">
                    {hasPhoto ? (
                      <img
                        src={photo.url}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgErrors(e => ({ ...e, [vendor.place_id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={40} className="text-[#DDD8CF]" />
                      </div>
                    )}
                    {/* Open/closed badge */}
                    {vendor.is_open !== null && (
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${
                        vendor.is_open
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vendor.is_open ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                    {/* Google badge */}
                    <span className="absolute bottom-3 left-3 bg-white/90 text-[9px] font-semibold text-[#6B6B6B] px-2 py-1 rounded-full border border-[#DDD8CF]">
                      via Google
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Name + rating */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display font-bold text-navy text-[14.5px] leading-snug">{vendor.name}</h3>
                      {vendor.rating && <StarRating rating={vendor.rating} />}
                    </div>
                    {vendor.review_count > 0 && (
                      <p className="text-[11.5px] text-[#6B6B6B] mb-2">{vendor.review_count.toLocaleString()} Google reviews</p>
                    )}

                    {/* Address */}
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={13} className="text-gold flex-shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[#6B6B6B] leading-snug">{vendor.address}</p>
                    </div>

                    {/* Phone */}
                    {vendor.phone && (
                      <div className="flex items-center gap-2 mb-2">
                        <Phone size={13} className="text-gold flex-shrink-0" />
                        <a href={`tel:${vendor.phone}`} className="text-[12px] text-navy hover:text-gold transition-colors">
                          {vendor.phone}
                        </a>
                      </div>
                    )}

                    {/* Website */}
                    {vendor.website && (
                      <div className="flex items-center gap-2 mb-3">
                        <Globe size={13} className="text-gold flex-shrink-0" />
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] text-navy hover:text-gold transition-colors truncate">
                          {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-3 border-t border-[#F0ECE4]">
                      <a
                        href={`mailto:?subject=Join BoothMarket — List Your Exhibition Products&body=${getInviteBody(vendor)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-navy hover:bg-gold text-white text-[12px] font-bold py-2.5 rounded-lg transition-colors"
                      >
                        <Mail size={13} /> Invite to BoothMarket
                      </a>
                      <a href={vendor.maps_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 border border-[#DDD8CF] text-[#6B6B6B] hover:border-navy hover:text-navy px-3 py-2.5 rounded-lg transition-colors text-[12px]">
                        <ExternalLink size={13} /> Maps
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 bg-navy rounded-2xl p-8 text-center">
            <h2 className="font-display font-extrabold text-white text-xl mb-2">
              Can&apos;t find what you need from these vendors?
            </h2>
            <p className="text-white/60 text-sm mb-5">
              Browse products already listed on BoothMarket by our registered vendors — or send an emergency request.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/browse" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                Browse Listed Products
              </Link>
              <Link href="/emergency" className="border border-white/20 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-lg transition-colors text-sm">
                ⚡ Emergency Request
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
