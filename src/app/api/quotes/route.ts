import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { vendor_product_id, project_id, message } = body
  const db = supabase as any

  // Get vendor_id from product
  const { data: product } = await db.from('vendor_products')
    .select('vendor_id').eq('id', vendor_product_id).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Check for existing open thread
  const { data: existing } = await db.from('quote_threads')
    .select('id').eq('consultant_id', user.id)
    .eq('vendor_product_id', vendor_product_id)
    .not('status', 'eq', 'declined').not('status', 'eq', 'expired')
    .single()

  let threadId = existing?.id

  if (!threadId) {
    const { data: thread, error } = await db.from('quote_threads').insert({
      consultant_id:     user.id,
      vendor_id:         product.vendor_id,
      vendor_product_id,
      project_id:        project_id || null,
      status:            'open',
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    threadId = thread.id
  }

  // Add first message
  const { data: msg, error: msgErr } = await db.from('quote_messages').insert({
    thread_id:   threadId,
    sender_id:   user.id,
    sender_role: 'consultant',
    message,
  }).select().single()

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })

  // Notify vendor
  await db.from('notifications').insert({
    user_id: user.id, // will be replaced with vendor user_id via trigger ideally
    type:    'quote_request',
    title:   'New Quote Request',
    body:    message.substring(0, 100),
    data:    { thread_id: threadId, vendor_product_id },
  }).catch(() => {})

  return NextResponse.json({ thread_id: threadId, message: msg })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabase as any

  const { data } = await db.from('quote_threads')
    .select('*, vendor_profiles(company_name), vendor_products(name, price_per_day)')
    .eq('consultant_id', user.id).order('updated_at', { ascending: false })

  return NextResponse.json({ data })
}
