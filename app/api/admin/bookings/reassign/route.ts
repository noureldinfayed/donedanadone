import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin, type Booking, type Provider } from '@/lib/supabase'
import { startProviderConfirmation } from '@/lib/state-machine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const store = await cookies()
  return store.get('ddd_admin')?.value === '1'
}

function providerCoversArea(provider: Provider, area: string | null) {
  if (!area) return true
  const bookingArea = area.toLowerCase()
  return provider.areas.some((providerArea) => {
    const normalized = providerArea.toLowerCase()
    return normalized === bookingArea || bookingArea.includes(normalized)
  })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { bookingId?: unknown; providerId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : ''
  const providerId = typeof body.providerId === 'string' ? body.providerId : ''
  if (!bookingId || !providerId) {
    return NextResponse.json({ error: 'bookingId and providerId are required' }, { status: 400 })
  }

  try {
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, booking_display_id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, amount_paid, payment_method, razorpay_payment_id, transaction_timestamp, status, created_at'
      )
      .eq('id', bookingId)
      .maybeSingle()
    if (bookingErr) throw bookingErr
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { data: provider, error: providerErr } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .eq('active', true)
      .maybeSingle()
    if (providerErr) throw providerErr
    if (!provider) {
      return NextResponse.json({ error: 'Active provider not found' }, { status: 404 })
    }

    const b = booking as Booking
    const p = provider as Provider
    if (b.service_type && !p.services.includes(b.service_type)) {
      return NextResponse.json({ error: 'Provider does not handle this service' }, { status: 400 })
    }
    if (!providerCoversArea(p, b.area)) {
      return NextResponse.json({ error: 'Provider does not serve this area' }, { status: 400 })
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({ provider_id: providerId, status: 'confirmed' })
      .eq('id', bookingId)
      .select(
        'id, booking_display_id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, amount_paid, payment_method, razorpay_payment_id, transaction_timestamp, status, created_at'
      )
      .single()
    if (updateErr) throw updateErr

    console.info(
      `[admin] reassigned booking ${b.booking_display_id ?? b.id} from ${b.provider_id ?? 'none'} to ${providerId}`
    )
    await startProviderConfirmation(p, updated as Booking)

    return NextResponse.json({ booking: updated })
  } catch (err) {
    console.error('[admin] reassign failed', err)
    return NextResponse.json({ error: 'Could not reassign booking' }, { status: 500 })
  }
}
