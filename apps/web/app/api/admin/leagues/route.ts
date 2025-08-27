import { NextResponse } from 'next/server';
import { listLeagues, createLeague } from '@/lib/data';

export async function GET() {
  try {
    const leagues = await listLeagues();
    return NextResponse.json({ ok: true, leagues });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Failed to list leagues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, season_year, buy_in_cents } = body

    if (!name || !season_year || buy_in_cents === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const league = await createLeague({ name, season_year, buy_in_cents })
    return NextResponse.json({ league })
  } catch (error) {
    console.error('Create league error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}