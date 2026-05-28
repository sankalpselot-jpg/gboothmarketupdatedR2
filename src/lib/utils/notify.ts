import { createAdminClientUntyped } from '@/lib/supabase/admin'

type NotificationType =
  | 'new_order' | 'order_status' | 'delivery_reminder'
  | 'pickup_reminder' | 'emergency_request' | 'system'

export async function createNotification({
  userId,
  type,
  title,
  body,
  data = {},
}: {
  userId:  string
  type:    NotificationType
  title:   string
  body?:   string
  data?:   Record<string, any>
}) {
  const db = createAdminClientUntyped()
  const { error } = await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body:    body    || null,
    data:    data    || {},
    is_read: false,
  })
  if (error) console.error('[notify] Failed to create notification:', error.message)

  // Email hook — activate by setting SENDGRID_API_KEY in Vercel env vars
  if (process.env.SENDGRID_API_KEY) {
    try {
      // TODO: implement email sending with SendGrid
      // const sgMail = require('@sendgrid/mail')
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      console.log('[notify] Email would be sent to user:', userId, '—', title)
    } catch (err) {
      console.error('[notify] Email send failed:', err)
    }
  }
}

export async function notifyOrderStatus({
  consultantId,
  vendorOrderId,
  orderNumber,
  newStatus,
  vendorName,
  note,
}: {
  consultantId:   string
  vendorOrderId:  string
  orderNumber:    string
  newStatus:      string
  vendorName:     string
  note?:          string
}) {
  const STATUS_LABELS: Record<string, string> = {
    quote_sent:    'Quote Sent',
    accepted:      'Order Accepted',
    in_production: 'In Production',
    packed:        'Packed & Ready',
    in_transit:    'In Transit',
    delivered:     'Delivered',
    completed:     'Completed',
    cancelled:     'Cancelled',
  }
  const label = STATUS_LABELS[newStatus] || newStatus

  await createNotification({
    userId: consultantId,
    type:   'order_status',
    title:  `Order ${orderNumber} — ${label}`,
    body:   note
      ? `${vendorName}: ${note}`
      : `${vendorName} updated your order to "${label}"`,
    data: { vendor_order_id: vendorOrderId, status: newStatus },
  })
}

export async function notifyNewOrder({
  vendorUserId,
  orderNumber,
  consultantName,
  projectName,
  total,
  currency,
  vendorOrderId,
}: {
  vendorUserId:   string
  orderNumber:    string
  consultantName: string
  projectName:    string
  total:          number
  currency:       string
  vendorOrderId:  string
}) {
  const sym: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£', USD: '$' }
  await createNotification({
    userId: vendorUserId,
    type:   'new_order',
    title:  `New Order — ${orderNumber}`,
    body:   `${consultantName} placed an order for ${projectName} · ${sym[currency] || ''}${total.toLocaleString()}`,
    data:   { vendor_order_id: vendorOrderId, order_number: orderNumber },
  })
}

export async function notifyDeliveryReminder({
  userId,
  orderNumber,
  deliveryDate,
  venueName,
  vendorOrderId,
  type,
}: {
  userId:        string
  orderNumber:   string
  deliveryDate:  string
  venueName?:    string
  vendorOrderId: string
  type:          'delivery_reminder' | 'pickup_reminder'
}) {
  const isDelivery = type === 'delivery_reminder'
  await createNotification({
    userId,
    type,
    title: isDelivery
      ? `Delivery Tomorrow — ${orderNumber}`
      : `Pickup Tomorrow — ${orderNumber}`,
    body: isDelivery
      ? `Your order is scheduled for delivery tomorrow${venueName ? ` at ${venueName}` : ''}`
      : `Items from order ${orderNumber} are scheduled for pickup/return tomorrow`,
    data: { vendor_order_id: vendorOrderId, date: deliveryDate },
  })
}
