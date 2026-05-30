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

// Pull every "HH:MM (AM/PM)" found in a slot string → minutes since midnight.
// '7:00 PM – 9:00 PM' → [1140, 1260]; '11:00 AM' → [660]; 'ASAP' → [].
function parseAllTimes(slotTime: string | null): number[] {
  if (!slotTime) return []
  const re = /(\d{1,2}):(\d{2})\s*(AM|PM)?/gi
  const out: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(slotTime))) {
    let h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    const mer = m[3]?.toUpperCase()
    if (mer === 'PM' && h < 12) h += 12
    if (mer === 'AM' && h === 12) h = 0
    out.push(h * 60 + min)
  }
  return out
}

function minutesOf(slotTime: string | null): number {
  return parseAllTimes(slotTime)[0] ?? 0
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
  return (h || 0) * 60 + (m || 0)
}

function jobStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'border-amber-400/40 bg-amber-400/15 text-amber-200'
    case 'cancelled':
      return 'border-red-400/40 bg-red-400/10 text-red-200'
    default: // assigned / confirmed
      return 'border-saffron/40 bg-saffron/15 text-saffron'
  }
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
// A real hour-axis grid: availability is shaded, jobs sit at their actual time,
// today is highlighted with a live "now" line, and ASAP/out-of-window jobs are
// surfaced separately so nothing is silently dropped.
const HOUR_H = 44 // px per hour
const DEFAULT_JOB_MINS = 90

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
  const todayWd = new Date().getDay()

  // Build the visible time window from the provider's hours, padded to whole
  // hours and widened to fit any job that starts/ends outside it.
  const { gridStart, gridEnd, hours } = useMemo(() => {
    let lo = toMin(provider.start_time)
    let hi = toMin(provider.end_time)
    for (const b of bookings) {
      const ts = parseAllTimes(b.slot_time)
      for (const t of ts) {
        lo = Math.min(lo, t)
        hi = Math.max(hi, t + 30)
      }
    }
    const gridStart = Math.floor(lo / 60) * 60
    const gridEnd = Math.max(gridStart + 60, Math.ceil(hi / 60) * 60)
    const hours: number[] = []
    for (let h = gridStart; h <= gridEnd; h += 60) hours.push(h)
    return { gridStart, gridEnd, hours }
  }, [provider.start_time, provider.end_time, bookings])

  const span = gridEnd - gridStart
  const gridH = (span / 60) * HOUR_H

  // Split jobs per weekday into positioned (have a time) and unscheduled (ASAP).
  const byDay = useMemo(() => {
    const map = new Map<number, { positioned: Booking[]; unscheduled: Booking[] }>()
    for (const d of WEEK) map.set(d.day, { positioned: [], unscheduled: [] })
    for (const b of bookings) {
      const wd = slotWeekday(b.slot_date)
      const bucket = map.get(wd)
      if (!bucket) continue
      if (parseAllTimes(b.slot_time).length) bucket.positioned.push(b)
      else bucket.unscheduled.push(b)
    }
    return map
  }, [bookings])

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const showNow = nowMin >= gridStart && nowMin <= gridEnd
  const availTop = ((toMin(provider.start_time) - gridStart) / span) * gridH
  const availH = ((toMin(provider.end_time) - toMin(provider.start_time)) / span) * gridH

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-ink p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
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

        {/* Legend */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-whatsapp/15 ring-1 ring-whatsapp/30" /> Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-saffron/40" /> Assigned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-amber-400/40" /> Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-sm border-t-2 border-red-500" /> Now
          </span>
        </div>

        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1">
            <div />
            {WEEK.map((d) => {
              const isToday = d.day === todayWd
              const count = byDay.get(d.day)
              const total = (count?.positioned.length ?? 0) + (count?.unscheduled.length ?? 0)
              return (
                <div
                  key={d.day}
                  className={`rounded-t-lg px-1 py-1.5 text-center ${
                    isToday ? 'bg-saffron/15' : ''
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      isToday ? 'text-saffron' : workingSet.has(d.day) ? 'text-white' : 'text-white/30'
                    }`}
                  >
                    {d.full}
                  </p>
                  <p className="text-[10px] text-muted">{total > 0 ? `${total} job${total === 1 ? '' : 's'}` : '—'}</p>
                </div>
              )
            })}
          </div>

          {/* Grid body */}
          <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1">
            {/* Hour axis */}
            <div className="relative" style={{ height: gridH }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-muted"
                  style={{ top: ((h - gridStart) / span) * gridH }}
                >
                  {fmtHour(`${String(Math.floor(h / 60)).padStart(2, '0')}:00`)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {WEEK.map((d) => {
              const on = workingSet.has(d.day)
              const isToday = d.day === todayWd
              const bucket = byDay.get(d.day) ?? { positioned: [], unscheduled: [] }
              return (
                <div
                  key={d.day}
                  className={`relative rounded-lg border ${
                    on ? 'border-white/10 bg-ink-soft' : 'border-white/5 bg-white/[0.015]'
                  } ${isToday ? 'ring-1 ring-saffron/40' : ''}`}
                  style={{ height: gridH }}
                >
                  {/* Hour gridlines */}
                  {hours.slice(1).map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-white/[0.06]"
                      style={{ top: ((h - gridStart) / span) * gridH }}
                    />
                  ))}

                  {/* Availability band */}
                  {on && availH > 0 && (
                    <div
                      className="absolute inset-x-0 bg-whatsapp/[0.07] ring-1 ring-inset ring-whatsapp/20"
                      style={{ top: availTop, height: availH }}
                    />
                  )}

                  {/* Now line (today only) */}
                  {isToday && showNow && (
                    <div
                      className="absolute inset-x-0 z-20 border-t-2 border-red-500"
                      style={{ top: ((nowMin - gridStart) / span) * gridH }}
                    >
                      <span className="absolute -left-1 -top-1 size-2 rounded-full bg-red-500" />
                    </div>
                  )}

                  {/* Unscheduled / ASAP jobs pinned at the top */}
                  {bucket.unscheduled.map((b, i) => (
                    <div
                      key={b.id}
                      className="absolute inset-x-0.5 z-10 rounded-md border border-dashed border-saffron/50 bg-saffron/10 px-1 py-0.5 text-[10px] leading-tight text-saffron"
                      style={{ top: 2 + i * 30 }}
                      title={`${b.user_name ?? 'Customer'} · ${b.slot_time ?? 'ASAP'}`}
                    >
                      <span className="font-semibold">ASAP</span>{' '}
                      {b.service_type ? SERVICE_EMOJI[b.service_type] ?? '' : ''}
                    </div>
                  ))}

                  {/* Positioned job blocks */}
                  {bucket.positioned.map((b) => {
                    const times = parseAllTimes(b.slot_time)
                    const s = times[0]
                    const e = times[1] ?? s + DEFAULT_JOB_MINS
                    const top = ((s - gridStart) / span) * gridH
                    const height = Math.max(26, ((e - s) / span) * gridH)
                    return (
                      <div
                        key={b.id}
                        className={`absolute inset-x-0.5 z-10 overflow-hidden rounded-md border px-1 py-0.5 text-[10px] leading-tight ${jobStatusClass(
                          b.status
                        )}`}
                        style={{ top, height }}
                        title={`${b.slot_time ?? ''} · ${b.user_name ?? 'Customer'} · ${
                          b.area ?? ''
                        }`}
                      >
                        <p className="truncate font-semibold">{b.slot_time ?? '—'}</p>
                        <p className="truncate text-white">
                          {b.service_type ? SERVICE_EMOJI[b.service_type] ?? '' : ''}{' '}
                          {b.user_name ?? 'Customer'}
                        </p>
                      </div>
                    )
                  })}

                  {!on && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wide text-white/20">Off</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
