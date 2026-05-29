'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Booking, Provider } from '@/lib/supabase'

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
const WEEK: { label: string; full: string; day: number }[] = [
  { label: 'M', full: 'Mon', day: 1 },
  { label: 'T', full: 'Tue', day: 2 },
  { label: 'W', full: 'Wed', day: 3 },
  { label: 'T', full: 'Thu', day: 4 },
  { label: 'F', full: 'Fri', day: 5 },
  { label: 'S', full: 'Sat', day: 6 },
  { label: 'S', full: 'Sun', day: 0 },
]

function fmtHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
  const mer = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m || 0).padStart(2, '0')} ${mer}`
}

// Resolve a fuzzy slot_date to a 0=Sun..6=Sat weekday (mirrors lib/match.ts).
function slotWeekday(slotDate: string | null): number {
  const now = new Date()
  if (slotDate === 'tomorrow') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return d.getDay()
  }
  if (slotDate === 'weekend') return 6 // Saturday
  return now.getDay() // 'today' / unknown
}

function minutesOf(slotTime: string | null): number {
  if (!slotTime) return 0
  const m = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return 0
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const mer = m[3]?.toUpperCase()
  if (mer === 'PM' && h < 12) h += 12
  if (mer === 'AM' && h === 12) h = 0
  return h * 60 + min
}

interface Props {
  initial: Provider[]
  initialBookings: Booking[]
  canPersist: boolean
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function ProvidersManager({
  initial,
  initialBookings,
  canPersist,
  supabaseUrl,
  supabaseAnonKey,
}: Props) {
  const [providers, setProviders] = useState<Provider[]>(initial)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [calendarFor, setCalendarFor] = useState<Provider | null>(null)

  // ── Realtime: keep every provider's calendar live as bookings change ──
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  }, [supabaseUrl, supabaseAnonKey])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('providers-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        setBookings((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new as Booking, ...prev]
          if (payload.eventType === 'UPDATE')
            return prev.map((b) =>
              b.id === (payload.new as Booking).id ? (payload.new as Booking) : b
            )
          if (payload.eventType === 'DELETE')
            return prev.filter((b) => b.id !== (payload.old as Booking).id)
          return prev
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  function startAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function startEdit(p: Provider) {
    setEditing(p)
    setFormOpen(true)
  }
  function onSaved(p: Provider) {
    setProviders((prev) => {
      const exists = prev.some((x) => x.id === p.id)
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
    })
    setFormOpen(false)
    setEditing(null)
  }

  const liveJobCount = (id: string) =>
    bookings.filter((b) => b.provider_id === id).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {providers.length} provider{providers.length === 1 ? '' : 's'} in the pool
          {supabase && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" /> live
            </span>
          )}
        </p>
        <button
          onClick={startAdd}
          className="rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          + Add provider
        </button>
      </div>

      {formOpen && (
        <ProviderForm
          key={editing?.id ?? 'new'}
          initial={editing}
          canPersist={canPersist}
          onSaved={onSaved}
          onCancel={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            jobCount={liveJobCount(p.id)}
            onEdit={() => startEdit(p)}
            onCalendar={() => setCalendarFor(p)}
          />
        ))}
      </div>

      {calendarFor && (
        <ProviderCalendar
          provider={calendarFor}
          bookings={bookings.filter((b) => b.provider_id === calendarFor.id)}
          live={!!supabase}
          onClose={() => setCalendarFor(null)}
        />
      )}
    </div>
  )
}

function ProviderCard({
  provider,
  jobCount,
  onEdit,
  onCalendar,
}: {
  provider: Provider
  jobCount: number
  onEdit: () => void
  onCalendar: () => void
}) {
  const workingSet = new Set(provider.working_days)
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{provider.name}</h3>
          {provider.profession && <p className="text-sm text-muted">{provider.profession}</p>}
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

      <div className="mt-4">
        <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Availability</p>
        <div className="flex gap-1.5">
          {WEEK.map((d, i) => {
            const on = workingSet.has(d.day)
            return (
              <span
                key={i}
                title={`${d.full}: ${on ? 'working' : 'off'}`}
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
        <span className="text-muted">
          {jobCount} job{jobCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCalendar}
          className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white transition-colors hover:border-saffron/50 hover:text-saffron"
        >
          📅 Calendar
        </button>
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm text-white transition-colors hover:border-saffron/50 hover:text-saffron"
        >
          ✏️ Edit
        </button>
      </div>
    </div>
  )
}

// ─── Live weekly calendar for one provider ────────────────────────────────────
function ProviderCalendar({
  provider,
  bookings,
  live,
  onClose,
}: {
  provider: Provider
  bookings: Booking[]
  live: boolean
  onClose: () => void
}) {
  const workingSet = new Set(provider.working_days)
  const byDay = useMemo(() => {
    const map = new Map<number, Booking[]>()
    for (const b of bookings) {
      const wd = slotWeekday(b.slot_date)
      const arr = map.get(wd) ?? []
      arr.push(b)
      map.set(wd, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => minutesOf(a.slot_time) - minutesOf(b.slot_time))
    return map
  }, [bookings])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-ink p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-white">
              {provider.name}{' '}
              <span className="text-sm font-normal text-muted">· weekly schedule</span>
            </h3>
            <p className="mt-1 text-sm text-muted">
              {fmtHour(provider.start_time)} – {fmtHour(provider.end_time)} ·{' '}
              {bookings.length} assigned job{bookings.length === 1 ? '' : 's'}
              {live && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" /> live
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-muted hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {WEEK.map((d) => {
            const on = workingSet.has(d.day)
            const jobs = byDay.get(d.day) ?? []
            return (
              <div
                key={d.day}
                className={`min-h-44 rounded-xl border p-2 ${
                  on ? 'border-white/10 bg-ink-soft' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${on ? 'text-white' : 'text-white/30'}`}>
                    {d.full}
                  </span>
                  {!on && <span className="text-[10px] uppercase text-white/20">off</span>}
                </div>
                {on && (
                  <p className="mb-2 text-[10px] text-muted">
                    {fmtHour(provider.start_time)}–{fmtHour(provider.end_time)}
                  </p>
                )}
                <div className="space-y-1.5">
                  {jobs.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-saffron/30 bg-saffron/10 p-1.5 text-[11px] leading-tight"
                    >
                      <p className="font-semibold text-saffron">{b.slot_time ?? '—'}</p>
                      <p className="text-white">
                        {b.service_type ? SERVICE_EMOJI[b.service_type] ?? '' : ''}{' '}
                        {b.user_name ?? 'Customer'}
                      </p>
                      <p className="text-muted">{b.area ?? ''}</p>
                    </div>
                  ))}
                  {on && jobs.length === 0 && (
                    <p className="text-[11px] italic text-white/25">Free</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Add / edit provider form ─────────────────────────────────────────────────
function ProviderForm({
  initial,
  canPersist,
  onSaved,
  onCancel,
}: {
  initial: Provider | null
  canPersist: boolean
  onSaved: (p: Provider) => void
  onCancel: () => void
}) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [profession, setProfession] = useState(initial?.profession ?? '')
  const [services, setServices] = useState<Set<string>>(new Set(initial?.services ?? []))
  const [areas, setAreas] = useState<Set<string>>(new Set(initial?.areas ?? []))
  const [days, setDays] = useState<Set<number>>(
    new Set(initial?.working_days ?? [1, 2, 3, 4, 5, 6])
  )
  const [start, setStart] = useState(initial?.start_time ?? '09:00')
  const [end, setEnd] = useState(initial?.end_time ?? '18:00')
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

    // Sample mode (no live backend): update the view only.
    if (!canPersist) {
      onSaved({
        id: initial?.id ?? `local-${Date.now()}`,
        rating: initial?.rating ?? 5.0,
        active: initial?.active ?? true,
        created_at: initial?.created_at ?? new Date().toISOString(),
        ...payload,
        phone: payload.phone || null,
        profession: payload.profession || null,
      } as Provider)
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/providers', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...payload, id: initial!.id } : payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || 'Could not save provider.')
        return
      }
      onSaved(j.provider as Provider)
    } finally {
      setBusy(false)
    }
  }

  const fieldCls =
    'w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-saffron/60'

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-saffron/30 bg-ink-soft p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white">
          {isEdit ? `Edit ${initial!.name}` : 'New provider'}
        </h3>
        <button type="button" onClick={onCancel} className="text-sm text-muted hover:text-white">
          Cancel
        </button>
      </div>

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
                  title={d.full}
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
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save provider'}
        </button>
        {!canPersist && (
          <span className="text-xs text-muted">
            Sample mode — changes apply to the view only (connect Supabase to persist).
          </span>
        )}
      </div>
    </form>
  )
}
