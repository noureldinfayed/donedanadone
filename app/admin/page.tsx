import Link from 'next/link'
import { cookies } from 'next/headers'
import { supabaseAdmin, type Booking, type Provider } from '@/lib/supabase'
import AdminLogin from './AdminLogin'
import BookingsTable from './BookingsTable'
import { DEMO_BOOKINGS } from './demoBookings'
import { DEMO_PROVIDERS } from './demoProviders'

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

  // If Supabase is not configured or the table is missing, keep the dashboard
  // usable with local sample rows instead of throwing during render.
  let initial: Booking[] = []
  let providers: Provider[] = []
  let backendReady = true
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, booking_display_id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, amount_paid, payment_method, razorpay_payment_id, transaction_timestamp, status, created_at, provider:providers(name)'
      )
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    initial = ((data ?? []) as unknown[]).map((row) => {
      const r = row as Booking & { provider?: { name: string } | null }
      return { ...r, provider_name: r.provider?.name ?? null }
    }) as Booking[]

    const { data: providerRows, error: providerErr } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('name')
    if (providerErr) throw providerErr
    providers = (providerRows ?? []) as Provider[]
  } catch {
    backendReady = false
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // No live data yet: fall back to sample orders and clearly label them.
  const showingSample = initial.length === 0
  const rows = showingSample ? DEMO_BOOKINGS : initial
  const providerRows = showingSample || providers.length === 0 ? DEMO_PROVIDERS : providers

  return (
    <main className="min-h-screen bg-background px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flow-wash flex flex-wrap items-center justify-between gap-4 rounded-md px-5 py-5 text-white shadow-xl shadow-black/10 sm:px-7">
          <div>
            <h1 className="text-2xl font-semibold">DoneDanaDone - Bookings</h1>
            <p className="text-sm text-white/70">
              Live view of incoming WhatsApp bookings — providers auto-assigned.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 text-sm">
              <span className="rounded-md bg-white px-3 py-1.5 font-medium text-ink">
                Bookings
              </span>
              <Link
                href="/admin/providers"
                className="rounded-md border border-white/20 px-3 py-1.5 text-white/70 hover:text-white"
              >
                Providers
              </Link>
            </nav>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              realtime
            </div>
          </div>
        </header>

        {showingSample && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#ead8bd] bg-[#fff6e7] px-4 py-3 text-sm text-[#7a5418]">
            <span className="inline-flex rounded-md bg-[#f7d7a3] px-2 py-0.5 text-xs font-semibold uppercase">
              Sample data
            </span>
            {backendReady
              ? 'No live bookings yet — showing example orders so you can preview the dashboard.'
              : 'Backend not connected yet — showing example orders. Set the Supabase env vars to see live bookings.'}
          </div>
        )}

        <BookingsTable
          initial={rows}
          providers={providerRows}
          canPersist={!showingSample && backendReady && providers.length > 0}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
        />
      </div>
    </main>
  )
}
