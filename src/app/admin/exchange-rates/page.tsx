'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, Save } from 'lucide-react'

const CURRENCIES = ['EUR','GBP','USD','INR']

export default function AdminExchangeRatesPage() {
  const [rates,   setRates]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [edits,   setEdits]   = useState<Record<string, string>>({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/exchange-rates')
      .then(r => r.json())
      .then(({ data }) => { setRates(data || []); setLoading(false) })
  }, [])

  const getRate = (from: string, to: string) => {
    const key  = `${from}_${to}`
    if (edits[key] !== undefined) return edits[key]
    const found = rates.find(r => r.from_currency === from && r.to_currency === to)
    return found?.rate?.toString() || ''
  }

  const setRate = (from: string, to: string, val: string) => {
    setEdits(e => ({ ...e, [`${from}_${to}`]: val }))
  }

  const handleSave = async () => {
    setSaving(true)
    const pairs = Object.entries(edits)
    for (const [key, val] of pairs) {
      const [from, to] = key.split('_')
      if (!val || from === to) continue
      await fetch('/api/admin/exchange-rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_currency: from, to_currency: to, rate: parseFloat(val) }),
      })
    }
    // Refresh
    const { data } = await fetch('/api/admin/exchange-rates').then(r => r.json())
    setRates(data || [])
    setEdits({})
    toast.success('Exchange rates updated')
    setSaving(false)
  }

  const inputCls = 'w-full border border-[#DDD8CF] rounded px-3 py-2 text-sm outline-none focus:border-navy transition-colors'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">Exchange Rates</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">
            Used for automatic regional price conversion. Manually update or integrate a daily refresh API.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving || Object.keys(edits).length === 0}
            className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-60">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-[13px] text-blue-800">
        <strong>How it works:</strong> When a vendor sets a base price (e.g. ₹10,000 INR), the system automatically converts to all service regions using these rates. Vendors can override individual regions manually.
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B]">Loading rates…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream border-b border-[#DDD8CF]">
                <th className="text-left px-5 py-3.5 font-semibold text-navy">From ↓ / To →</th>
                {CURRENCIES.map(c => (
                  <th key={c} className="text-center px-4 py-3.5 font-semibold text-navy">{c}</th>
                ))}
                <th className="text-left px-5 py-3.5 font-semibold text-navy">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.map(from => (
                <tr key={from} className="border-b border-cream-dark">
                  <td className="px-5 py-3.5 font-semibold text-navy">{from}</td>
                  {CURRENCIES.map(to => (
                    <td key={to} className="px-4 py-3">
                      {from === to ? (
                        <div className="text-center text-[#DDD8CF] text-lg">—</div>
                      ) : (
                        <input
                          type="number" step="0.000001" min="0"
                          value={getRate(from, to)}
                          onChange={e => setRate(from, to, e.target.value)}
                          className={`${inputCls} text-center w-24`}
                          placeholder="0.000000"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-[#6B6B6B] text-[12px]">
                    {rates.find(r => r.from_currency === from)?.updated_at
                      ? new Date(rates.find(r => r.from_currency === from).updated_at)
                          .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-cream border border-[#DDD8CF] rounded-xl p-5">
        <h2 className="font-display font-bold text-navy text-sm mb-3">Future: Automatic Daily Refresh</h2>
        <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
          To auto-update rates daily, create a Supabase Edge Function that calls an exchange rate API
          (e.g. <strong>exchangerate-api.com</strong> or <strong>openexchangerates.org</strong>) and upserts into this table.
          Schedule it with <strong>pg_cron</strong> or a Vercel cron job.
        </p>
      </div>
    </div>
  )
}
