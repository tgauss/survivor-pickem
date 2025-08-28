import { NextResponse } from 'next/server'
import { listLeagues } from '@/lib/data'

export async function GET() {
  try {
    const leagues = await listLeagues()
    return NextResponse.json({ leagues })
  } catch (error) {
    console.error('Get leagues error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    )
  }
}