'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications?limit=20')
    if (!res.ok) return
    const { data, unreadCount } = await res.json()
    setNotifications(data || [])
    setUnreadCount(unreadCount || 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Supabase realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
      }, (payload) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchNotifications])

  const markRead = useCallback(async (ids: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - ids.length))
  }, [])

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications }
}
