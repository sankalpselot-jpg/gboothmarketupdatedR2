export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Products' }

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('products')
    .select('id, name, slug, badge, price_eur, price_gbp, price_inr, available_regions, is_active, is_featured, category_id')
    .order('created_at', { ascending: false })

  // Fetch categories separately — avoids join array normalisation complexity
  const { data: categoriesRaw } = await supabase
    .from('categories').select('id, name')

  const catMap = new Map((categoriesRaw || []).map(c => [c.id, c.name]))
  const products = raw || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">Products</h1>
        <Link href="/admin/products/new" className="btn-primary px-5 py-2.5 text-sm">+ Add Product</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-[#DDD8CF]">
              {['Product', 'Category', 'EUR', 'GBP', 'INR', 'Regions', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-navy text-[13.5px]">{p.name}</div>
                  {p.badge && (
                    <span className="text-[10px] bg-navy text-white px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {p.badge}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6B6B6B] text-[12.5px]">
                  {p.category_id ? (catMap.get(p.category_id) ?? '—') : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px] text-navy">€{p.price_eur.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-[12.5px] text-navy">£{p.price_gbp.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-[12.5px] text-navy">₹{p.price_inr.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(p.available_regions as string[]).map(r => (
                      <span key={r} className={r === 'EU' ? 'tag-eu' : r === 'UK' ? 'tag-uk' : 'tag-in'}>{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-gold hover:text-gold-light text-[12.5px]">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
