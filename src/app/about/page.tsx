import type { Metadata } from 'next'
import Link from 'next/link'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = { title: 'About BoothMarket' }

const stats = [
  { num: '4,800+', label: 'Items in catalogue' },
  { num: '85+',    label: 'Exhibition venues' },
  { num: '12,000+',label: 'Events served' },
  { num: '98%',    label: 'On-time delivery rate' },
]

const team = [
  { name: 'Marcus Weiler',   role: 'CEO & Co-founder',    region: '🇩🇪 Frankfurt' },
  { name: 'Priya Nair',      role: 'COO & Co-founder',    region: '🇮🇳 Mumbai' },
  { name: 'James Thornton',  role: 'Head of UK Operations', region: '🇬🇧 London' },
  { name: 'Sophie Dubois',   role: 'Head of EU Logistics', region: '🇫🇷 Paris' },
  { name: 'Arjun Mehta',     role: 'Head of India Sales',  region: '🇮🇳 Bengaluru' },
  { name: 'Lena Hoffmann',   role: 'Head of Product',      region: '🇩🇪 Berlin' },
]

const values = [
  {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Reliability first',
    desc: 'A missed delivery or broken item can derail an entire exhibition. We obsess over on-time rates and quality checks so you never have to worry.',
  },
  {
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
    title: 'Local expertise, global reach',
    desc: 'We don\'t try to run a one-size-fits-all operation. Each region has dedicated crews, local compliance knowledge and venue relationships built over years.',
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    title: 'Compliance built in',
    desc: 'VAT invoicing for EU and UK, GST invoicing for India, GDPR-compliant data handling, and CE/UKCA/ISI-certified equipment — standard, not optional.',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Simple and fast',
    desc: 'You\'re busy preparing for a show. Our platform is designed to get you from browsing to confirmed order in minutes, not days.',
  },
]

export default function AboutPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream">

        {/* Hero */}
        <section className="bg-navy py-20 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[900px] mx-auto text-center relative z-10">
            <p className="section-label text-gold-light">Our Story</p>
            <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-5">
              Built by exhibitors,<br />for exhibitors
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              BoothMarket was founded in 2021 by a team who spent years managing trade show logistics across Europe and India — and got tired of the chaos. We built the marketplace we always wished existed.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-[#DDD8CF] py-14 px-10">
          <div className="max-w-[1100px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-0">
            {stats.map((s, i) => (
              <div key={s.label} className={`text-center py-4 ${i < stats.length - 1 ? 'border-r border-[#DDD8CF]' : ''}`}>
                <div className="font-display font-extrabold text-4xl text-navy mb-1">{s.num}</div>
                <div className="text-[13px] text-[#6B6B6B] uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-10 max-w-[1100px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label">Our Mission</p>
              <h2 className="section-title mb-5">Make exhibition logistics invisible</h2>
              <p className="text-[#6B6B6B] text-[15px] leading-relaxed mb-4">
                Every exhibitor should be able to walk into their show and find everything exactly as ordered — furniture in place, lighting set up, A/V running, flooring laid. Not stressing about deliveries, chasing suppliers or navigating venue rules in three different countries.
              </p>
              <p className="text-[#6B6B6B] text-[15px] leading-relaxed mb-6">
                We handle the complexity so you can focus on your customers. Whether you're a startup exhibiting for the first time at ExCeL or a multinational running booths simultaneously at Hannover Messe, Amsterdam RAI and Pragati Maidan — we've got you.
              </p>
              <div className="flex flex-wrap gap-2">
                {['🇪🇺 EU-compliant', '🇬🇧 UKCA certified', '🇮🇳 GST registered', 'GDPR ready'].map(tag => (
                  <span key={tag} className="text-[12.5px] bg-cream-dark text-navy px-3 py-1.5 rounded-full border border-[#DDD8CF]">{tag}</span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#DDD8CF] rounded-2xl p-10">
              <div className="space-y-6">
                {['2021 — Founded in Frankfurt', '2022 — Launched UK operations from London', '2023 — Expanded to India (Delhi, Mumbai, Bengaluru)', '2024 — Reached 10,000 events served', '2025 — Launched BoothMarket online marketplace', '2026 — Serving 85+ venues across 3 regions'].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                    <p className="text-[13.5px] text-navy">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white border-t border-[#DDD8CF] py-20 px-10">
          <div className="max-w-[1100px] mx-auto">
            <p className="section-label">What We Stand For</p>
            <h2 className="section-title mb-12">Our values</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map(v => (
                <div key={v.title} className="bg-cream border border-[#DDD8CF] rounded-xl p-7">
                  <div className="w-11 h-11 bg-white border border-[#DDD8CF] rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d={v.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-navy text-base mb-2">{v.title}</h3>
                  <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 px-10 max-w-[1100px] mx-auto">
          <p className="section-label">The Team</p>
          <h2 className="section-title mb-10">People behind BoothMarket</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map(member => (
              <div key={member.name} className="card p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-navy-light flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-lg">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-semibold text-navy text-[14.5px]">{member.name}</p>
                  <p className="text-[12.5px] text-[#6B6B6B]">{member.role}</p>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5">{member.region}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-navy py-16 px-10">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="font-display font-extrabold text-3xl text-white mb-4">Ready to simplify your exhibition logistics?</h2>
            <p className="text-white/60 mb-8">Browse 4,800+ items or talk to our team for a tailored quote.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="btn-primary px-8 py-3.5 text-base">Browse Catalogue</Link>
              <Link href="/contact" className="border border-white/30 text-white px-8 py-3.5 rounded font-medium hover:bg-white/10 transition-colors text-base">Get in Touch</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
