import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'Careers at BoothMarket' }

const openings = [
  { title: 'Senior Logistics Coordinator',    region: '🇩🇪 Frankfurt, DE', type: 'Full-time', dept: 'Operations' },
  { title: 'Account Manager — India',         region: '🇮🇳 Mumbai, IN',    type: 'Full-time', dept: 'Sales' },
  { title: 'Exhibition Installer',            region: '🇬🇧 London, UK',    type: 'Full-time', dept: 'Field Operations' },
  { title: 'Full-Stack Engineer',             region: '🌍 Remote',          type: 'Full-time', dept: 'Engineering' },
  { title: 'Customer Success Manager',        region: '🇬🇧 London, UK',    type: 'Full-time', dept: 'Support' },
  { title: 'Marketing & Content Specialist',  region: '🌍 Remote',          type: 'Full-time', dept: 'Marketing' },
]

const perks = [
  { icon: '✈️', label: 'Travel to top trade shows across EU, UK & India' },
  { icon: '🌍', label: 'Remote-first culture with regional hubs' },
  { icon: '📈', label: 'Equity for early team members' },
  { icon: '🏖️', label: '30 days holiday (EU/UK) · 21 days (India)' },
  { icon: '💡', label: 'Learning budget: €1,500/year' },
  { icon: '🏥', label: 'Private health insurance' },
]

export default function CareersPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream min-h-screen">
        <section className="bg-navy py-20 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[800px] mx-auto text-center relative z-10">
            <p className="section-label text-gold-light">Join the Team</p>
            <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-5">Work at BoothMarket</h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              We're building the infrastructure for the global exhibition industry. Join a small, ambitious team operating across three continents.
            </p>
          </div>
        </section>

        <section className="max-w-[1000px] mx-auto px-10 py-16">

          {/* Perks */}
          <div className="mb-14">
            <p className="section-label">Benefits</p>
            <h2 className="section-title mb-8">What we offer</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {perks.map(p => (
                <div key={p.label} className="card p-5 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <p className="text-[13.5px] text-navy leading-relaxed">{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open roles */}
          <div>
            <p className="section-label">Open Positions</p>
            <h2 className="section-title mb-8">Current openings</h2>
            <div className="space-y-3">
              {openings.map(job => (
                <div key={job.title} className="card p-5 flex items-center justify-between gap-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div>
                    <h3 className="font-display font-bold text-navy text-[15px] mb-1">{job.title}</h3>
                    <div className="flex items-center gap-3 text-[12.5px] text-[#6B6B6B]">
                      <span>{job.region}</span>
                      <span>·</span>
                      <span>{job.type}</span>
                      <span>·</span>
                      <span className="bg-cream-dark px-2 py-0.5 rounded text-navy font-medium">{job.dept}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:careers@boothmarket.com?subject=Application: ${job.title}`}
                    className="btn-primary px-5 py-2 text-sm flex-shrink-0"
                  >
                    Apply →
                  </a>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[#6B6B6B] mt-6 text-center">
              Don't see a match? Send a speculative application to{' '}
              <a href="mailto:careers@boothmarket.com" className="text-gold hover:underline">careers@boothmarket.com</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
