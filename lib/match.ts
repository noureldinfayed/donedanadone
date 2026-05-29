import { supabaseAdmin, type Provider } from './supabase'

// ─── Provider auto-matching ───────────────────────────────────────────────────
// Fully automated: given a booking's service + area + slot, pick the best
// eligible provider and assign them. No human input. Pure helpers below are
// exported so the logic can be unit-tested without a database.

/** Map the fuzzy slot_date ('today'|'tomorrow'|'weekend') to a concrete Date. */
export function resolveSlotDate(slotDate: string | null, now = new Date()): Date {
  const d = new Date(now)
  switch (slotDate) {
    case 'tomorrow':
      d.setDate(d.getDate() + 1)
      return d
    case 'weekend': {
      // Next Saturday (or today if already the weekend).
      const day = d.getDay() // 0=Sun..6=Sat
      if (day === 6 || day === 0) return d
      d.setDate(d.getDate() + (6 - day))
      return d
    }
    case 'today':
    default:
      return d
  }
}

/** Parse a slot time like '11:00 AM', '7:00 PM – 9:00 PM', 'ASAP' to minutes
 *  since midnight. Returns null when there's no concrete time (e.g. 'ASAP'). */
export function parseSlotTimeToMinutes(slotTime: string | null): number | null {
  if (!slotTime) return null
  const m = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const mer = m[3]?.toUpperCase()
  if (mer === 'PM' && hour < 12) hour += 12
  if (mer === 'AM' && hour === 12) hour = 0
  return hour * 60 + min
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
  return (h || 0) * 60 + (m || 0)
}

/** True when a provider can take this booking's service, area, and time slot. */
export function isProviderEligible(
  provider: Provider,
  booking: { service_type: string | null; area: string | null; slot_date: string | null; slot_time: string | null },
  now = new Date()
): boolean {
  if (!provider.active) return false
  if (booking.service_type && !provider.services.includes(booking.service_type)) return false
  if (booking.area && !provider.areas.includes(booking.area)) return false

  const weekday = resolveSlotDate(booking.slot_date, now).getDay()
  if (provider.working_days.length && !provider.working_days.includes(weekday)) return false

  // Time-window check — only when the slot has a concrete time.
  const slotMin = parseSlotTimeToMinutes(booking.slot_time)
  if (slotMin !== null) {
    const start = hhmmToMinutes(provider.start_time)
    const end = hhmmToMinutes(provider.end_time)
    if (slotMin < start || slotMin > end) return false
  }
  return true
}

/**
 * Find the best provider for a booking and assign them (writes provider_id +
 * sets status to 'assigned'). Returns the assigned provider, or null if none
 * eligible / backend unavailable. Safe to call even when Supabase isn't
 * configured — it just returns null.
 */
export async function autoAssignProvider(bookingId: string, booking: {
  service_type: string | null
  area: string | null
  slot_date: string | null
  slot_time: string | null
}): Promise<Provider | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('active', true)
    if (error) throw error
    const providers = (data ?? []) as Provider[]

    const eligible = providers.filter((p) => isProviderEligible(p, booking))
    if (eligible.length === 0) return null

    // Count current load per provider so we spread work, then prefer rating.
    const { data: loadRows } = await supabaseAdmin
      .from('bookings')
      .select('provider_id')
      .in('provider_id', eligible.map((p) => p.id))
      .neq('status', 'cancelled')
    const load = new Map<string, number>()
    for (const r of (loadRows ?? []) as { provider_id: string | null }[]) {
      if (r.provider_id) load.set(r.provider_id, (load.get(r.provider_id) ?? 0) + 1)
    }

    const best = eligible.sort((a, b) => {
      const la = load.get(a.id) ?? 0
      const lb = load.get(b.id) ?? 0
      if (la !== lb) return la - lb // least busy first
      return b.rating - a.rating // then highest rated
    })[0]

    const { error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({ provider_id: best.id, status: 'assigned' })
      .eq('id', bookingId)
    if (updErr) throw updErr

    return best
  } catch (err) {
    console.error('[match] autoAssignProvider failed', err)
    return null
  }
}
