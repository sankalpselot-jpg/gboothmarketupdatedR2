'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Quote } from '@/types/database'

export function useQuotes(status?: string) {
  const [quotes,  setQuotes]  = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const res = await fetch(`/api/quotes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch quotes')
      const { data } = await res.json()
      setQuotes(data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  return { quotes, loading, error, refetch: fetchQuotes }
}
