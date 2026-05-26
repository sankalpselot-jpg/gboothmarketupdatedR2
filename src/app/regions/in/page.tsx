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
  title: 'Exhibition Booth Rental India',
  description: 'B2B exhibition booth rental across India. ISI marked, GST invoicing, BIS standards. Pragati Maidan, BIEC, HITEX and more.',
}

const indiaVenues = [
  { name: 'Pragati Maidan (ITPO)',   city: 'New Delhi',  note: "India's premier trade fair ground" },
  { name: 'Bombay Exhibition Centre', city: 'Mumbai',     note: 'Largest venue in Western India' },
  { name: 'BIEC',                    city: 'Bengaluru',  note: 'Bangalore International Exhibition Centre' },
  { name: 'HITEX Exhibition Centre',  city: 'Hyderabad',  note: 'Hyderabad International Trade Expositions' },
  { name: 'Chennai Trade Centre',    city: 'Chennai',    note: "South India's leading exhibition venue" },
  { name: 'KTPO',                    city: 'Bengaluru',  note: 'Karnataka Trade Promotion Organisation' },
  { name: 'Bombay Convention Centre', city: 'Mumbai',     note: 'BKC — modern city centre venue' },
  { name: 'Science City',            city: 'Kolkata',    note: 'Eastern India events hub' },
]

export default async function IndiaRegionPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('products').select('*, categories(*)')
    .eq('is_active', true).contains('available_regions', ['IN'])
    .eq('is_featured', true).limit(6)

  const products = normaliseProducts(raw || []) as unknown as (Product & { categories: Category })[]

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream">
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[1100px] mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl">🇮🇳</span>
              <div>
                <p className="section-label text-gold-light">Region</p>
                <h1 className="font-display font-extrabold text-4xl text-white tracking-tight">India</h1>
              </div>
            </div>
            <p className="text-white/60 text-base max-w-2xl leading-relaxed mb-8">
              Exhibition booth rental across Delhi, Mumbai, Bengaluru, Hyderabad, Chennai and more. ISI-marked equipment, GST-compliant invoicing with GSTIN support, BIS safety standards.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ISI Marked', 'GST Invoice', 'GSTIN Support', 'BIS Standards', 'Pricing in INR', 'IRP e-Invoice'].map(tag => (
                <span key={tag} className="bg-orange-900/30 text-orange-200 border border-orange-800/40 px-3 py-1.5 rounded-full text-[12px]">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 px-10 max-w-[1100px] mx-auto">
          <p className="section-label">Venues</p>
          <h2 className="section-title mb-8">India Exhibition Venues</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {indiaVenues.map(v => (
              <div key={v.name} className="card p-4">
                <p className="font-display font-bold text-navy text-sm mb-0.5">{v.name}</p>
                <p className="text-[12px] text-gold font-medium mb-1">{v.city}</p>
                <p className="text-[11.5px] text-[#6B6B6B]">{v.note}</p>
              </div>
            ))}
          </div>

          {products.length > 0 && (
            <>
              <p className="section-label">Featured Products</p>
              <h2 className="section-title mb-8">Available Across India</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
          <div className="text-center">
            <Link href="/products?region=IN" className="btn-primary px-8 py-3.5">Browse All India Products</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
