import { createClient } from '@supabase/supabase-js'
import { SUPABASE } from '../config'

export function createServerClient() {
  if (!SUPABASE.url || !SUPABASE.serviceRoleKey) {
    throw new Error('Supabase configuration missing')
  }

  // Use service role key for server-side operations requiring elevated permissions
  return createClient(SUPABASE.url, SUPABASE.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  })
}

export type SupabaseServerClient = ReturnType<typeof createServerClient>