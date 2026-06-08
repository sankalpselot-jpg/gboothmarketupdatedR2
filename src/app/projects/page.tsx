'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FolderOpen, Plus, MapPin, Calendar, Trash2, Copy, Heart, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-500',
  active:    'bg-blue-50 text-blue-700',
  ordered:   'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}
const SYM: Record<string, string> = { INR: '₹', EUR: '€', GBP: '£' }

export default function ProjectsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [projects,    setProjects]    = useState<any[]>([])
  const [wishlist,    setWishlist]    = useState<string[]>([])
  const [loading,     setLoading]     = useState(true)
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [showImport,  setShowImport]  = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      const { data } = await db.from('projects')
        .select('*, project_items(count)')
        .eq('consultant_id', user.id)
        .order('updated_at', { ascending: false })
      setProjects(data || [])
      // Load wishlist from localStorage
      try {
        const stored = localStorage.getItem('bm-wishlist')
        if (stored) setWishlist(JSON.parse(stored))
      } catch {}
      setLoading(false)
    }
    load()
  }, [db])

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Delete project "${name}"? This removes all items added to it.`)) return
    setDeleting(id)
    await db.from('project_items').delete().eq('project_id', id)
    await db.from('projects').delete().eq('id', id)
    setProjects(ps => ps.filter(p => p.id !== id))
    toast.success('Project deleted')
    setDeleting(null)
  }

  const handleDuplicate = async (e: React.MouseEvent, proj: any) => {
    e.preventDefault(); e.stopPropagation()
    setDuplicating(proj.id)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    // Duplicate project
    const { data: newProj, error } = await db.from('projects').insert({
      consultant_id: user.id,
      name:          `${proj.name} (Copy)`,
      description:   proj.description,
      event_name:    proj.event_name,
      venue:         proj.venue,
      city:          proj.city,
      region:        proj.region,
      currency:      proj.currency,
      budget:        proj.budget,
      status:        'draft',
    }).select().single()

    if (error) { toast.error(error.message); setDuplicating(null); return }

    // Duplicate project items
    const { data: items } = await db.from('project_items')
      .select('vendor_product_id,vendor_id,quantity,days,unit_price,total_price')
      .eq('project_id', proj.id)

    if (items?.length) {
      await db.from('project_items').insert(
        items.map((i: any) => ({ ...i, project_id: newProj.id }))
      )
    }

    setProjects(ps => [newProj, ...ps])
    toast.success(`"${proj.name}" duplicated — ${items?.length || 0} items copied`)
    setDuplicating(null)
  }

  const handleImportWishlist = async () => {
    if (!wishlist.length) { toast.error('Your wishlist is empty'); return }
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    // Create a new project from wishlist
    const { data: newProj, error } = await db.from('projects').insert({
      consultant_id: user.id,
      name:          'From Wishlist',
      status:        'draft',
    }).select().single()

    if (error) { toast.error(error.message); return }

    // Fetch wishlist products
    const { data: prods } = await db.from('vendor_products')
      .select('id,vendor_id,price_per_day')
      .in('id', wishlist)
      .eq('is_active', true)

    if (prods?.length) {
      await db.from('project_items').insert(
        prods.map((p: any) => ({
          project_id: newProj.id,
          vendor_product_id: p.id,
          vendor_id: p.vendor_id,
          quantity: 1, days: 1,
          unit_price: p.price_per_day,
          total_price: p.price_per_day,
        }))
      )
    }

    toast.success(`Project created with ${prods?.length || 0} wishlisted items`)
    setProjects(ps => [newProj, ...ps])
    setShowImport(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">My Projects</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Each project is one exhibition — organise your sourcing by show</p>
        </div>
        <div className="flex items-center gap-2">
          {wishlist.length > 0 && (
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 border border-[#DDD8CF] text-[#6B6B6B] hover:border-navy hover:text-navy font-medium px-4 py-2.5 rounded-lg text-sm transition-colors">
              <Heart size={14} className="text-red-400" /> Import Wishlist ({wishlist.length})
            </button>
          )}
          <Link href="/projects/new"
            className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
            <Plus size={16} /> New Project
          </Link>
        </div>
      </div>

      {/* Wishlist import prompt */}
      {showImport && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-navy text-sm">Import {wishlist.length} wishlisted items into a new project?</p>
              <p className="text-[12.5px] text-[#6B6B6B] mt-0.5">A new draft project will be created with all your saved items.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowImport(false)} className="text-sm text-[#6B6B6B] border border-[#DDD8CF] px-3 py-2 rounded-lg hover:border-navy transition-colors">Cancel</button>
            <button onClick={handleImportWishlist} className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors">
              Create Project from Wishlist
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B]">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-16 text-center">
          <FolderOpen size={40} className="mx-auto mb-4 text-[#DDD8CF]" />
          <h2 className="font-display font-bold text-xl text-navy mb-2">No projects yet</h2>
          <p className="text-[#6B6B6B] text-sm mb-6">Create a project to start sourcing rental items by exhibition.</p>
          <Link href="/projects/new" className="bg-navy text-white font-bold px-6 py-3 rounded-lg inline-block hover:bg-navy-light transition-colors">
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(p => {
            const itemCount = p.project_items?.[0]?.count || 0
            return (
              <div key={p.id} className="relative group">
                <Link href={`/projects/${p.id}`}
                  className="block bg-white border border-[#DDD8CF] rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[p.status] || STATUS_STYLE.draft}`}>
                      {p.status}
                    </span>
                    <ArrowRight size={16} className="text-[#DDD8CF] group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-navy text-base mb-0.5 leading-snug">{p.name}</h3>
                  {p.event_name && <p className="text-[13px] text-[#6B6B6B] mb-3">{p.event_name}</p>}
                  <div className="space-y-1.5">
                    {(p.city || p.venue) && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
                        <MapPin size={11} className="text-gold flex-shrink-0" />
                        <span className="truncate">{p.venue || p.city}</span>
                        {p.region && (
                          <span className="ml-1 flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-600">
                            {p.region}
                          </span>
                        )}
                      </div>
                    )}
                    {p.start_date && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
                        <Calendar size={11} className="text-gold flex-shrink-0" />
                        {new Date(p.start_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                        {p.end_date && ` — ${new Date(p.end_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}`}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0ECE4] flex items-center justify-between">
                    <span className="text-[12px] text-[#6B6B6B]">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} added
                    </span>
                    {p.budget && (
                      <span className="text-[13px] font-semibold text-navy">
                        {SYM[p.currency] || '₹'}{Number(p.budget).toLocaleString()} budget
                      </span>
                    )}
                  </div>
                </Link>

                {/* Action buttons — show on hover */}
                <div className="absolute top-3 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => handleDuplicate(e, p)} disabled={duplicating === p.id}
                    title="Duplicate project"
                    className="w-8 h-8 bg-white border border-[#DDD8CF] rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-navy hover:border-navy transition-all shadow-sm">
                    {duplicating === p.id ? <span className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin" /> : <Copy size={13} />}
                  </button>
                  <button onClick={e => handleDelete(e, p.id, p.name)} disabled={deleting === p.id}
                    title="Delete project"
                    className="w-8 h-8 bg-white border border-[#DDD8CF] rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-red-500 hover:border-red-300 transition-all shadow-sm">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
