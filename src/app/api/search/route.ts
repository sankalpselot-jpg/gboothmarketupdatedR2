import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q      = searchParams.get('q')?.trim()
  const region = searchParams.get('region')
  const limit  = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

  if (!q || q.length < 2)
    return NextResponse.json({ data: [] })

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, name, slug, price_eur, price_gbp, price_inr, images, badge, available_regions, categories(name)')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .limit(limit)

  if (region) query = query.contains('available_regions', [region.toUpperCase()])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, query: q })
}
