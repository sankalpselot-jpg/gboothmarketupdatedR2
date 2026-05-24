import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

// Static post data — replace with CMS/MDX in production
const posts: Record<string, {
  title: string; date: string; readTime: string; tag: string
  content: string[]
}> = {
  'how-to-plan-exhibition-booth-europe': {
    title:    'How to Plan Your Exhibition Booth for European Trade Shows',
    date:     '15 May 2026',
    readTime: '8 min read',
    tag:      'EU',
    content: [
      'Exhibiting at a European trade show is one of the most effective ways to reach buyers across the continent. But without careful planning, the logistics can overwhelm even experienced exhibitors.',
      'The first decision is booth size. European venues use metric measurements — the standard inline booth is 3×3m (roughly 10×10 ft), while island booths start at 6×6m. Island booths offer 360° visitor access and significantly more presence, but require more planning and budget.',
      'CE certification is mandatory for all electrical equipment used at EU venues. Every item you rent from BoothMarket carries the CE mark, meaning it meets EU safety directives. Always verify this with any supplier before confirming an order.',
      'VAT is added at 20% for EU orders. If your business is VAT-registered in an EU member state, provide your VAT number at checkout to receive a zero-rated B2B invoice under the reverse charge mechanism. This can significantly reduce your upfront cash outlay.',
      'Book as early as possible. For major shows like Hannover Messe or Interpack, booth items can be reserved 6–12 months in advance. Popular items — island booth packages, LED video walls, modular sofa sets — tend to go first.',
      'Finally, always read the venue\'s exhibitor manual. Each venue has specific rules about permitted materials, power load limits, rigging heights and move-in windows. Our team can help interpret these rules and ensure your order is compliant before delivery.',
    ],
  },
  'exhibition-booth-size-guide': {
    title:    '10×10 vs 20×20: Which Booth Size Is Right for Your Event?',
    date:     '20 Apr 2026',
    readTime: '5 min read',
    tag:      'ALL',
    content: [
      'Choosing the right booth size is one of the most consequential decisions in exhibition planning. Too small and you\'ll feel cramped and struggle to attract attention. Too large and you\'ll overspend on space and rental items without generating proportional ROI.',
      'A 10×10 ft (3×3m) booth is the standard entry-level size at most shows. It\'s sufficient for 1–2 staff, a small product display and a counter. It works well for brand awareness, lead generation and product demos that don\'t require much space.',
      'Step up to a 10×20 ft (3×6m) booth if you have more than two products to show, need seating for meetings, or want to separate your display area from your conversation area. This is the sweet spot for many mid-sized companies.',
      'A 20×20 ft (6×6m) island booth is a statement. It can be seen from three or four aisles away, provides seating for multiple simultaneous meetings, and allows creative configurations that smaller booths can\'t accommodate. Budget at least 3× the per-square-foot cost of a 10×10 when all fixtures and furniture are included.',
      'The key rule: your booth should never feel empty. A 20×20 with sparse furniture feels worse than a dense, well-designed 10×10. If budget is limited, go smaller and invest more in quality fixtures.',
    ],
  },
  'vat-gst-exhibition-rental': {
    title:    'VAT and GST on Exhibition Booth Rentals: A Complete Guide',
    date:     '1 Apr 2026',
    readTime: '9 min read',
    tag:      'TAX',
    content: [
      'Understanding tax obligations when renting exhibition equipment across borders is complex — but getting it right can mean significant cost savings for your business.',
      'In the European Union, VAT at the standard rate (20% in most member states) applies to booth rental services. However, B2B customers who are VAT-registered in any EU member state can provide their VAT registration number to receive a zero-rated invoice under the reverse charge mechanism. This means you pay no VAT upfront — you account for it in your own VAT return.',
      'In the United Kingdom, UK VAT at 20% applies post-Brexit independently of EU rules. UK VAT-registered businesses can reclaim VAT on legitimate business expenses including exhibition rentals. Provide your GB VAT number at checkout for a full UK VAT invoice with our UK VAT registration number included.',
      'In India, GST at 18% applies to rental of movable goods under HSN/SAC code 997319. If your business is GST-registered, provide your GSTIN at checkout. You\'ll receive a GST-compliant tax invoice showing CGST and SGST (for intra-state) or IGST (for inter-state), which can be used to claim Input Tax Credit in your GSTR-2A.',
      'For businesses exhibiting at shows in multiple countries in the same year, keep separate records for each jurisdiction. EU cross-border rentals may have additional complications depending on your country of establishment — we recommend consulting a tax advisor for complex multi-country exhibition programmes.',
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = posts[slug]
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.content[0].slice(0, 155) }
}

const TAG_STYLE: Record<string, string> = {
  EU: 'tag-eu', UK: 'tag-uk', IN: 'tag-in',
  ALL: 'tag-all',
  TAX: 'bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full',
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts[slug]
  if (!post) notFound()

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream min-h-screen">
        <section className="bg-navy py-14 px-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="max-w-[760px] mx-auto relative z-10">
            <Link href="/blog" className="text-gold-light text-[13px] hover:text-gold transition-colors mb-6 block">← Blog</Link>
            <div className="flex items-center gap-3 mb-4">
              <span className={TAG_STYLE[post.tag]}>{post.tag}</span>
              <span className="text-white/40 text-[12.5px]">{post.date}</span>
              <span className="text-white/40 text-[12.5px]">{post.readTime}</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl text-white tracking-tight leading-tight">{post.title}</h1>
          </div>
        </section>

        <article className="max-w-[760px] mx-auto px-10 py-14">
          <div className="space-y-5">
            {post.content.map((para, i) => (
              <p key={i} className={`text-[15.5px] leading-relaxed ${i === 0 ? 'text-navy font-medium text-[17px]' : 'text-[#4A4A4A]'}`}>
                {para}
              </p>
            ))}
          </div>

          <div className="border-t border-[#DDD8CF] mt-12 pt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-[13px] text-[#6B6B6B]">Ready to plan your next show?</p>
              <p className="text-[13px] font-medium text-navy">Browse our full catalogue or request a custom quote.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/products" className="btn-primary px-5 py-2.5 text-sm">Browse Products</Link>
              <Link href="/quote" className="btn-outline px-5 py-2.5 text-sm">Get a Quote</Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
