'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FolderOpen, Plus, MapPin, Calendar, ArrowRight } from 'lucide-react'
import type { Project } from '@/types/database'

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-500',
  active:    'bg-blue-50 text-blue-700',
  ordered:   'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default function ProjectsPage() {
  const db = useMemo(() => createClient() as any, [])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    db.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      const { data } = await db.from('projects')
        .select('*').eq('consultant_id', user.id)
        .order('updated_at', { ascending: false })
      setProjects(data || [])
      setLoading(false)
    })
  }, [db])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-navy">My Projects</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Each project is one exhibition — build your cart, source from vendors</p>
        </div>
        <Link href="/projects/new"
          className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm">
          <Plus size={16} /> New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B]">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#DDD8CF] rounded-2xl p-16 text-center">
          <FolderOpen size={40} className="mx-auto mb-4 text-[#DDD8CF]" />
          <h2 className="font-display font-bold text-xl text-navy mb-2">No projects yet</h2>
          <p className="text-[#6B6B6B] text-sm mb-6">Create your first project to start sourcing rental items from vendors.</p>
          <Link href="/projects/new" className="bg-navy text-white font-bold px-6 py-3 rounded-lg inline-block hover:bg-navy-light transition-colors">
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`}
              className="bg-white border border-[#DDD8CF] rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
                <ArrowRight size={16} className="text-[#DDD8CF] group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-display font-bold text-navy text-base mb-1 leading-snug">{p.name}</h3>
              {p.event_name && <p className="text-[13px] text-[#6B6B6B] mb-3">{p.event_name}</p>}
              <div className="space-y-1.5 mt-auto">
                {(p.city || p.venue) && (
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
                    <MapPin size={11} className="text-gold flex-shrink-0" />
                    {p.city || p.venue}
                    {p.region && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${p.region === 'IN' ? 'bg-orange-50 text-orange-600' : p.region === 'EU' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{p.region}</span>}
                  </div>
                )}
                {(p.start_date || p.end_date) && (
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
                    <Calendar size={11} className="text-gold flex-shrink-0" />
                    {p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    {p.end_date && ` — ${new Date(p.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  </div>
                )}
              </div>
              {p.budget && (
                <div className="mt-3 pt-3 border-t border-[#F0ECE4]">
                  <span className="text-[12px] text-[#6B6B6B]">Budget: </span>
                  <span className="text-[13px] font-semibold text-navy">
                    {p.currency === 'INR' ? '₹' : p.currency === 'GBP' ? '£' : '€'}{p.budget.toLocaleString()}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
