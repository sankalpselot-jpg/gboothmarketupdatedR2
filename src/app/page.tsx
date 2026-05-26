export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import ShowsTicker from '@/components/layout/ShowsTicker'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import HeroSection from '@/components/home/HeroSection'
import ProductsSection from '@/components/home/ProductsSection'
import VenuesSection from '@/components/home/VenuesSection'
import HowItWorks from '@/components/home/HowItWorks'
import ComplianceSection from '@/components/home/ComplianceSection'
import TrustBar from '@/components/home/TrustBar'
import CtaBanner from '@/components/home/CtaBanner'
import type { Product, Category, Venue } from '@/types/database'

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredRaw } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(6)

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .order('region')

  // Supabase returns joined relations as arrays; cast to our expected shape
  const featuredProducts = (featuredRaw || []).map(p => ({
    ...p,
    categories: Array.isArray(p.categories) ? p.categories[0] : p.categories,
  })) as unknown as (Product & { categories: Category })[]

  return (
    <>
      <RegionBar />
      <Topbar />
      <Header />
      <ShowsTicker />
      <main>
        <HeroSection />
        <ProductsSection products={featuredProducts} />
        <VenuesSection venues={(venues || []) as Venue[]} />
        <HowItWorks />
        <ComplianceSection />
        <TrustBar />
        <CtaBanner />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
