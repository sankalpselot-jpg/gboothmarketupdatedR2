'use client'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import ProductCard from './ProductCard'
import SearchBar from '@/components/ui/SearchBar'
import Pagination from '@/components/ui/Pagination'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Product, Category, Venue } from '@/types/database'

type Props = {
  products: (Product & { categories: Category })[]
  categories: Category[]
  venues: (Pick<Venue, 'id' | 'name' | 'city' | 'region'>)[]
  searchParams: { category?: string; region?: string; q?: string; sort?: string; page?: string }
  totalCount: number
  totalPages: number
  currentPage: number
}

const REGIONS = [
  { id: '',   label: '🌍 All Regions' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 United Kingdom' },
  { id: 'IN', label: '🇮🇳 India' },
]

const SORT_OPTIONS = [
  { value: '',            label: 'Most Popular' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

export default function ProductsGrid({
  products, categories, venues, searchParams,
  totalCount, totalPages, currentPage,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams as Record<string, string>)
    if (value) p.set(key, value)
    else        p.delete(key)
    if (key !== 'page') p.delete('page')  // reset page on filter change
    router.push(`${pathname}?${p.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  const activeFilters = [
    searchParams.category && `Category: ${categories.find(c => c.slug === searchParams.category)?.name}`,
    searchParams.region   && `Region: ${REGIONS.find(r => r.id === searchParams.region)?.label}`,
    searchParams.q        && `Search: "${searchParams.q}"`,
  ].filter(Boolean) as string[]

  const SidebarContent = () => (
    <>
      {/* Region */}
      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b border-[#DDD8CF]">
          <h3 className="font-display font-semibold text-navy text-sm">Region</h3>
        </div>
        <div className="p-3 flex flex-col gap-1">
          {REGIONS.map(r => (
            <button key={r.id}
              onClick={() => updateParam('region', r.id)}
              className={`text-left px-3 py-2 rounded text-[13px] transition-colors ${
                (searchParams.region || '') === r.id
                  ? 'bg-navy text-white font-medium'
                  : 'text-[#1A1A1A] hover:bg-cream'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b border-[#DDD8CF]">
          <h3 className="font-display font-semibold text-navy text-sm">Category</h3>
        </div>
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={() => updateParam('category', '')}
            className={`text-left px-3 py-2 rounded text-[13px] transition-colors ${
              !searchParams.category ? 'bg-navy text-white font-medium' : 'text-[#1A1A1A] hover:bg-cream'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`text-left px-3 py-2 rounded text-[13px] transition-colors ${
                searchParams.category === cat.slug
                  ? 'bg-navy text-white font-medium'
                  : 'text-[#1A1A1A] hover:bg-cream'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Venue filter */}
      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b border-[#DDD8CF]">
          <h3 className="font-display font-semibold text-navy text-sm">Availability</h3>
        </div>
        <div className="p-4">
          {(['EU', 'UK', 'IN'] as const).map(region => {
            const regionVenues = venues.filter(v => v.region === region)
            if (!regionVenues.length) return null
            return (
              <div key={region} className="mb-3 last:mb-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B6B6B] mb-1.5">
                  {region === 'EU' ? '🇪🇺 Europe' : region === 'UK' ? '🇬🇧 UK' : '🇮🇳 India'}
                </p>
                {regionVenues.slice(0, 4).map(v => (
                  <p key={v.id} className="text-[12px] text-[#6B6B6B] py-0.5">{v.name}</p>
                ))}
                {regionVenues.length > 4 && (
                  <p className="text-[11.5px] text-gold">+{regionVenues.length - 4} more</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Clear filters */}
      {activeFilters.length > 0 && (
        <button onClick={clearAll}
          className="w-full text-sm text-[#6B6B6B] hover:text-navy transition-colors border border-[#DDD8CF] rounded py-2 bg-white">
          Clear all filters
        </button>
      )}
    </>
  )

  return (
    <div>
      {/* Search + sort bar */}
      <div className="bg-white border-b border-[#DDD8CF] py-5 px-10">
        <div className="max-w-[1280px] mx-auto flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[260px]">
            <SearchBar
              onSearch={q => updateParam('q', q)}
              placeholder="Search booths, furniture, A/V…"
            />
          </div>
          <select
            value={searchParams.sort || ''}
            onChange={e => updateParam('sort', e.target.value)}
            className="input py-2.5 w-48 flex-shrink-0"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="lg:hidden flex items-center gap-2 border border-[#DDD8CF] rounded px-4 py-2.5 text-sm bg-white"
          >
            <SlidersHorizontal size={15} /> Filters
            {activeFilters.length > 0 && (
              <span className="bg-navy text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-[#F5F2EC] border-b border-[#DDD8CF] py-3 px-10 overflow-x-auto">
        <div className="max-w-[1280px] mx-auto flex gap-2 items-center whitespace-nowrap">
          <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6B6B6B] mr-1 flex-shrink-0">Browse:</span>
          <button
            onClick={() => updateParam('category', '')}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] border-[1.5px] transition-all flex-shrink-0 ${
              !searchParams.category ? 'bg-navy text-white border-navy' : 'bg-white border-[#DDD8CF] text-[#1A1A1A] hover:border-navy'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] border-[1.5px] transition-all flex-shrink-0 ${
                searchParams.category === cat.slug
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white border-[#DDD8CF] text-[#1A1A1A] hover:border-navy'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="px-10 py-2.5 bg-cream border-b border-[#DDD8CF]">
          <div className="max-w-[1280px] mx-auto flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-[#6B6B6B]">Active:</span>
            {activeFilters.map(f => (
              <span key={f} className="flex items-center gap-1.5 bg-navy/8 text-navy text-[12px] px-2.5 py-1 rounded-full border border-navy/15">
                {f}
              </span>
            ))}
            <button onClick={clearAll} className="text-[12px] text-gold hover:text-gold-light ml-1">Clear all</button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-[1280px] mx-auto px-10 py-8">
        <div className="flex gap-8 items-start">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24">
            <SidebarContent />
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-cream overflow-y-auto p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display font-bold text-navy">Filters</h2>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-[#6B6B6B]">✕</button>
                </div>
                <SidebarContent />
              </div>
            </div>
          )}

          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[#6B6B6B]">
                <span className="font-semibold text-navy">{totalCount.toLocaleString()}</span> products
                {searchParams.q && <> for "<span className="text-navy">{searchParams.q}</span>"</>}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="card p-16 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p className="font-display font-bold text-xl text-navy mb-2">No products found</p>
                <p className="text-[#6B6B6B] text-sm mb-5">Try adjusting your filters or search term.</p>
                <button onClick={clearAll} className="btn-primary px-6 py-2.5">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={p => updateParam('page', String(p))}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
