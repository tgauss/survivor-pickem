import { NextResponse } from 'next/server';
import { setFixedNow } from '@/lib/timectl';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Test-only endpoint' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { nowISOString } = body ?? {};
  setFixedNow(nowISOString ?? null);
  return NextResponse.json({ ok: true });
}