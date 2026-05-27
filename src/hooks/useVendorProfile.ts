'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VendorProfile } from '@/types/database'

export function useVendorProfile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Use untyped client — vendor_profiles is not in the Database generic
  const supabase = useMemo(() => createClient() as any, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProfile(data as VendorProfile | null)
      setLoading(false)
    })
  }, [supabase])

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('vendor_profiles').select('*').eq('user_id', user.id).single()
    setProfile(data as VendorProfile | null)
  }

  return { profile, loading, refresh }
}
