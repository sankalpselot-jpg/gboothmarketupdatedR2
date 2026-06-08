'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Truck, RefreshCw, Calendar, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function DeliverySchedulePage() {
  const params = useParams()
  const db     = useMemo(() => createClient() as any, [])
  const [project,   setProject]   = useState<any>(null)
  const [items,     setItems]     = useState<any[]>([])
  const [slas,      setSlas]      = useState<Record<string, any>>({})
  const [saving,    setSaving]    = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await db.from('projects').select('*').eq('id', params.id).single()
      if (!proj) return
      setProject(proj)

      const { data: its } = await db.from('project_items')
        .select('*, vendor_products(name, vendor_id, vendor_profiles(company_name, id)), product_images(url, is_primary)')
        .eq('project_id', params.id)

      const normalized = (its || []).map((i: any) => ({
        ...i,
        vendor_products: {
          ...(Array.isArray(i.vendor_products) ? i.vendor_products[0] : i.vendor_products),
          vendor_profiles: Array.isArray(i.vendor_products?.vendor_profiles)
            ? i.vendor_products.vendor_profiles[0]
            : i.vendor_products?.vendor_profiles,
        },
      }))
      setItems(normalized)

      // Load SLAs for each unique vendor
      const vendorIds = [...new Set(normalized.map((i: any) => i.vendor_products?.vendor_profiles?.id).filter(Boolean))]
      if (vendorIds.length) {
        const { data: slaData } = await db.from('vendor_slas').select('*').in('vendor_id', vendorIds)
        const slaMap: Record<string, any> = {}
        for (const s of slaData || []) slaMap[s.vendor_id] = s
        setSlas(slaMap)
      }

      setLoading(false)
    }
    load()
  }, [params.id, db])

  const updateSchedule = async (itemId: string, field: string, value: string) => {
    setSaving(itemId)
    await db.from('project_items').update({ [field]: value || null }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))
    toast.success('Schedule updated')
    setSaving(null)
  }

  if (loading) return <div className="p-8 text-[#6B6B6B] text-sm">Loading schedule…</div>
  if (!project) return <div className="p-8 text-[#6B6B6B] text-sm">Project not found</div>

  // Group by vendor
  const byVendor: Record<string, { vendor: any; sla: any; items: any[] }> = {}
  for (const item of items) {
    const vp  = item.vendor_products?.vendor_profiles
    const vid = vp?.id || 'unknown'
    if (!byVendor[vid]) {
      byVendor[vid] = { vendor: vp, sla: slas[vid] || null, items: [] }
    }
    byVendor[vid].items.push(item)
  }

  const eventStart = project.start_date ? new Date(project.start_date) : null
  const eventEnd   = project.end_date   ? new Date(project.end_date)   : null

  return (
    <div className="p-8 max-w-[900px]">
      <Link href={`/projects/${params.id}`} className="flex items-center gap-2 text-[#6B6B6B] hover:text-navy text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Project
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Delivery Schedule</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">{project.name}</p>
        </div>
        {eventStart && (
          <div className="bg-[#F9F6F0] border border-[#DDD8CF] rounded-xl px-4 py-3 text-right">
            <p className="text-[12px] text-[#6B6B6B]">Event dates</p>
            <p className="font-semibold text-navy text-sm">
              {eventStart.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              {eventEnd && ` — ${eventEnd.toLocaleDateString('en-GB', { day:'numeric', month:'short' })}`}
            </p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-12 text-center">
          <Truck size={36} className="mx-auto mb-4 text-[#DDD8CF]" />
          <p className="font-display font-bold text-navy mb-2">No items in this project</p>
          <Link href={`/projects/${params.id}`} className="text-gold hover:text-gold-light text-sm">Add items →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byVendor).map(([vid, group]) => {
            const sla = group.sla
            const expectedDelivery = eventStart && sla
              ? new Date(eventStart.getTime() - sla.delivery_hours * 3600000)
              : null
            const expectedPickup = eventEnd && sla
              ? new Date(eventEnd.getTime() + sla.pickup_hours * 3600000)
              : null

            // Check for clashes: delivery within 2h of another vendor
            const otherDeliveries = Object.entries(byVendor)
              .filter(([k]) => k !== vid)
              .map(([, g]) => g.sla ? new Date((eventStart?.getTime() || 0) - (g.sla.delivery_hours || 24) * 3600000) : null)
              .filter(Boolean) as Date[]

            const hasClash = expectedDelivery && otherDeliveries.some(d =>
              Math.abs(d.getTime() - expectedDelivery.getTime()) < 2 * 3600000
            )

            return (
              <div key={vid} className="bg-white border border-[#DDD8CF] rounded-xl overflow-hidden">
                {/* Vendor header */}
                <div className="px-5 py-4 bg-[#F9F6F0] border-b border-[#DDD8CF]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {group.vendor?.company_name?.[0]?.toUpperCase() || 'V'}
                      </div>
                      <div>
                        <p className="font-display font-bold text-navy">{group.vendor?.company_name || 'Vendor'}</p>
                        <p className="text-[12px] text-[#6B6B6B]">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* SLA-based timing */}
                    {sla && eventStart && (
                      <div className="flex gap-4 text-[12px]">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${hasClash ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                          <Truck size={12} />
                          <span>Delivery: <strong>{expectedDelivery?.toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</strong></span>
                          {hasClash && <AlertCircle size={12} className="text-amber-500 ml-1" />}
                        </div>
                        {expectedPickup && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-purple-50 border-purple-100 text-purple-700">
                            <RefreshCw size={12} />
                            <span>Pickup: <strong>{expectedPickup.toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                    {hasClash && (
                      <div className="w-full flex items-center gap-2 text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertCircle size={13} />
                        Delivery time overlaps with another vendor — coordinate access with venue
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-[#F0ECE4]">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy text-[13.5px]">{item.vendor_products?.name}</p>
                        <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                          {item.quantity} unit{item.quantity !== 1 ? 's' : ''} · {item.days} day{item.days !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <div>
                          <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1">Delivery slot</label>
                          <input type="datetime-local"
                            defaultValue={item.scheduled_delivery ? item.scheduled_delivery.slice(0,16) : ''}
                            onBlur={e => updateSchedule(item.id, 'scheduled_delivery', e.target.value)}
                            className="border border-[#DDD8CF] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-navy transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1">Pickup slot</label>
                          <input type="datetime-local"
                            defaultValue={item.scheduled_pickup ? item.scheduled_pickup.slice(0,16) : ''}
                            onBlur={e => updateSchedule(item.id, 'scheduled_pickup', e.target.value)}
                            className="border border-[#DDD8CF] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-navy transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-display font-bold text-navy text-sm mb-3">Delivery Planning Tips</h3>
            <ul className="space-y-2 text-[13px] text-[#6B6B6B]">
              <li className="flex items-start gap-2"><span className="text-gold mt-0.5">•</span> Schedule deliveries at least 4h apart to avoid access clashes at the loading bay</li>
              <li className="flex items-start gap-2"><span className="text-gold mt-0.5">•</span> Larger items (furniture, video walls) should arrive before smaller items</li>
              <li className="flex items-start gap-2"><span className="text-gold mt-0.5">•</span> Confirm venue access hours before confirming delivery times with vendors</li>
              <li className="flex items-start gap-2"><span className="text-gold mt-0.5">•</span> Collection slots: most venues require all items removed within 24h of event close</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
