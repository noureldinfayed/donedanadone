import { cookies } from 'next/headers'
import { supabaseAdmin, type Booking } from '@/lib/supabase'
import AdminLogin from './AdminLogin'
import BookingsTable from './BookingsTable'

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

  const { data: initial } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, payment_status, payment_link, status, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">DoneDanaDone — Bookings</h1>
            <p className="text-muted text-sm">
              Live view of incoming WhatsApp bookings.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-green-500 animate-pulse" />
            realtime
          </div>
        </header>

        <BookingsTable
          initial={(initial ?? []) as Booking[]}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
        />
      </div>
    </main>
  )
}
