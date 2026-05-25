export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductDetail from '@/components/product/ProductDetail'
import { normaliseProduct, normaliseProducts } from '@/lib/utils/helpers'
import type { Product, Category, Venue } from '@/types/database'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products').select('name, description').eq('slug', slug).single()
  if (!data) return { title: 'Product Not Found' }
  return { title: data.name, description: data.description ?? undefined }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!raw) notFound()

  const product = normaliseProduct(raw) as Product & { categories: Category }

  const { data: relatedRaw } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('category_id', product.category_id ?? '')
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(3)

  const related = normaliseProducts(relatedRaw || []) as (Product & { categories: Category })[]

  const { data: venues } = product.available_venues?.length
    ? await supabase.from('venues').select('*').in('id', product.available_venues)
    : { data: [] }

  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="min-h-screen bg-cream">
        <ProductDetail
          product={product}
          related={related}
          venues={(venues || []) as Venue[]}
        />
      </main>
      <Footer />
    </>
  )
}
