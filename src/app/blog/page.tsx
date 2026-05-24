import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'Blog — Exhibition Tips & Guides' }

const posts = [
  {
    slug:     'how-to-plan-exhibition-booth-europe',
    tag:      'EU',
    date:     '15 May 2026',
    title:    'How to Plan Your Exhibition Booth for European Trade Shows',
    excerpt:  'A complete guide to booth sizing, CE compliance, VAT invoicing and logistics for exhibiting at Messe Frankfurt, Amsterdam RAI and more.',
    readTime: '8 min read',
  },
  {
    slug:     'excell-london-exhibitor-guide',
    tag:      'UK',
    date:     '3 May 2026',
    title:    "ExCeL London Exhibitor Guide: Everything You Need to Know",
    excerpt:  "From power outlets to loading bay access — our complete guide to exhibiting at Europe's largest conference centre in East London.",
    readTime: '6 min read',
  },
  {
    slug:     'india-trade-show-booth-tips',
    tag:      'IN',
    date:     '28 Apr 2026',
    title:    '10 Tips for Your First Trade Show Booth in India',
    excerpt:  'Navigating Pragati Maidan, BIEC and HITEX — GST registration, local logistics, cultural considerations and how to stand out.',
    readTime: '7 min read',
  },
  {
    slug:     'exhibition-booth-size-guide',
    tag:      'ALL',
    date:     '20 Apr 2026',
    title:    '10×10 vs 20×20: Which Booth Size Is Right for Your Event?',
    excerpt:  'A practical breakdown of booth sizes, costs and ROI — from compact inline stands to full island displays.',
    readTime: '5 min read',
  },
  {
    slug:     'led-video-walls-trade-shows',
    tag:      'ALL',
    date:     '10 Apr 2026',
    title:    'Why LED Video Walls Are Now Standard at Top Trade Shows',
    excerpt:  "LED walls have replaced printed backdrops at most major EU and UK venues. Here's how to spec one for your booth and what to budget.",
    readTime: '4 min read',
  },
  {
    slug:     'vat-gst-exhibition-rental',
    tag:      'TAX',
    date:     '1 Apr 2026',
    title:    'VAT and GST on Exhibition Booth Rentals: A Complete Guide',
    excerpt:  'Everything exhibitors need to know about reclaiming VAT in Europe and the UK, and claiming GST Input Tax Credit in India.',
    readTime: '9 min read',
  },
]

const TAG_STYLE: Record<string, string> = {
  EU:  'tag-eu',
  UK:  'tag-uk',
  IN:  'tag-in',
  ALL: 'tag-all',
  TAX: 'bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full',
}

export default function BlogPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream min-h-screen">
        <section className="bg-navy py-16 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[700px] mx-auto text-center relative z-10">
            <p className="section-label text-gold-light">Insights</p>
            <h1 className="font-display font-extrabold text-5xl text-white tracking-tight mb-5">Blog</h1>
            <p className="text-white/60 text-lg">Exhibition tips, venue guides, tax advice and industry news across Europe, UK and India.</p>
          </div>
        </section>

        <section className="max-w-[1100px] mx-auto px-10 py-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all group"
              >
                <div className="bg-cream-dark h-44 flex items-center justify-center overflow-hidden">
                  <svg className="w-16 h-16 opacity-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M4 4h16v16H4zM4 9h16M9 9v11"/>
                  </svg>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={TAG_STYLE[post.tag]}>{post.tag}</span>
                    <span className="text-[11.5px] text-[#6B6B6B]">{post.date}</span>
                    <span className="text-[11.5px] text-[#6B6B6B] ml-auto">{post.readTime}</span>
                  </div>
                  <h3 className="font-display font-bold text-navy text-[15px] leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
