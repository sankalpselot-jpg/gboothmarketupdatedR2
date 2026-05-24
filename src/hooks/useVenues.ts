'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Venue, Region } from '@/types/database'

export function useVenues(region?: Region) {
  const [venues,  setVenues]  = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVenues = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (region) params.set('region', region)
    const res = await fetch(`/api/venues?${params}`)
    const { data } = await res.json()
    setVenues(data || [])
    setLoading(false)
  }, [region])

  useEffect(() => { fetchVenues() }, [fetchVenues])

  const byRegion = (['EU', 'UK', 'IN'] as Region[]).reduce<Record<Region, Venue[]>>(
    (acc, r) => ({ ...acc, [r]: venues.filter(v => v.region === r) }),
    { EU: [], UK: [], IN: [] }
  )

  return { venues, byRegion, loading, refetch: fetchVenues }
}
