import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { badge_id, vendor_product_id, vendor_id } = body
  const db = createAdminClientUntyped()

  if (vendor_product_id) {
    const { error } = await db.from('product_badges').upsert(
      { badge_id, vendor_product_id, assigned_by: user.id },
      { onConflict: 'vendor_product_id,badge_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (vendor_id) {
    const { error } = await db.from('vendor_badges').upsert(
      { badge_id, vendor_id, assigned_by: user.id },
      { onConflict: 'vendor_id,badge_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
