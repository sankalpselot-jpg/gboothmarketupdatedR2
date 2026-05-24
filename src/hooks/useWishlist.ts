'use client'
import { useState, useEffect, useCallback } from 'react'

const KEY = 'bm-wishlist'

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch {}
  }, [])

  const save = (next: string[]) => {
    setIds(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }

  const toggle = useCallback((productId: string) => {
    setIds(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const isWishlisted = useCallback((productId: string) => ids.includes(productId), [ids])
  const clear = () => save([])

  return { ids, toggle, isWishlisted, clear, count: ids.length }
}
