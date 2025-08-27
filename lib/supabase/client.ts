import { createClient } from '@supabase/supabase-js'
import { SUPABASE } from '../config'

export function createBrowserClient() {
  if (!SUPABASE.url || !SUPABASE.anonKey) {
    throw new Error('Supabase browser configuration missing')
  }

  return createClient(SUPABASE.url, SUPABASE.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: 'public',
    },
  })
}

export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>