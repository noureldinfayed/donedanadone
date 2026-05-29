'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Booking } from '@/lib/supabase'

interface Props {
  initial: Booking[]
  supabaseUrl: string
  supabaseAnonKey: string
}

const SERVICE_LABEL: Record<string, string> = {
  home_chef: 'Home Chef',
  house_help: 'House Help',
  dog_walker: 'Dog Walker',
  babysitter: 'Babysitter',
  electrician: 'Electrician',
  plumber: 'Plumber',
}

function statusClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function paymentClass(s: string) {
  return s === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
}

export default function BookingsTable({ initial, supabaseUrl, supabaseAnonKey }: Props) {
  const [rows, setRows] = useState<Booking[]>(initial)

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
              return prev.map((r) =>
                r.id === (payload.new as Booking).id ? (payload.new as Booking) : r
              )
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((r) => r.id !== (payload.old as Booking).id)
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

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-muted">
        No bookings yet — when a customer messages your WhatsApp number, they’ll
        show up here in real time.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10">
      <table className="w-full text-sm">
        <thead className="bg-black/5 text-left">
          <tr>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Area</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-black/5">
              <td className="px-4 py-3 font-mono text-xs">
                {r.user_phone.replace(/^whatsapp:/, '')}
              </td>
              <td className="px-4 py-3">{r.user_name ?? '—'}</td>
              <td className="px-4 py-3">
                {r.service_type ? SERVICE_LABEL[r.service_type] ?? r.service_type : '—'}
              </td>
              <td className="px-4 py-3">{r.area ?? '—'}</td>
              <td className="px-4 py-3 capitalize">{r.slot_date ?? '—'}</td>
              <td className="px-4 py-3">{r.slot_time ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentClass(
                    r.payment_status
                  )}`}
                >
                  {r.payment_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
