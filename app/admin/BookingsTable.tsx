'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CalendarDays, CreditCard, Pencil, Search, X } from 'lucide-react'
import type { Booking, Provider } from '@/lib/supabase'

interface Props {
  initial: Booking[]
  providers: Provider[]
  canPersist: boolean
  supabaseUrl: string
  supabaseAnonKey: string
}

const CITIES = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bangalore']
const STATUSES = [
  'pending',
  'confirmed',
  'provider_confirmed',
  'completed',
  'cancelled',
  'needs_manual_assignment',
]

const SERVICE_LABEL: Record<string, string> = {
  home_chef: 'Home Chef',
  house_help: 'House Help',
  dog_walker: 'Dog Walker',
  babysitter: 'Babysitter',
  electrician: 'Electrician',
  plumber: 'Plumber',
}

const WEEKDAY: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

function orderId(booking: Booking) {
  return booking.booking_display_id ?? booking.id.slice(0, 8).toUpperCase()
}

function serviceLabel(service: string | null) {
  return service ? SERVICE_LABEL[service] ?? service : '-'
}

function statusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300'
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    case 'provider_confirmed':
      return 'bg-green-50 text-green-700 ring-1 ring-green-200'
    case 'completed':
      return 'bg-emerald-900 text-emerald-50'
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    case 'needs_manual_assignment':
      return 'animate-pulse bg-orange-100 text-orange-800 ring-1 ring-orange-300'
    default:
      return 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300'
  }
}

function paymentClass(status: string) {
  switch (status) {
    case 'success':
    case 'paid':
      return 'bg-green-50 text-green-700 ring-1 ring-green-200'
    case 'failed':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    case 'refunded':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    case 'pending':
    default:
      return 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200'
  }
}

function cityFor(booking: Booking) {
  const source = `${booking.area ?? ''} ${booking.address ?? ''}`.toLowerCase()
  return CITIES.find((city) => source.includes(city.toLowerCase())) ?? ''
}

function createdDate(booking: Booking) {
  return booking.created_at ? booking.created_at.slice(0, 10) : ''
}

function serviceDate(booking: Booking) {
  const base = new Date(booking.created_at)
  if (Number.isNaN(base.getTime())) return createdDate(booking)
  const d = new Date(base)
  if (booking.slot_date === 'tomorrow') {
    d.setDate(d.getDate() + 1)
  }
  if (booking.slot_date === 'weekend') {
    const day = d.getDay()
    if (day !== 0 && day !== 6) d.setDate(d.getDate() + (6 - day))
  }
  return d.toISOString().slice(0, 10)
}

function dateLabel(booking: Booking) {
  if (booking.slot_date) return booking.slot_date.replaceAll('_', ' ')
  return createdDate(booking) || '-'
}

function formatTime(value: string | null | undefined) {
  return value || '-'
}

