import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ─── Admin login ─────────────────────────────────────────────────────────────
// Plain password check against ADMIN_PASSWORD (default "admin123" for the demo).
// Sets an httpOnly cookie that /admin checks server-side.
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (password !== expected) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('ddd_admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  })
  return res
}
