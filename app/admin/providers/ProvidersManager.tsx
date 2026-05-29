'use client'

import { useState } from 'react'
import type { Provider } from '@/lib/supabase'

const SERVICES: { value: string; label: string; emoji: string }[] = [
  { value: 'home_chef', label: 'Home Chef', emoji: '👨‍🍳' },
  { value: 'house_help', label: 'House Help', emoji: '🏠' },
  { value: 'dog_walker', label: 'Dog Walker', emoji: '🐕' },
  { value: 'babysitter', label: 'Babysitter', emoji: '👶' },
  { value: 'electrician', label: 'Electrician', emoji: '⚡' },
  { value: 'plumber', label: 'Plumber', emoji: '🔧' },
]
const SERVICE_LABEL = Object.fromEntries(SERVICES.map((s) => [s.value, s.label]))
const SERVICE_EMOJI = Object.fromEntries(SERVICES.map((s) => [s.value, s.emoji]))

const AREAS = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bangalore']

// Display Mon→Sun; map to the 0=Sun..6=Sat convention used in data.
const WEEK: { label: string; day: number }[] = [
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
  { label: 'S', day: 0 },
]

function fmtHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
  const mer = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m || 0).padStart(2, '0')} ${mer}`
}

interface Props {
  initial: Provider[]
  canPersist: boolean
}

export default function ProvidersManager({ initial, canPersist }: Props) {
  const [providers, setProviders] = useState<Provider[]>(initial)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {providers.length} provider{providers.length === 1 ? '' : 's'} in the pool
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          {open ? 'Close' : '+ Add provider'}
        </button>
      </div>

      {open && (
        <AddProviderForm
          canPersist={canPersist}
          onAdd={(p) => {
            setProviders((prev) => [p, ...prev])
            setOpen(false)
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>
    </div>
  )
}

function ProviderCard({ provider }: { provider: Provider }) {
  const workingSet = new Set(provider.working_days)
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{provider.name}</h3>
          {provider.profession && (
            <p className="text-sm text-muted">{provider.profession}</p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-saffron/15 px-2 py-0.5 text-xs font-medium text-saffron">
          ★ {provider.rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {provider.services.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white"
          >
            <span>{SERVICE_EMOJI[s] ?? '•'}</span>
            {SERVICE_LABEL[s] ?? s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        <span className="text-white/70">Areas:</span>{' '}
        {provider.areas.length ? provider.areas.join(' · ') : '—'}
      </p>

      {/* Weekly availability calendar */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Availability</p>
        <div className="flex gap-1.5">
          {WEEK.map((d, i) => {
            const on = workingSet.has(d.day)
            return (
              <span
                key={i}
                title={on ? 'Working' : 'Off'}
                className={`flex size-7 items-center justify-center rounded-md text-xs font-semibold ${
                  on ? 'bg-whatsapp/20 text-whatsapp' : 'bg-white/5 text-white/25'
                }`}
              >
                {d.label}
              </span>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          {fmtHour(provider.start_time)} – {fmtHour(provider.end_time)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
        <span className="font-mono text-muted">{provider.phone ?? '—'}</span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
            provider.active ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white/40'
          }`}
        >
          {provider.active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

function AddProviderForm({
  canPersist,
  onAdd,
}: {
  canPersist: boolean
  onAdd: (p: Provider) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profession, setProfession] = useState('')
  const [services, setServices] = useState<Set<string>>(new Set())
  const [areas, setAreas] = useState<Set<string>>(new Set())
  const [days, setDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]))
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('18:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set)
    next.has(val) ? next.delete(val) : next.add(val)
    setter(next)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError('Please enter a name.')
      return
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      profession: profession.trim(),
      services: [...services],
      areas: [...areas],
      working_days: [...days],
      start_time: start,
      end_time: end,
    }

    // When the backend isn't live (sample mode), add the provider locally so the
    // UI still demos. Otherwise persist it through the API.
    if (!canPersist) {
      onAdd({
        id: `local-${Date.now()}`,
        rating: 5.0,
        active: true,
        created_at: new Date().toISOString(),
        ...payload,
        phone: payload.phone || null,
        profession: payload.profession || null,
      } as Provider)
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || 'Could not save provider.')
        return
      }
      onAdd(j.provider as Provider)
    } finally {
      setBusy(false)
    }
  }

  const fieldCls =
    'w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-saffron/60'

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-white/10 bg-ink-soft p-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Name *</label>
          <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Profession</label>
          <input className={fieldCls} value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Senior Electrician" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Phone</label>
          <input className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98100 45612" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-muted">Services</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = services.has(s.value)
            return (
              <button
                type="button"
                key={s.value}
                onClick={() => toggle(services, s.value, setServices)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on ? 'border-saffron bg-saffron/15 text-saffron' : 'border-white/15 text-white/70 hover:border-white/30'
                }`}
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-muted">Areas served</label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => {
            const on = areas.has(a)
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggle(areas, a, setAreas)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on ? 'border-saffron bg-saffron/15 text-saffron' : 'border-white/15 text-white/70 hover:border-white/30'
                }`}
              >
                {a}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs text-muted">Working days</label>
          <div className="flex gap-1.5">
            {WEEK.map((d, i) => {
              const on = days.has(d.day)
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggle(days, d.day, setDays)}
                  className={`flex size-9 items-center justify-center rounded-md text-sm font-semibold transition-colors ${
                    on ? 'bg-whatsapp/20 text-whatsapp' : 'bg-white/5 text-white/30 hover:text-white/60'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Start</label>
            <input type="time" className={fieldCls} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">End</label>
            <input type="time" className={fieldCls} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-saffron px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save provider'}
        </button>
        {!canPersist && (
          <span className="text-xs text-muted">
            Sample mode — added to the view only (connect Supabase to persist).
          </span>
        )}
      </div>
    </form>
  )
}
