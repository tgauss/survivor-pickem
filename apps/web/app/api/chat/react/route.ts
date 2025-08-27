import { NextRequest, NextResponse } from 'next/server'
import { reactToMessage } from '@/lib/data/adapters/local'
import { getSessionFromCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { messageId, emoji } = await request.json()
    
    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const message = reactToMessage({ messageId, emoji })
    
    return NextResponse.json({ message })
  } catch (error) {
    console.error('React to message error:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}