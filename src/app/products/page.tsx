import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import ProductsGrid from '@/components/product/ProductsGrid'

export const metadata: Metadata = {
  title: 'Browse Products',
  description: 'Browse 4,800+ exhibition booth rental items across Europe, UK and India.',
}

interface SearchParams {
  category?: string
  region?: string
  q?: string
  sort?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params  = await searchParams
  const supabase = await createClient()

  const page  = parseInt(params.page || '1')
  const limit = 18
  const offset = (page - 1) * limit

  let query = supabase
    .from('products')
    .select('*, categories(*)', { count: 'exact' })
    .eq('is_active', true)

  if (params.category) query = query.eq('categories.slug', params.category)
  if (params.region)   query = query.contains('available_regions', [params.region.toUpperCase()])
  if (params.q)        query = query.ilike('name', `%${params.q}%`)

  if (params.sort === 'price_asc')       query = query.order('price_eur', { ascending: true })
  else if (params.sort === 'price_desc') query = query.order('price_eur', { ascending: false })
  else query = query
    .order('is_featured', { ascending: false })
    .order('created_at',  { ascending: false })

  const { data: products, count } = await query.range(offset, offset + limit - 1)
  const { data: categories }      = await supabase
    .from('categories').select('*').order('sort_order')
  const { data: venues }          = await supabase
    .from('venues').select('id, name, city, region').order('region').order('name')

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="min-h-screen bg-cream">
        <ProductsGrid
          products={products || []}
          categories={categories || []}
          venues={venues || []}
          searchParams={params}
          totalCount={count || 0}
          totalPages={totalPages}
          currentPage={page}
        />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
