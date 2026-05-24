import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'Cookie Policy' }

const cookies = [
  {
    category: 'Strictly Necessary',
    description: 'Required for the platform to function. Cannot be disabled.',
    examples: ['supabase-auth-token — keeps you signed in', 'sb-session — Supabase session management', 'csrf-token — protects against cross-site attacks'],
    canDisable: false,
  },
  {
    category: 'Functional',
    description: 'Remember your preferences across sessions.',
    examples: ['bm-region — stores your selected region (EU/UK/IN)', 'bm-currency — stores your preferred currency', 'bm-wishlist — stores your saved products'],
    canDisable: true,
  },
  {
    category: 'Analytics (Optional)',
    description: 'Help us understand how the platform is used. No personal data is shared with advertisers.',
    examples: ['_ga — Google Analytics session identifier', '_gid — Google Analytics daily visitor ID'],
    canDisable: true,
  },
]

export default function CookiePolicyPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream py-14 px-10 min-h-screen">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="tag-eu">GDPR</span>
            <span className="tag-uk">UK GDPR</span>
            <span className="tag-in">PDPB</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-navy mb-3">Cookie Policy</h1>
          <p className="text-[#6B6B6B] mb-10 text-sm">
            Last updated 1 January 2026. This policy applies to boothmarket.com and all regional subdomains.
          </p>

          <div className="card p-6 mb-6">
            <h2 className="font-display font-bold text-navy text-base mb-2">What are cookies?</h2>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. We use cookies to keep you signed in, remember your region and currency preferences, and understand how you use our platform so we can improve it.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {cookies.map(cat => (
              <div key={cat.category} className="card p-6">
                <div className="flex items-start justify-between mb-2 gap-4">
                  <h2 className="font-display font-bold text-navy text-base">{cat.category}</h2>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    cat.canDisable ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {cat.canDisable ? 'Can be disabled' : 'Always active'}
                  </span>
                </div>
                <p className="text-[13.5px] text-[#6B6B6B] mb-3">{cat.description}</p>
                <ul className="space-y-1">
                  {cat.examples.map(ex => (
                    <li key={ex} className="text-[12.5px] text-[#6B6B6B] font-mono bg-cream px-3 py-1.5 rounded">{ex}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="font-display font-bold text-navy text-base mb-2">Managing cookies</h2>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-3">
              You can manage or withdraw cookie consent at any time via the cookie banner (accessible by clearing your browser cookies and reloading the page), or by adjusting your browser settings.
            </p>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              Note that disabling strictly necessary cookies will prevent you from signing in or using the checkout. For questions, email{' '}
              <a href="mailto:privacy@boothmarket.com" className="text-gold hover:underline">privacy@boothmarket.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
