'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Clock, MapPin, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VendorEmergencyPage() {
  const db = useMemo(() => createClient() as any, [])
  const [requests,  setRequests]  = useState<any[]>([])
  const [responses, setResponses] = useState<Record<string, boolean>>({})
  const [loading,   setLoading]   = useState(true)
  const [vendorId,  setVendorId]  = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      setVendorId(vp.id)

      const [{ data: reqs }, { data: resp }] = await Promise.all([
        db.from('emergency_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }),
        db.from('emergency_responses').select('emergency_request_id').eq('vendor_id', vp.id),
      ])

      setRequests(reqs || [])
      const respMap: Record<string, boolean> = {}
      for (const r of (resp || [])) respMap[r.emergency_request_id] = true
      setResponses(respMap)
      setLoading(false)
    }
    load()
  }, [db])

  const handleRespond = async (requestId: string, canFulfill: boolean) => {
    if (!vendorId) return
    const { error } = await db.from('emergency_responses').insert({
      emergency_request_id: requestId,
      vendor_id:   vendorId,
      can_fulfill: canFulfill,
    })
    if (error) { toast.error(error.message); return }
    setResponses(r => ({ ...r, [requestId]: true }))
    toast.success(canFulfill ? 'Response sent! Consultant will be notified.' : 'Response recorded.')
  }

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hrs = Math.floor(diff / 3600000)
    const min = Math.floor((diff % 3600000) / 60000)
    return hrs > 0 ? `${hrs}h ${min}m left` : `${min}m left`
  }

  return (
    <div className="p-8 text-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-red-400" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-white">Emergency Requests</h1>
      </div>
      <p className="text-white/40 text-sm mb-8 ml-11">Urgent requirements from consultants — respond quickly to win the business</p>

      {loading ? (
        <div className="text-center py-20 text-white/30">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-16 text-center">
          <Zap size={36} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm">No open emergency requests right now</p>
          <p className="text-white/20 text-[12px] mt-1">Check back soon — urgent requests expire within 24 hours</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const responded = responses[req.id]
            const expired   = new Date(req.expires_at) < new Date()
            return (
              <div key={req.id} className={`bg-white/5 border rounded-xl p-6 ${responded ? 'border-white/5 opacity-60' : 'border-red-500/20 hover:border-red-500/30 transition-colors'}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!responded && !expired && (
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                      )}
                      <h3 className="font-display font-bold text-white text-base">{req.title}</h3>
                    </div>
                    {req.description && <p className="text-white/50 text-[13px] leading-relaxed">{req.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
                    <Clock size={11} />
                    {timeLeft(req.expires_at)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-5 text-[12.5px]">
                  {req.category && (
                    <span className="flex items-center gap-1.5 text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                      <Package size={11} /> {req.category}
                    </span>
                  )}
                  {req.quantity && (
                    <span className="text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                      Qty: {req.quantity}
                    </span>
                  )}
                  {(req.city || req.venue) && (
                    <span className="flex items-center gap-1.5 text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                      <MapPin size={11} /> {req.city || req.venue}
                    </span>
                  )}
                  {req.region && (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${req.region === 'IN' ? 'bg-orange-500/15 text-orange-400' : req.region === 'EU' ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>
                      {req.region}
                    </span>
                  )}
                  {req.required_date && (
                    <span className="text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                      Required: {new Date(req.required_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {req.budget && (
                    <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full font-medium">
                      Budget: ₹{req.budget.toLocaleString()}
                    </span>
                  )}
                </div>

                {responded ? (
                  <div className="flex items-center gap-2 text-[12.5px] text-white/30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    You have already responded to this request
                  </div>
                ) : expired ? (
                  <p className="text-[12.5px] text-white/20">This request has expired</p>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => handleRespond(req.id, true)}
                      className="flex-1 bg-green-500/15 border border-green-500/25 text-green-400 font-semibold py-2.5 rounded-lg hover:bg-green-500/25 transition-colors text-sm">
                      ✓ I Can Fulfil This
                    </button>
                    <button onClick={() => handleRespond(req.id, false)}
                      className="bg-white/5 border border-white/10 text-white/40 font-medium py-2.5 px-5 rounded-lg hover:bg-white/10 transition-colors text-sm">
                      Not Available
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
