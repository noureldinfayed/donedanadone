import Link from 'next/link'
import { cookies } from 'next/headers'
import { supabaseAdmin, type Booking } from '@/lib/supabase'
import AdminLogin from './AdminLogin'
import BookingsTable from './BookingsTable'
import { DEMO_BOOKINGS } from './demoBookings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── /admin — bookings dashboard ─────────────────────────────────────────────
// Server component: gates on the `ddd_admin` cookie; if absent shows the
// password form. Otherwise fetches the initial bookings list server-side
// (service role) and hands off to a client component for realtime updates.
export default async function AdminPage() {
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get('ddd_admin')?.value === '1'

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <AdminLogin />
      </main>
    )
  }

  // Prototype-safe: if Supabase isn't configured (or the table doesn't exist
  // yet) the dashboard renders empty with a notice instead of 500-ing.
  let initial: Booking[] = []
  let backendReady = true
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, status, created_at, provider:providers(name)'
      )
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    initial = ((data ?? []) as unknown[]).map((row) => {
      const r = row as Booking & { provider?: { name: string } | null }
      return { ...r, provider_name: r.provider?.name ?? null }
    }) as Booking[]
  } catch {
    backendReady = false
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // No live data yet → fall back to illustrative sample orders so the
  // dashboard demos well. Clearly badged so it's never mistaken for real.
  const showingSample = initial.length === 0
  const rows = showingSample ? DEMO_BOOKINGS : initial

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">DoneDanaDone — Bookings</h1>
            <p className="text-muted text-sm">
              Live view of incoming WhatsApp bookings — providers auto-assigned.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-saffron px-3 py-1.5 font-medium text-ink">
                Bookings
              </span>
              <Link
                href="/admin/providers"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-muted hover:text-white"
              >
                Providers
              </Link>
            </nav>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              realtime
            </div>
          </div>
        </header>

        {showingSample && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Sample data
            </span>
            {backendReady
              ? 'No live bookings yet — showing example orders so you can preview the dashboard.'
              : 'Backend not connected yet — showing example orders. Set the Supabase env vars to see live bookings.'}
          </div>
        )}

        <BookingsTable
          initial={rows}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
        />
      </div>
    </main>
  )
}
