import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    USE_SUPABASE: process.env.USE_SUPABASE,
    HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_URL_LENGTH: process.env.SUPABASE_URL?.length || 0,
    HAS_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY_LENGTH: process.env.SUPABASE_ANON_KEY?.length || 0,
    HAS_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    // Show first few chars to verify but not expose keys
    SUPABASE_URL_PREFIX: process.env.SUPABASE_URL?.substring(0, 30) || 'missing',
    SUPABASE_ANON_KEY_PREFIX: process.env.SUPABASE_ANON_KEY?.substring(0, 20) || 'missing',
    SUPABASE_SERVICE_ROLE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'missing',
  })
}