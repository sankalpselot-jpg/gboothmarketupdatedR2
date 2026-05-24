import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import type { Product, Category } from '@/types/database'

export const metadata: Metadata = {
  title: 'Exhibition Booth Rental Europe',
  description: 'B2B exhibition booth and furniture rental across Germany, France, Netherlands, Spain, Italy and more. CE certified, VAT invoicing, GDPR compliant.',
}

export default async function EURegionPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products').select('*, categories(*)')
    .eq('is_active', true).contains('available_regions', ['EU'])
    .eq('is_featured', true).limit(6)
  const { data: venues } = await supabase
    .from('venues').select('*').eq('region', 'EU').order('name')

  const highlights = [
    { flag: '🇩🇪', country: 'Germany',     venues: 'Messe Frankfurt · Messe Düsseldorf · Messe Berlin' },
    { flag: '🇳🇱', country: 'Netherlands', venues: 'Amsterdam RAI' },
    { flag: '🇫🇷', country: 'France',      venues: 'Paris Nord Villepinte · Paris Le Bourget' },
    { flag: '🇪🇸', country: 'Spain',       venues: 'Fira Barcelona · IFEMA Madrid' },
    { flag: '🇮🇹', country: 'Italy',       venues: 'Fiera Milano · Bologna Fiere' },
    { flag: '🇧🇪', country: 'Belgium',     venues: 'Brussels Expo' },
  ]

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream">
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl">🇪🇺</span>
              <div>
                <p className="section-label text-gold-light">Region</p>
                <h1 className="font-display font-extrabold text-4xl text-white tracking-tight">European Union</h1>
              </div>
            </div>
            <p className="text-white/60 text-base max-w-2xl leading-relaxed mb-8">
              Premium B2B exhibition booth rental across all major EU trade show markets. CE-certified equipment, full VAT invoicing, GDPR-compliant — delivered and installed at Europe's top venues.
            </p>
            <div className="flex flex-wrap gap-2">
              {['CE Certified', 'VAT Invoicing', 'GDPR Compliant', 'EU Fire Safety Standards', 'Pricing in EUR'].map(tag => (
                <span key={tag} className="tag-eu bg-blue-900/30 text-blue-200 border border-blue-800/40 px-3 py-1.5 rounded-full text-[12px]">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Countries */}
        <section className="py-14 px-10 max-w-[1100px] mx-auto">
          <p className="section-label">Coverage</p>
          <h2 className="section-title mb-8">EU Countries & Venues</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {highlights.map(h => (
              <div key={h.country} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{h.flag}</span>
                  <span className="font-display font-bold text-navy">{h.country}</span>
                </div>
                <p className="text-[12.5px] text-[#6B6B6B]">{h.venues}</p>
              </div>
            ))}
          </div>

          <p className="section-label">Featured Products</p>
          <h2 className="section-title mb-8">Available Across EU</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {(products as (Product & { categories: Category })[])?.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center">
            <Link href="/products?region=EU" className="btn-primary px-8 py-3.5">Browse All EU Products</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
