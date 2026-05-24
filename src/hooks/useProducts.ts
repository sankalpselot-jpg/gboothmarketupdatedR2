'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Product, Category } from '@/types/database'

export type ProductFilters = {
  category?: string
  region?: string
  q?: string
  sort?: string
  page?: number
  limit?: number
}

export type ProductsResult = {
  products: (Product & { categories: Category })[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
  refetch: () => void
}

export function useProducts(filters: ProductFilters = {}): ProductsResult {
  const [products, setProducts] = useState<(Product & { categories: Category })[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [total,    setTotal]    = useState(0)

  const limit = filters.limit ?? 24
  const page  = filters.page  ?? 1

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.region)   params.set('region',   filters.region)
      if (filters.q)        params.set('q',        filters.q)
      if (filters.sort)     params.set('sort',     filters.sort)
      params.set('limit',  String(limit))
      params.set('offset', String((page - 1) * limit))

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const json = await res.json()
      setProducts(json.data || [])
      setTotal(json.count || json.data?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters.category, filters.region, filters.q, filters.sort, page, limit])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return {
    products,
    loading,
    error,
    total,
    hasMore: products.length === limit,
    refetch: fetchProducts,
  }
}
