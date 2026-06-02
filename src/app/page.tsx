export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Homepage redirects to /browse for all users
// This gives a marketplace-first experience
export default async function HomePage() {
  redirect('/browse')
}
