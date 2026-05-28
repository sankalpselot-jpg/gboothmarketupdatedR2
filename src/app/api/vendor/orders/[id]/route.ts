import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientUntyped } from '@/lib/supabase/admin'
import { notifyOrderStatus } from '@/lib/utils/notify'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createAdminClientUntyped()
  const { data, error } = await db
    .from('vendor_orders').select('*, vendor_order_items(*)')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, vendor_notes } = body
  const db = createAdminClientUntyped()

  // Get current order + vendor profile for notification
  const { data: order } = await db
    .from('vendor_orders')
    .select('*, vendor_profiles(company_name, user_id)')
    .eq('id', id).single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Verify vendor owns this order
  const vp = Array.isArray(order.vendor_profiles) ? order.vendor_profiles[0] : order.vendor_profiles
  if (vp?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update order
  const { error } = await db.from('vendor_orders')
    .update({ status, vendor_notes: vendor_notes || null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Record status history
  await db.from('order_status_history').insert({
    vendor_order_id: id,
    status,
    note:       vendor_notes || null,
    changed_by: user.id,
  })

  // Send notification to consultant
  if (status !== order.status) {
    await notifyOrderStatus({
      consultantId:  order.consultant_id,
      vendorOrderId: id,
      orderNumber:   order.order_number,
      newStatus:     status,
      vendorName:    vp?.company_name || 'Vendor',
      note:          vendor_notes,
    })
  }

  return NextResponse.json({ success: true })
}
