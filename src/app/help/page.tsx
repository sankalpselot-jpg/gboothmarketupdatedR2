import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'Help Centre' }

const categories = [
  {
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    title: 'Orders & Booking',
    desc: 'Placing orders, changing or cancelling bookings, order status.',
    links: ['How do I place an order?', 'Can I modify my order after placing?', 'How do I cancel an order?', 'Where is my order confirmation?'],
  },
  {
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    title: 'Delivery & Installation',
    desc: 'Delivery timelines, installation procedures, venue access.',
    links: ['When will my items be delivered?', 'Who installs the booth?', 'What if I need delivery outside standard hours?', 'How does the pack-down work?'],
  },
  {
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: 'Invoicing & Tax',
    desc: 'VAT invoices (EU/UK), GST invoices (India), payment methods.',
    links: ['How do I get a VAT invoice?', 'Can I add my GSTIN to an invoice?', 'What payment methods are accepted?', 'How do I request a credit note?'],
  },
  {
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Regions & Venues',
    desc: 'Coverage, venue-specific rules, cross-regional orders.',
    links: ['Which countries do you cover?', 'How do I order for multiple venues?', 'Do you deliver outside listed venues?', 'Venue-specific power requirements'],
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    title: 'Account & Security',
    desc: 'Managing your account, password, profile, and data.',
    links: ['How do I reset my password?', 'How do I update my VAT number?', 'How do I delete my account?', 'How is my data used?'],
  },
  {
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Custom & Quote Requests',
    desc: 'Large orders, bespoke items, multi-venue packages.',
    links: ['How do I request a custom quote?', 'What is included in a quote?', 'Can I rent items not in the catalogue?', 'How long does a quote take?'],
  },
]

export default function HelpPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream min-h-screen">

        {/* Hero */}
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[700px] mx-auto text-center relative z-10">
            <p className="section-label text-gold-light">Support</p>
            <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-5">Help Centre</h1>
            <p className="text-white/60 text-lg mb-8">Find answers to common questions about orders, delivery, invoicing and more.</p>
            <div className="flex bg-white/10 border border-white/20 rounded overflow-hidden max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Search help articles…"
                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/40 outline-none text-sm"
              />
              <button className="px-5 bg-gold text-white text-sm font-medium hover:bg-gold-light transition-colors">
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-14 px-10 max-w-[1100px] mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {categories.map(cat => (
              <div key={cat.title} className="card p-6 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-cream-dark rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={cat.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-display font-bold text-navy mb-1.5">{cat.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] mb-4 leading-relaxed">{cat.desc}</p>
                <ul className="space-y-1.5">
                  {cat.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-[12.5px] text-gold hover:text-gold-light flex items-center gap-1.5 transition-colors">
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact options */}
          <div className="bg-navy rounded-2xl p-10">
            <h2 className="font-display font-extrabold text-2xl text-white text-center mb-8">Still need help?</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Email Support', sub: 'Response within 24h', action: 'support@boothmarket.com', href: 'mailto:support@boothmarket.com' },
                { icon: 'M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.07 9.81 19.79 19.79 0 01.99 1.18 2 2 0 013 0h3a2 2 0 012 1.72A12.84 12.84 0 009.7 4.53a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z', title: 'Phone Support', sub: 'Mon–Fri business hours', action: 'Call your regional team', href: '/contact' },
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Request a Quote', sub: 'For large or custom orders', action: 'Submit a quote request', href: '/quote' },
              ].map(item => (
                <a key={item.title} href={item.href} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 bg-gold/15 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-white mb-1 text-sm">{item.title}</h3>
                  <p className="text-white/40 text-[12px] mb-2">{item.sub}</p>
                  <p className="text-gold-light text-[12.5px] font-medium group-hover:underline">{item.action}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
