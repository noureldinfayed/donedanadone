import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const store = await cookies()
  return store.get('ddd_admin')?.value === '1'
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { providerId?: unknown; active?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId : ''
  const active = typeof body.active === 'boolean' ? body.active : null
  if (!providerId || active === null) {
    return NextResponse.json({ error: 'providerId and active are required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .update({ active })
      .eq('id', providerId)
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ provider: data })
  } catch (err) {
    console.error('[admin] provider active toggle failed', err)
    return NextResponse.json({ error: 'Could not update provider' }, { status: 500 })
  }
}
