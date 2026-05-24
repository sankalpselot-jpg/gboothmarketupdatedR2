'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (page <= 4)       return i + 1
    if (page >= totalPages - 3) return totalPages - 6 + i
    return page - 3 + i
  })

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD8CF] bg-white hover:bg-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={pageBtn(1 === page)}>1</button>
          {pages[0] > 2 && <span className="text-[#6B6B6B] px-1">…</span>}
        </>
      )}

      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={pageBtn(p === page)}>{p}</button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-[#6B6B6B] px-1">…</span>}
          <button onClick={() => onPageChange(totalPages)} className={pageBtn(totalPages === page)}>{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD8CF] bg-white hover:bg-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function pageBtn(active: boolean) {
  return cn(
    'w-9 h-9 flex items-center justify-center rounded text-sm font-medium transition-colors border',
    active
      ? 'bg-navy text-white border-navy'
      : 'bg-white text-[#1A1A1A] border-[#DDD8CF] hover:bg-cream hover:border-navy'
  )
}
