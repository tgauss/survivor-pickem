import { createClient } from '@supabase/supabase-js'
import { SUPABASE } from '../config'

export function createServerClient() {
  if (!SUPABASE.url || !SUPABASE.anonKey) {
    throw new Error('Supabase configuration missing')
  }

  // Temporarily use anon key for development - in production this should be service role key
  return createClient(SUPABASE.url, SUPABASE.anonKey, {
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