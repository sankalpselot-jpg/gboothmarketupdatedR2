import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, tier, type } = await req.json()
  const db = createAdminClientUntyped()

  if (type === 'vendor') {
    await db.from('vendor_profiles')
      .update({ subscription_tier: tier })
      .eq('user_id', user_id)
  } else {
    await db.from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', user_id)
  }

  return NextResponse.json({ success: true })
}
