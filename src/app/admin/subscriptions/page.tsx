'use client'
import { useState, useEffect } from 'react'
import { Star, Crown, Shield, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const TIER_CONFIG = {
  free:       { label: 'Free',       color: 'text-gray-500',  bg: 'bg-gray-50',   border: 'border-gray-200' },
  premium:    { label: 'Premium',    color: 'text-gold',      bg: 'bg-amber-50',  border: 'border-amber-200' },
  enterprise: { label: 'Enterprise', color: 'text-purple-600',bg: 'bg-purple-50', border: 'border-purple-200' },
}

export default function AdminSubscriptionsPage() {
  const [users,   setUsers]   = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [tab,     setTab]     = useState<'vendors'|'consultants'|'plans'>('vendors')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profiles').then(r => r.json()).then(({ data }) => {
      const all       = data || []
      setUsers(all.filter((u: any) => u.user_type === 'consultant'))
      setLoading(false)
    })
    // Fetch vendor profiles
    fetch('/api/vendor-products?action=vendors').then(r => r.json()).catch(() => {}).then((d: any) => {
      if (d?.data) setVendors(d.data)
    })
  }, [])

  const assignTier = async (userId: string, tier: string, type: 'profile' | 'vendor') => {
    setSaving(userId)
    await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, tier, type }),
    })
    if (type === 'profile') {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u))
    } else {
      setVendors(prev => prev.map(v => v.user_id === userId ? { ...v, subscription_tier: tier } : v))
    }
    toast.success(`Tier updated to ${tier}`)
    setSaving(null)
  }

  const TierBadge = ({ tier }: { tier: string }) => {
    const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.free
    return (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${cfg.color} ${cfg.bg} ${cfg.border}`}>
        {tier === 'premium' && '⭐ '}{tier === 'enterprise' && '👑 '}{cfg.label}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">Subscription Management</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Assign premium tiers to vendors and consultants. Subscriptions not yet active for self-service.</p>
      </div>

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-[13px] text-blue-800">
          <strong>Framework Mode:</strong> Subscription tiers are admin-assigned only. Self-service payment activation is not yet enabled.
          When the subscription system launches, vendors and consultants will be able to upgrade directly.
          Until then, all premium status must be granted here by admins.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream border border-[#DDD8CF] rounded-lg p-1 mb-6 w-fit">
        {[
          { id: 'vendors',     label: '🏪 Vendors' },
          { id: 'consultants', label: '🗂 Consultants' },
          { id: 'plans',       label: '📋 Plans' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-navy' : 'text-[#6B6B6B] hover:text-navy'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'vendors' || tab === 'consultants') && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream border-b border-[#DDD8CF]">
                <th className="text-left px-4 py-3 font-semibold text-navy">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Company</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Current Tier</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Assign Tier</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#6B6B6B] text-sm">Loading…</td></tr>
              ) : (tab === 'consultants' ? users : vendors).map((u: any) => (
                <tr key={u.id || u.user_id} className="border-b border-cream-dark hover:bg-cream/40">
                  <td className="px-4 py-3 font-medium text-navy">{u.full_name || u.company_name || '—'}</td>
                  <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">{u.company_name || '—'}</td>
                  <td className="px-4 py-3"><TierBadge tier={u.subscription_tier || 'free'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {['free','premium','enterprise'].map(tier => (
                        <button key={tier} onClick={() => assignTier(u.id || u.user_id, tier, tab === 'consultants' ? 'profile' : 'vendor')}
                          disabled={saving === (u.id || u.user_id) || u.subscription_tier === tier}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all capitalize disabled:opacity-40 ${
                            u.subscription_tier === tier ? 'bg-navy text-white border-navy' : 'border-[#DDD8CF] hover:border-navy text-[#6B6B6B] hover:text-navy'
                          }`}>
                          {saving === (u.id || u.user_id) ? '…' : tier}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              tier: 'premium', role: 'vendor', name: 'Vendor Premium',
              price: '€49/mo', annual: '€490/yr',
              benefits: ['Priority listing placement','Featured vendor placement','Premium badge','Homepage exposure','Advanced analytics','Preferred RFQ routing'],
              icon: Star, color: 'border-amber-200 bg-amber-50',
            },
            {
              tier: 'enterprise', role: 'vendor', name: 'Vendor Enterprise',
              price: '€149/mo', annual: '€1,490/yr',
              benefits: ['All Premium benefits','Dedicated account manager','Custom branded profile','API access','White-glove onboarding'],
              icon: Crown, color: 'border-purple-200 bg-purple-50',
            },
            {
              tier: 'premium', role: 'consultant', name: 'Consultant Premium',
              price: '€29/mo', annual: '€290/yr',
              benefits: ['Priority support','Faster vendor matching','Multi-project dashboard','Advanced procurement','Preferred vendor access'],
              icon: Shield, color: 'border-blue-200 bg-blue-50',
            },
          ].map(plan => (
            <div key={plan.name} className={`card border ${plan.color} p-6`}>
              <div className="flex items-center gap-2 mb-1">
                <plan.icon size={18} className="text-gold" />
                <h3 className="font-display font-bold text-navy">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="font-display font-extrabold text-2xl text-navy">{plan.price}</span>
                <span className="text-[#6B6B6B] text-[13px] ml-2">or {plan.annual}</span>
              </div>
              <div className="space-y-2 mb-4">
                {plan.benefits.map(b => (
                  <div key={b} className="flex items-start gap-2 text-[13px] text-[#6B6B6B]">
                    <span className="text-gold mt-0.5">✓</span> {b}
                  </div>
                ))}
              </div>
              <div className="bg-white/70 border border-[#DDD8CF] rounded-lg px-3 py-2 text-[11.5px] text-[#6B6B6B] text-center">
                🔒 Not yet active — admin-assign only
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
