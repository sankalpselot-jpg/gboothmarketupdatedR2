import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = parseInt(searchParams.get('limit') || '20')
  const unread = searchParams.get('unread') === 'true'

  const db = createAdminClientUntyped()
  let query = db.from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unread) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await db
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ data, unreadCount: count || 0 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ids, markAllRead } = body
  const db = createAdminClientUntyped()

  if (markAllRead) {
    await db.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  } else if (ids?.length) {
    await db.from('notifications').update({ is_read: true })
      .in('id', ids).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
