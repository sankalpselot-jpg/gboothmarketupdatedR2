import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClientUntyped()
  const { data, error } = await db
    .from('exchange_rates').select('*').order('from_currency').order('to_currency')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { from_currency, to_currency, rate } = body
  if (!from_currency || !to_currency || !rate)
    return NextResponse.json({ error: 'from_currency, to_currency and rate required' }, { status: 400 })

  const db = createAdminClientUntyped()
  const { data, error } = await db.from('exchange_rates')
    .upsert({ from_currency, to_currency, rate, updated_by: user.id }, { onConflict: 'from_currency,to_currency' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
