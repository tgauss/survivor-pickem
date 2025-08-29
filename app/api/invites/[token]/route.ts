import { NextResponse } from 'next/server'
import { getInvite } from '@/lib/data'

export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const invite = await getInvite(token)
    
    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invite })
  } catch (error) {
    console.error('Get invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}