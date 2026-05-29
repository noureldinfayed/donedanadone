import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// ─── Admin: create a provider ─────────────────────────────────────────────────
// Cookie-gated (ddd_admin). Inserts a new provider row. Returns 503 with a
// clear message when the Supabase backend isn't configured yet.
async function requireAdmin() {
  const store = await cookies()
  return store.get('ddd_admin')?.value === '1'
}

const SERVICES = ['home_chef', 'house_help', 'dog_walker', 'babysitter', 'electrician', 'plumber']

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name.length < 2) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const services = Array.isArray(body.services)
    ? body.services.filter((s): s is string => typeof s === 'string' && SERVICES.includes(s))
    : []
  const areas = Array.isArray(body.areas)
    ? body.areas.filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
    : []
  const working_days = Array.isArray(body.working_days)
    ? body.working_days
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [1, 2, 3, 4, 5, 6]

  const row = {
    name,
    phone: typeof body.phone === 'string' ? body.phone.trim() : null,
    profession: typeof body.profession === 'string' ? body.profession.trim() : null,
    services,
    areas,
    working_days,
    start_time: typeof body.start_time === 'string' ? body.start_time : '09:00',
    end_time: typeof body.end_time === 'string' ? body.end_time : '18:00',
    active: true,
  }

  try {
    const { data, error } = await supabaseAdmin.from('providers').insert(row).select('*').single()
    if (error) throw error
    return NextResponse.json({ provider: data })
  } catch (err) {
    console.error('[providers] insert failed', err)
    return NextResponse.json(
      { error: 'Backend not connected — set the Supabase env vars to save providers.' },
      { status: 503 }
    )
  }
}