function formatCurrency(amount: number | null | undefined) {
  return typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : '-'
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function phoneLabel(booking: Booking) {
  return booking.user_phone.replace(/^whatsapp:/, '')
}

function matchesProvider(provider: Provider, booking: Booking) {
  const serviceOk = !booking.service_type || provider.services.includes(booking.service_type)
  const bookingArea = (booking.area ?? '').toLowerCase()
  const areaOk =
    !booking.area ||
    provider.areas.some((area) => {
      const providerArea = area.toLowerCase()
      return providerArea === bookingArea || bookingArea.includes(providerArea)
    })
  return provider.active && serviceOk && areaOk
}

export default function BookingsTable({
  initial,
  providers,
  canPersist,
  supabaseUrl,
  supabaseAnonKey,
}: Props) {
  const [rows, setRows] = useState<Booking[]>(initial)
  const [providerRows, setProviderRows] = useState<Provider[]>(providers)
  const [orderFilter, setOrderFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [providerModal, setProviderModal] = useState<Provider | null>(null)
  const [paymentModal, setPaymentModal] = useState<Booking | null>(null)
  const [reassigning, setReassigning] = useState<Booking | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setRows(initial), [initial])
  useEffect(() => setProviderRows(providers), [providers])

  const providerById = useMemo(() => {
    return new Map(providerRows.map((provider) => [provider.id, provider]))
  }, [providerRows])

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  }, [supabaseUrl, supabaseAnonKey])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Booking, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              const next = payload.new as Booking
              return prev.map((row) =>
                row.id === next.id ? { ...row, ...next, provider_name: row.provider_name } : row
              )
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((row) => row.id !== (payload.old as Booking).id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (orderFilter.trim() && orderId(row).toLowerCase() !== orderFilter.trim().toLowerCase()) {
        return false
      }
      if (
        nameFilter.trim() &&
        !(row.user_name ?? '').toLowerCase().includes(nameFilter.trim().toLowerCase())
      ) {
        return false
      }
      if (cityFilter !== 'all' && cityFor(row) !== cityFilter) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      const rowDate = serviceDate(row)
      if (fromDate && rowDate && rowDate < fromDate) return false
      if (toDate && rowDate && rowDate > toDate) return false
      return true
    })
  }, [cityFilter, fromDate, nameFilter, orderFilter, rows, statusFilter, toDate])

  const clearFilters = () => {
    setOrderFilter('')
    setNameFilter('')
    setCityFilter('all')
    setStatusFilter('all')
    setFromDate('')
    setToDate('')
  }

  function openReassign(booking: Booking) {
    setError('')
    setReassigning(booking)
    const first = providerRows.find((provider) => matchesProvider(provider, booking))
    setSelectedProvider(first?.id ?? '')
  }

  async function confirmReassign() {
    if (!reassigning || !selectedProvider || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/bookings/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reassigning.id,
          providerId: selectedProvider,
        }),
      })
      const json = (await res.json()) as { booking?: Booking; error?: string }
      if (!res.ok || !json.booking) throw new Error(json.error || 'Could not reassign booking')
      const updated = json.booking
      setRows((prev) =>
        prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
      )
      setReassigning(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reassign booking')
    } finally {
      setBusy(false)
    }
  }

  async function toggleProviderActive(provider: Provider, active: boolean) {
    if (!canPersist || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/providers/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id, active }),
      })
      const json = (await res.json()) as { provider?: Provider; error?: string }
      if (!res.ok || !json.provider) throw new Error(json.error || 'Could not update provider')
      const updated = json.provider
      setProviderRows((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      )
      setProviderModal(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update provider')
    } finally {
      setBusy(false)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#cfd4dc] bg-white p-10 text-center text-muted">
        No bookings yet. When a customer messages your WhatsApp number, they will show up here in real time.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#dfe3e8] bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-xs text-muted">
            <span>Order ID</span>
            <div className="flex items-center gap-2 rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-2">
              <Search className="size-4 text-muted" />
              <input
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
                placeholder="DDD-YYYYMMDD-XXXX"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted/60"
              />
            </div>
          </label>

          <label className="space-y-1 text-xs text-muted">
            <span>Customer Name</span>
            <input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Partial name"
              className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/60"
            />
          </label>

          <label className="space-y-1 text-xs text-muted">
            <span>City</span>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="all">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="all">All</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-sm text-ink outline-none"
            />
          </label>

          <label className="space-y-1 text-xs text-muted">
            <span>To</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-sm text-ink outline-none"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex size-10 items-center justify-center rounded-md border border-[#d8dde4] text-muted hover:border-ink hover:text-ink"
                title="Clear filters"
                aria-label="Clear filters"
              >
                <X className="size-4" />
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          {filteredRows.length} of {rows.length} bookings
        </span>
        {supabase && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500 animate-pulse" /> realtime active
          </span>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-4">
        {filteredRows.map((booking) => {
          const provider = booking.provider_id ? providerById.get(booking.provider_id) : null
          return (
            <BookingCard
              key={booking.id}
              booking={booking}
              provider={provider}
              onProviderClick={provider ? () => setProviderModal(provider) : undefined}
              onPaymentClick={() => setPaymentModal(booking)}
              onReassign={() => openReassign(booking)}
            />
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-[#dfe3e8] bg-white shadow-sm">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-[#f3f5f8] text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((booking) => {
              const provider = booking.provider_id ? providerById.get(booking.provider_id) : null
              return (
                <tr key={booking.id} className="border-t border-[#edf0f4] align-top text-ink">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{orderId(booking)}</td>
                  <td className="px-4 py-3">{booking.user_name ?? '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{phoneLabel(booking)}</td>
                  <td className="px-4 py-3">{serviceLabel(booking.service_type)}</td>
                  <td className="max-w-[260px] px-4 py-3 text-muted">
                    {booking.address ?? '-'}
                  </td>
                  <td className="px-4 py-3 capitalize">{dateLabel(booking)}</td>
                  <td className="px-4 py-3">{formatTime(booking.slot_time)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {provider ? (
                        <button
                          type="button"
                          onClick={() => setProviderModal(provider)}
                          className="text-left font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
                        >
                          {provider.name}
                        </button>
                      ) : booking.provider_name ? (
                        <span>{booking.provider_name}</span>
                      ) : (
                        <span className="text-xs italic text-muted">unassigned</span>
                      )}
                      <button
                        type="button"
                        onClick={() => openReassign(booking)}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-[#d8dde4] text-muted hover:border-ink hover:text-ink"
                        title="Reassign provider"
                        aria-label={`Reassign provider for ${orderId(booking)}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPaymentModal(booking)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentClass(booking.payment_status)}`}
                    >
                      {booking.payment_status}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {providerModal && (
        <ProviderModal
          provider={providerModal}
          bookings={rows.filter((row) => row.provider_id === providerModal.id)}
          canPersist={canPersist}
          busy={busy}
          error={error}
          onToggle={(active) => toggleProviderActive(providerModal, active)}
          onClose={() => {
            setProviderModal(null)
            setError('')
          }}
        />
      )}

      {paymentModal && (
        <PaymentModal booking={paymentModal} onClose={() => setPaymentModal(null)} />
      )}

      {reassigning && (
        <ReassignModal
          booking={reassigning}
          providers={providerRows.filter((provider) => matchesProvider(provider, reassigning))}
          selectedProvider={selectedProvider}
          canPersist={canPersist}
          busy={busy}
          error={error}
          onSelect={setSelectedProvider}
          onConfirm={confirmReassign}
          onClose={() => {
            setReassigning(null)
            setError('')
          }}
        />
      )}
    </div>
  )
}

function BookingCard({
  booking,
  provider,
  onProviderClick,
  onPaymentClick,
  onReassign,
}: {
  booking: Booking
  provider: Provider | null | undefined
  onProviderClick?: () => void
  onPaymentClick: () => void
  onReassign: () => void
}) {
  const providerName = provider?.name ?? booking.provider_name

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-[#dfe3e8] bg-white p-4 text-ink shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-muted">{orderId(booking)}</p>
          <h3 className="mt-1 truncate text-base font-semibold">
            {booking.user_name ?? 'Unnamed customer'}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted">{phoneLabel(booking)}</p>
        </div>
        <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <MiniField label="Service" value={serviceLabel(booking.service_type)} />
        <MiniField label="Date" value={dateLabel(booking)} />
        <MiniField label="Time" value={formatTime(booking.slot_time)} />
        <MiniField label="City" value={cityFor(booking) || booking.area || '-'} />
      </div>

      <div className="mt-3 rounded-md border border-[#edf0f4] bg-[#f8f9fb] p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Address</p>
        <p className="mt-1 text-sm leading-5 text-ink">{booking.address ?? '-'}</p>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-[#edf0f4] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Provider</p>
          {provider && onProviderClick ? (
            <button
              type="button"
              onClick={onProviderClick}
              className="mt-0.5 max-w-full truncate text-left text-sm font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline"
            >
              {provider.name}
            </button>
          ) : providerName ? (
            <p className="mt-0.5 truncate text-sm font-medium">{providerName}</p>
          ) : (
            <p className="mt-0.5 text-sm italic text-muted">unassigned</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPaymentClick}
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentClass(booking.payment_status)}`}
          >
            {booking.payment_status}
          </button>
          <button
            type="button"
            onClick={onReassign}
            className="inline-flex size-9 items-center justify-center rounded-md border border-[#d8dde4] text-muted hover:border-ink hover:text-ink"
            title="Reassign provider"
            aria-label={`Reassign provider for ${orderId(booking)}`}
          >
            <Pencil className="size-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#edf0f4] bg-[#f8f9fb] px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 min-w-0 truncate text-sm font-medium text-ink">{value}</p>
    </div>
  )
}

function ProviderModal({
  provider,
  bookings,
  canPersist,
  busy,
  error,
  onToggle,
  onClose,
}: {
  provider: Provider
  bookings: Booking[]
  canPersist: boolean
  busy: boolean
  error: string
  onToggle: (active: boolean) => void
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const todayBookings = bookings.filter((booking) => createdDate(booking) === today || booking.slot_date === 'today')
  const upcoming = groupBookings(bookings.filter((booking) => booking.status !== 'completed' && booking.status !== 'cancelled'))
  const upcomingCount = upcoming.reduce((total, [, items]) => total + items.length, 0)

  return (
    <div className="fixed inset-0 z-50 bg-white sm:flex sm:items-center sm:justify-center sm:bg-black/55 sm:p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${provider.name} details`}
        className="h-[100dvh] w-full overflow-y-auto bg-white p-4 text-ink sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-md sm:border sm:border-[#dfe3e8] sm:p-5 sm:shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader title={provider.name} subtitle={provider.profession ?? 'Provider'} onClose={onClose} />

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <section className="rounded-md border border-[#dfe3e8] bg-[#f8f9fb] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{provider.name}</h3>
                <p className="text-sm text-muted">{provider.profession ?? '-'}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={provider.active}
                  disabled={!canPersist || busy}
                  onChange={(event) => onToggle(event.target.checked)}
                  className="size-4 accent-ink"
                />
                {provider.active ? 'Active' : 'Inactive'}
              </label>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <InfoRow label="Phone" value={provider.phone ?? '-'} />
              <InfoRow label="Services" value={provider.services.map(serviceLabel).join(', ') || '-'} />
              <InfoRow label="Areas" value={provider.areas.join(', ') || '-'} />
              <InfoRow label="Rating" value={<RatingBadge rating={provider.rating} />} />
            </dl>
          </section>

          <section className="rounded-md border border-[#dfe3e8] bg-[#f8f9fb] p-4">
            <h3 className="font-semibold text-ink">Working Days & Hours</h3>
            <p className="mt-2 text-sm text-muted">
              {provider.working_days.map((day) => WEEKDAY[day]).join(', ') || '-'}
            </p>
            <p className="text-sm text-muted">
              {provider.start_time} - {provider.end_time}
            </p>

            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-ink">Ratings</h3>
                <RatingBadge rating={provider.rating} />
              </div>
              <p className="mt-2 text-sm text-[#7a5418]">All-time average from completed jobs.</p>
              <p className="text-sm text-muted">Last 5 ratings: no detailed rating rows yet.</p>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-md border border-[#dfe3e8] bg-[#f8f9fb] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Today&apos;s Bookings</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-[#dfe3e8]">
              {todayBookings.length}
            </span>
          </div>
          <BookingList bookings={todayBookings} empty="No bookings today." />
        </section>

        <section className="mt-4 rounded-md border border-[#dfe3e8] bg-[#f8f9fb] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Upcoming Bookings</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-[#dfe3e8]">
              {upcomingCount}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No upcoming bookings.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {upcoming.map(([date, items]) => (
                <div key={date}>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                    <CalendarDays className="size-4" /> {date}
                  </div>
                  <BookingList bookings={items} empty="" />
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function PaymentModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Payment for ${orderId(booking)}`}
        className="w-full max-w-lg rounded-md border border-[#dfe3e8] bg-white p-5 text-ink shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader title="Payment" subtitle={`Order #${orderId(booking)}`} onClose={onClose} />
        <div className="mt-4 rounded-md border border-[#dfe3e8] bg-[#f8f9fb] p-4">
          <div className="mb-4 flex items-center gap-2 text-ink">
            <CreditCard className="size-5" />
            <span className="font-semibold">Transaction Details</span>
          </div>
          <dl className="space-y-2 text-sm">
            <InfoRow label="Order ID" value={orderId(booking)} />
            <InfoRow label="Amount paid" value={formatCurrency(booking.amount_paid)} />
            <InfoRow label="Payment method" value={booking.payment_method ?? '-'} />
            <InfoRow label="Razorpay payment ID" value={booking.razorpay_payment_id ?? '-'} />
            <InfoRow label="Transaction timestamp" value={formatTimestamp(booking.transaction_timestamp)} />
            <InfoRow label="Status" value={booking.payment_status} />
          </dl>
        </div>
      </div>
    </div>
  )
}

function ReassignModal({
  booking,
  providers,
  selectedProvider,
  canPersist,
  busy,
  error,
  onSelect,
  onConfirm,
  onClose,
}: {
  booking: Booking
  providers: Provider[]
  selectedProvider: string
  canPersist: boolean
  busy: boolean
  error: string
  onSelect: (id: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reassign provider for ${orderId(booking)}`}
        className="w-full max-w-lg rounded-md border border-[#dfe3e8] bg-white p-5 text-ink shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader title="Reassign Provider" subtitle={`Order #${orderId(booking)}`} onClose={onClose} />
        <div className="mt-4 space-y-3">
          <label className="space-y-1 text-sm text-muted">
            <span>Active providers for {serviceLabel(booking.service_type)} in {booking.area ?? '-'}</span>
            <select
              value={selectedProvider}
              onChange={(event) => onSelect(event.target.value)}
              className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-ink outline-none"
            >
              {providers.length === 0 && <option value="">No matching active providers</option>}
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} · {provider.rating.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          {!canPersist && (
            <p className="text-sm text-yellow-700">Connect live Supabase data to reassign bookings.</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d8dde4] px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canPersist || !selectedProvider || busy}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Reassigning...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle?: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-9 items-center justify-center rounded-md border border-[#d8dde4] text-muted hover:border-ink hover:text-ink"
        title="Close"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-[#8a4f0a] ring-1 ring-amber-200">
      <span aria-hidden="true">★</span>
      {rating.toFixed(1)}
      <span className="font-medium text-[#8a4f0a]/75">avg</span>
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  )
}

function BookingList({ bookings, empty }: { bookings: Booking[]; empty: string }) {
  if (bookings.length === 0) {
    return empty ? <p className="mt-2 text-sm text-muted">{empty}</p> : null
  }
  return (
    <ul className="mt-3 space-y-2">
      {bookings.map((booking) => (
        <li key={booking.id} className="rounded-md border border-[#dfe3e8] bg-white p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink">{orderId(booking)}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <p className="mt-1 text-muted">
            {serviceLabel(booking.service_type)} · {dateLabel(booking)} · {formatTime(booking.slot_time)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function groupBookings(bookings: Booking[]): [string, Booking[]][] {
  const groups = new Map<string, Booking[]>()
  for (const booking of bookings) {
    const key = dateLabel(booking)
    groups.set(key, [...(groups.get(key) ?? []), booking])
  }
  return Array.from(groups.entries())
}
