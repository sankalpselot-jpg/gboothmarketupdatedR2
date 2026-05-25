export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import { normaliseProducts } from '@/lib/utils/helpers'
import type { Product, Category } from '@/types/database'

export const metadata: Metadata = {
  title: 'Exhibition Booth Rental UK',
  description: 'B2B exhibition booth rental across the United Kingdom. UKCA marked, UK VAT invoicing, BS EN safety standards.',
}

const ukVenues = [
  { name: 'ExCeL London',       city: 'London E16',     note: 'Largest exhibition centre in London' },
  { name: 'Olympia London',     city: 'Hammersmith W14', note: 'Historic West London venue' },
  { name: 'NEC Birmingham',     city: 'Birmingham B40',  note: "UK's largest convention complex" },
  { name: 'Manchester Central', city: 'Manchester M2',   note: 'City centre venue' },
  { name: 'SEC Glasgow',        city: 'Glasgow G3',      note: 'Scottish Event Campus' },
  { name: 'Edinburgh EICC',     city: 'Edinburgh EH3',   note: 'International conference centre' },
]

export default async function UKRegionPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('products').select('*, categories(*)')
    .eq('is_active', true).contains('available_regions', ['UK'])
    .eq('is_featured', true).limit(6)

  const products = normaliseProducts(raw || []) as (Product & { categories: Category })[]

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream">
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl">🇬🇧</span>
              <div>
                <p className="section-label text-gold-light">Region</p>
                <h1 className="font-display font-extrabold text-4xl text-white tracking-tight">United Kingdom</h1>
              </div>
            </div>
            <p className="text-white/60 text-base max-w-2xl leading-relaxed mb-8">
              Exhibition booth rental across England, Scotland and Wales. UKCA-marked equipment, UK VAT invoicing, BS EN compliant materials.
            </p>
            <div className="flex flex-wrap gap-2">
              {['UKCA Marked', 'UK VAT Invoice', 'BS EN Standards', 'UK GDPR', 'Pricing in GBP'].map(tag => (
                <span key={tag} className="bg-red-900/30 text-red-200 border border-red-800/40 px-3 py-1.5 rounded-full text-[12px]">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 px-10 max-w-[1100px] mx-auto">
          <p className="section-label">Venues</p>
          <h2 className="section-title mb-8">Major UK Exhibition Venues</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {ukVenues.map(v => (
              <div key={v.name} className="card p-5">
                <p className="font-display font-bold text-navy mb-1">{v.name}</p>
                <p className="text-[12.5px] text-[#6B6B6B] mb-1">{v.city}</p>
                <p className="text-[12px] text-[#6B6B6B]">{v.note}</p>
              </div>
            ))}
          </div>

          {products.length > 0 && (
            <>
              <p className="section-label">Featured Products</p>
              <h2 className="section-title mb-8">Available Across UK</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
          <div className="text-center">
            <Link href="/products?region=UK" className="btn-primary px-8 py-3.5">Browse All UK Products</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
