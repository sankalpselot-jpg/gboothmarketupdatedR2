'use client'
import { useState, useCallback } from 'react'

export function useModal<T = void>() {
  const [isOpen, setIsOpen] = useState(false)
  const [data,   setData]   = useState<T | null>(null)

  const open  = useCallback((payload?: T) => { setData(payload ?? null); setIsOpen(true) }, [])
  const close = useCallback(() => { setIsOpen(false); setData(null) }, [])

  return { isOpen, data, open, close }
}
