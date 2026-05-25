export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import type { Region } from '@/types/database'

export const metadata: Metadata = { title: 'Delivery Areas' }

export default async function DeliveryPage() {
  const supabase = await createClient()
  const { data: venues } = await supabase.from('venues').select('*').order('region').order('city')

  const byRegion = (['EU', 'UK', 'IN'] as Region[]).map(r => ({
    r,
    label: r === 'EU' ? '🇪🇺 Europe' : r === 'UK' ? '🇬🇧 United Kingdom' : '🇮🇳 India',
    venues: venues?.filter(v => v.region === r) || [],
  }))

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream min-h-screen">
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[700px] mx-auto text-center relative z-10">
            <p className="section-label text-gold-light">Coverage</p>
            <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-5">Delivery Areas</h1>
            <p className="text-white/60 text-lg">We deliver and install at {venues?.length || '85'}+ venues across Europe, UK and India.</p>
          </div>
        </section>

        <section className="max-w-[1100px] mx-auto px-10 py-14">
          {byRegion.map(({ r, label, venues }) => (
            <div key={r} className="mb-12">
              <h2 className="font-display font-extrabold text-2xl text-navy mb-5">{label}</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream border-b border-[#DDD8CF]">
                      <th className="text-left px-5 py-3 font-semibold text-navy">Venue</th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">City</th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">Country</th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">Website</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map(v => (
                      <tr key={v.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-navy">{v.name}</td>
                        <td className="px-5 py-3 text-[#6B6B6B]">{v.city}</td>
                        <td className="px-5 py-3 text-[#6B6B6B]">{v.country}</td>
                        <td className="px-5 py-3">
                          {v.website
                            ? <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light text-[12.5px]">
                                {new URL(v.website).hostname.replace('www.', '')}
                              </a>
                            : <span className="text-[#DDD8CF]">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="card p-8 text-center mt-6">
            <h3 className="font-display font-bold text-navy text-xl mb-2">Don't see your venue?</h3>
            <p className="text-[#6B6B6B] text-sm mb-5">We expand coverage regularly. Contact us to check if your venue can be added.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/contact" className="btn-primary px-6 py-2.5">Contact Us</Link>
              <Link href="/quote" className="btn-outline px-6 py-2.5">Request a Quote</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
