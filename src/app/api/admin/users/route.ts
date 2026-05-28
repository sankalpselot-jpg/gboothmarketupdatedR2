import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, createAdminClientUntyped } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { email, password, full_name, company_name, user_type, role, region, phone } = body

  if (!email || !password)
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  // Create auth user using admin API
  const adminClient = createAdminClient()
  const { data: authData, error: authError } = await (adminClient.auth as any).admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm
    user_metadata: { full_name, company_name, user_type, region },
  })

  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 500 })

  // Update profile with additional fields
  const db = createAdminClientUntyped()
  await db.from('profiles').update({
    full_name:    full_name    || null,
    company_name: company_name || null,
    user_type:    user_type    || 'consultant',
    role:         role         || 'customer',
    region:       region       || null,
    phone:        phone        || null,
  }).eq('id', authData.user.id)

  return NextResponse.json({ data: authData.user }, { status: 201 })
}
