import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export async function GET() {
  const db = createAdminClientUntyped()
  const { data, error } = await db.from('payment_terms').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { consultant_id, credit_limit, net_days, deposit_pct, approved_buyer, notes } = body

  const db = createAdminClientUntyped()
  const { data, error } = await db.from('payment_terms').upsert({
    consultant_id,
    credit_limit:   credit_limit   ?? 0,
    net_days:       net_days       ?? 0,
    deposit_pct:    deposit_pct    ?? 100,
    approved_buyer: approved_buyer ?? false,
    notes:          notes          ?? null,
    approved_by:    user.id,
    approved_at:    new Date().toISOString(),
  }, { onConflict: 'consultant_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
