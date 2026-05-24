import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/** Typed admin client — use for SELECT queries */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Untyped admin client — use for INSERT / UPDATE / DELETE only.
 * Avoids TypeScript fighting over generated Insert shapes from the Database generic.
 */
export function createAdminClientUntyped() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
