import { NextResponse } from 'next/server'
import { claimLeagueInvite } from '@/lib/data'
import { readUserSessionCookie } from '@/lib/auth/sessions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { inviteToken, displayName } = body

    if (!inviteToken || !displayName) {
      return NextResponse.json(
        { error: 'Invite code and display name are required' },
        { status: 400 }
      )
    }

    // Get current user from session
    const sessionData = await readUserSessionCookie()
    if (!sessionData) {
      return NextResponse.json(
        { error: 'You must be logged in to claim an invite' },
        { status: 401 }
      )
    }

    const result = await claimLeagueInvite(sessionData.user.id, inviteToken, displayName)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      entry: result.entry
    })
  } catch (error) {
    console.error('Claim invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}