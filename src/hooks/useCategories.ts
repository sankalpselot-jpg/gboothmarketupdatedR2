'use client'
import { useState, useEffect } from 'react'
import type { Category } from '@/types/database'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(({ data }) => { setCategories(data || []); setLoading(false) })
  }, [])

  return { categories, loading }
}
