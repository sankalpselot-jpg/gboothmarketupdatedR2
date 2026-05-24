import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Categories' }

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories').select('*, products(count)').order('sort_order')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy">Categories</h1>
        <p className="text-[13px] text-[#6B6B6B]">{categories?.length || 0} categories</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-[#DDD8CF]">
              {['Order', 'Name', 'Slug', 'Icon', 'Products', 'Description'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories?.map(cat => (
              <tr key={cat.id} className="border-b border-cream-dark hover:bg-cream/40 transition-colors">
                <td className="px-5 py-3 text-[#6B6B6B] text-center font-mono text-sm">{cat.sort_order}</td>
                <td className="px-5 py-3 font-medium text-navy">{cat.name}</td>
                <td className="px-5 py-3 font-mono text-[12px] text-[#6B6B6B]">{cat.slug}</td>
                <td className="px-5 py-3 text-[#6B6B6B] text-[12.5px]">{cat.icon || '—'}</td>
                <td className="px-5 py-3">
                  <span className="bg-cream-dark text-navy text-[12px] px-2.5 py-1 rounded-full font-medium">
                    {(cat as any).products?.[0]?.count ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3 text-[#6B6B6B] text-[12.5px] max-w-[220px] truncate">{cat.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12.5px] text-[#6B6B6B] mt-4">
        Categories are managed via the Supabase dashboard or seed SQL. Contact your developer to add or reorder categories.
      </p>
    </div>
  )
}
