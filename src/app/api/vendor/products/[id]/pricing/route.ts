import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'
import { FALLBACK_RATES, REGION_CURRENCIES } from '@/lib/utils/currency'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createAdminClientUntyped()
  const { data, error } = await db
    .from('regional_pricing').select('*').eq('product_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { regions, base_price, base_currency, overrides } = body
  // regions: string[], base_price: number, base_currency: string
  // overrides: Record<region, { price: number; currency: string } | null>

  const db = createAdminClientUntyped()

  // Fetch live exchange rates
  const { data: ratesData } = await db.from('exchange_rates').select('*')
  const rates: Record<string, Record<string, number>> = {}
  for (const r of (ratesData || [])) {
    if (!rates[r.from_currency]) rates[r.from_currency] = {}
    rates[r.from_currency][r.to_currency] = r.rate
  }

  const upserts = []
  for (const region of regions) {
    const toCurrency = REGION_CURRENCIES[region] || base_currency
    const override   = overrides?.[region]

    if (override && override.price != null) {
      upserts.push({
        product_id:    id,
        region,
        currency:      override.currency || toCurrency,
        price:         override.price,
        is_manual:     true,
        exchange_rate: null,
      })
    } else {
      // Auto-convert
      const rate = base_currency === toCurrency ? 1
        : (rates[base_currency]?.[toCurrency] || FALLBACK_RATES[base_currency]?.[toCurrency] || 1)
      upserts.push({
        product_id:    id,
        region,
        currency:      toCurrency,
        price:         Math.round(base_price * rate * 100) / 100,
        is_manual:     false,
        exchange_rate: rate,
      })
    }
  }

  // Upsert all regional pricing
  const { error } = await db.from('regional_pricing')
    .upsert(upserts, { onConflict: 'product_id,region' })

  // Remove regions no longer selected
  if (regions.length > 0) {
    await db.from('regional_pricing')
      .delete()
      .eq('product_id', id)
      .not('region', 'in', `(${regions.map((r: string) => `'${r}'`).join(',')})`)
  } else {
    await db.from('regional_pricing').delete().eq('product_id', id)
  }

  // Update serves_regions on product
  await db.from('vendor_products').update({ serves_regions: regions, base_currency }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: upserts.length })
}
