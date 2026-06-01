'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Clock, Truck, RefreshCw, Headphones, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SLA_OPTIONS = {
  delivery:    [12, 24, 48, 72],
  pickup:      [12, 24, 48, 72],
  support:     [0.5, 1, 2, 4, 8],
  replacement: [2, 4, 8, 24],
}

const formatHours = (h: number) =>
  h < 1 ? `${h * 60} min` : h === 1 ? '1 hr' : `${h} hrs`

export default function VendorSLAPage() {
  const db = useMemo(() => createClient() as any, [])
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [form, setForm] = useState({
    delivery_hours:           24,
    pickup_hours:             24,
    support_response_hours:   4,
    replacement_hours:        8,
    onsite_support_available: false,
    onsite_support_note:      '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      setVendorId(vp.id)
      const { data: sla } = await db.from('vendor_slas').select('*').eq('vendor_id', vp.id).single()
      if (sla) {
        setForm({
          delivery_hours:           sla.delivery_hours,
          pickup_hours:             sla.pickup_hours,
          support_response_hours:   sla.support_response_hours,
          replacement_hours:        sla.replacement_hours,
          onsite_support_available: sla.onsite_support_available,
          onsite_support_note:      sla.onsite_support_note || '',
        })
      }
    }
    load()
  }, [db])

  const handleSave = async () => {
    if (!vendorId) return
    setSaving(true)
    const { error } = await db.from('vendor_slas').upsert({
      vendor_id: vendorId, ...form,
      onsite_support_note: form.onsite_support_note || null,
    }, { onConflict: 'vendor_id' })
    if (error) { toast.error(error.message); setSaving(false); return }
    setSaved(true)
    toast.success('SLA commitments saved — displayed on your product listings')
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3'

  const SLAOption = ({ value, options, onChange, label }: {
    value: number; options: number[]; onChange: (v: number) => void; label: string
  }) => (
    <div className="bg-white/3 border border-white/8 rounded-xl p-5">
      <p className={labelCls}>{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
              value === opt
                ? 'bg-gold/20 border-gold/50 text-gold-light'
                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
            }`}>
            {formatHours(opt)}
          </button>
        ))}
      </div>
      <p className="text-[11.5px] text-white/25 mt-2">
        Currently: <span className="text-gold-light font-medium">{formatHours(value)}</span>
      </p>
    </div>
  )

  return (
    <div className="p-8 text-white max-w-[760px]">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} className="text-gold-light" />
        <h1 className="font-display font-extrabold text-2xl text-white">SLA Commitments</h1>
      </div>
      <p className="text-white/40 text-sm mb-8 ml-9">
        These commitments appear on all your product listings. Strong SLAs increase consultant confidence and bookings.
      </p>

      {/* Why SLAs matter */}
      <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <CheckCircle size={16} className="text-gold-light flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-gold-light leading-relaxed">
          Consultants rank vendors by operational reliability. Vendors with published SLAs receive <strong>3× more orders</strong> than those without.
        </p>
      </div>

      <div className="space-y-4">
        {/* Delivery */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-blue-400" />
            <h2 className="font-display font-bold text-white text-sm">Delivery SLA</h2>
          </div>
          <p className="text-[12.5px] text-white/40 mb-4">How many hours before the event start will you deliver?</p>
          <div className="flex gap-2 flex-wrap">
            {SLA_OPTIONS.delivery.map(opt => (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, delivery_hours: opt }))}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                  form.delivery_hours === opt
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                }`}>
                {opt}h before event
              </button>
            ))}
          </div>
        </div>

        {/* Pickup */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-purple-400" />
            <h2 className="font-display font-bold text-white text-sm">Pickup SLA</h2>
          </div>
          <p className="text-[12.5px] text-white/40 mb-4">How many hours after event end will you collect the items?</p>
          <div className="flex gap-2 flex-wrap">
            {SLA_OPTIONS.pickup.map(opt => (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, pickup_hours: opt }))}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                  form.pickup_hours === opt
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                }`}>
                within {opt}h after event
              </button>
            ))}
          </div>
        </div>

        {/* Support response */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Headphones size={16} className="text-green-400" />
            <h2 className="font-display font-bold text-white text-sm">Support Response SLA</h2>
          </div>
          <p className="text-[12.5px] text-white/40 mb-4">Maximum time to respond to a support request during the event.</p>
          <div className="flex gap-2 flex-wrap">
            {SLA_OPTIONS.support.map(opt => (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, support_response_hours: opt }))}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                  form.support_response_hours === opt
                    ? 'bg-green-500/20 border-green-500/50 text-green-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                }`}>
                {formatHours(opt)}
              </button>
            ))}
          </div>
        </div>

        {/* Replacement */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-amber-400" />
            <h2 className="font-display font-bold text-white text-sm">Replacement SLA</h2>
          </div>
          <p className="text-[12.5px] text-white/40 mb-4">If an item fails, how quickly can you provide a replacement?</p>
          <div className="flex gap-2 flex-wrap">
            {SLA_OPTIONS.replacement.map(opt => (
              <button key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, replacement_hours: opt }))}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                  form.replacement_hours === opt
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'
                }`}>
                within {opt}h
              </button>
            ))}
          </div>
        </div>

        {/* On-site support */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-gold-light" />
              <h2 className="font-display font-bold text-white text-sm">On-site Support Available</h2>
              <span className="text-[9px] font-bold bg-gold/20 text-gold-light px-2 py-0.5 rounded-full">PREMIUM</span>
            </div>
            <div
              style={{ width: 44, height: 24 }}
              className={`rounded-full relative cursor-pointer transition-colors ${form.onsite_support_available ? 'bg-gold' : 'bg-white/15'}`}
              onClick={() => setForm(f => ({ ...f, onsite_support_available: !f.onsite_support_available }))}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-all ${form.onsite_support_available ? 'left-[22px]' : 'left-[2px]'}`} />
            </div>
          </div>
          <p className="text-[12.5px] text-white/40 mb-3">
            Vendor provides a technician or standby equipment at the venue. Highly valued by consultants for large exhibitions.
          </p>
          {form.onsite_support_available && (
            <textarea
              value={form.onsite_support_note}
              onChange={e => setForm(f => ({ ...f, onsite_support_note: e.target.value }))}
              placeholder="e.g. Dedicated technician for events over 3 days. Standby TV and backup PA system included."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none min-h-[80px] mt-1"
            />
          )}
        </div>

        {/* SLA Preview */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-4">
            Preview — How this appears on your product listings
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-[11.5px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full">
              <Truck size={11} /> Delivery {form.delivery_hours}h before event
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full">
              <RefreshCw size={11} /> Pickup within {form.pickup_hours}h after
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] bg-green-500/10 border border-green-500/20 text-green-300 px-3 py-1.5 rounded-full">
              <Headphones size={11} /> Support: {formatHours(form.support_response_hours)} response
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full">
              <RefreshCw size={11} /> Replacement within {form.replacement_hours}h
            </span>
            {form.onsite_support_available && (
              <span className="flex items-center gap-1.5 text-[11.5px] bg-gold/15 border border-gold/30 text-gold-light px-3 py-1.5 rounded-full font-semibold">
                <Shield size={11} /> On-site Support Available
              </span>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold py-4 rounded-xl transition-colors disabled:opacity-60 text-base">
          {saving ? 'Saving…' : saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save SLA Commitments</>}
        </button>
      </div>
    </div>
  )
}
