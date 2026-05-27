'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VendorProfile } from '@/types/database'

export function useVendorProfile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    })
  }, [supabase])

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('vendor_profiles').select('*').eq('user_id', user.id).single()
    setProfile(data)
  }

  return { profile, loading, refresh }
}
