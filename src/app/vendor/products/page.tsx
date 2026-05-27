'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Package, Edit, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import type { VendorProduct } from '@/types/database'

export default function VendorProductsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
      if (!vp) return
      setVendorId(vp.id)
      const { data } = await db.from('vendor_products').select('*').eq('vendor_id', vp.id).order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [db])

  const toggleActive = async (product: VendorProduct) => {
    await db.from('vendor_products').update({ is_active: !product.is_active }).eq('id', product.id)
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    toast.success(product.is_active ? 'Product hidden' : 'Product visible')
  }

  const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">My Products</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/vendor/products/new"
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30">Loading…</div>
      ) : products.length === 0 ? (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-16 text-center">
          <Package size={40} className="mx-auto mb-4 text-white/20" />
          <p className="text-white font-display font-bold text-xl mb-2">No products yet</p>
          <p className="text-white/30 text-sm mb-6">Add your first rental item to start receiving orders from consultants.</p>
          <Link href="/vendor/products/new" className="bg-gold hover:bg-gold-light text-navy font-bold px-6 py-3 rounded-lg inline-block transition-colors">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {['Product', 'Category', 'Price / Day', 'Stock', 'Regions', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-[13.5px]">{p.name}</p>
                    {p.badge && <span className="text-[10px] bg-gold/20 text-gold-light px-2 py-0.5 rounded mt-0.5 inline-block">{p.badge}</span>}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-[12.5px]">{p.category || '—'}</td>
                  <td className="px-5 py-4 font-mono font-semibold text-white text-[13px]">
                    {SYM[p.currency]}{p.price_per_day.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[12.5px] font-medium ${p.available_stock === 0 ? 'text-red-400' : p.available_stock <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {p.available_stock}/{p.total_stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {(p.regions as string[]).map(r => (
                        <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r === 'IN' ? 'bg-orange-500/15 text-orange-400' : r === 'EU' ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActive(p)}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${p.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'}`}>
                      {p.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
                      {p.is_active ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/vendor/products/${p.id}`}
                      className="flex items-center gap-1.5 text-[12.5px] text-gold-light hover:text-gold transition-colors">
                      <Edit size={13} /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
