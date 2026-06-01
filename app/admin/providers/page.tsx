import Link from 'next/link'
import { cookies } from 'next/headers'
import { supabaseAdmin, type Provider, type Booking } from '@/lib/supabase'
import AdminLogin from '../AdminLogin'
import { DEMO_PROVIDERS } from '../demoProviders'
import { DEMO_BOOKINGS } from '../demoBookings'
import ProvidersManager from './ProvidersManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── /admin/providers — provider management ───────────────────────────────────
// One-time setup + oversight of the professionals the auto-matcher draws from.
export default async function ProvidersPage() {
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get('ddd_admin')?.value === '1'

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <AdminLogin />
      </main>
    )
  }

  let providers: Provider[] = []
  let bookings: Booking[] = []
  let backendReady = true
  try {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    providers = (data ?? []) as Provider[]

    const { data: bk } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, status, created_at'
      )
      .not('provider_id', 'is', null)
      .neq('status', 'cancelled')
      .limit(500)
    bookings = (bk ?? []) as Booking[]
  } catch {
    backendReady = false
  }

  const showingSample = providers.length === 0
  const rows = showingSample ? DEMO_PROVIDERS : providers
  const bookingRows = showingSample ? DEMO_BOOKINGS : bookings

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return (
    <main className="min-h-screen bg-background px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-[1900px] space-y-6">
        <header className="flow-wash flex flex-wrap items-center justify-between gap-4 rounded-md px-5 py-5 text-white shadow-xl shadow-black/10 sm:px-7">
          <div>
            <h1 className="text-2xl font-semibold">DoneDanaDone - Providers</h1>
            <p className="text-sm text-white/70">
              Set up the professionals once - bookings are matched and assigned automatically.
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="rounded-md border border-white/20 px-3 py-1.5 text-white/70 hover:text-white"
            >
              Bookings
            </Link>
            <span className="rounded-md bg-white px-3 py-1.5 font-medium text-ink">
              Providers
            </span>
          </nav>
        </header>

        {showingSample && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#ead8bd] bg-[#fff6e7] px-4 py-3 text-sm text-[#7a5418]">
            <span className="inline-flex rounded-md bg-[#f7d7a3] px-2 py-0.5 text-xs font-semibold uppercase">
              Sample data
            </span>
            {backendReady
              ? 'No providers added yet — showing examples. Add one below to get started.'
              : 'Backend not connected yet — showing example providers. Set the Supabase env vars to save real ones.'}
          </div>
        )}

        <ProvidersManager
          initial={rows}
          initialBookings={bookingRows}
          canPersist={backendReady && !showingSample}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
        />
      </div>
    </main>
  )
}
