import Link from 'next/link'
import { cookies } from 'next/headers'
import { supabaseAdmin, type Provider } from '@/lib/supabase'
import AdminLogin from '../AdminLogin'
import { DEMO_PROVIDERS } from '../demoProviders'
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
  let backendReady = true
  try {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    providers = (data ?? []) as Provider[]
  } catch {
    backendReady = false
  }

  const showingSample = providers.length === 0
  const rows = showingSample ? DEMO_PROVIDERS : providers

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">DoneDanaDone — Providers</h1>
            <p className="text-muted text-sm">
              Set up the professionals once — bookings are matched & assigned automatically.
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-muted hover:text-white"
            >
              Bookings
            </Link>
            <span className="rounded-lg bg-saffron px-3 py-1.5 font-medium text-ink">
              Providers
            </span>
          </nav>
        </header>

        {showingSample && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Sample data
            </span>
            {backendReady
              ? 'No providers added yet — showing examples. Add one below to get started.'
              : 'Backend not connected yet — showing example providers. Set the Supabase env vars to save real ones.'}
          </div>
        )}

        <ProvidersManager initial={rows} canPersist={backendReady && !showingSample} />
      </div>
    </main>
  )
}
