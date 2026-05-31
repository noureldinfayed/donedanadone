import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Server-side Supabase client ──────────────────────────────────────────────
// Uses the service role key — NEVER import this file into a client component.
// Lazy proxy so importing this file at build time (e.g. during page data
// collection) doesn't crash when env vars aren't set yet.
let cachedClient: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})

// ─── Domain types ────────────────────────────────────────────────────────────
export type ServiceType = 'home_chef' | 'house_help'
export type SlotDate = 'today' | 'tomorrow' | 'weekend'

export interface SavedAddress {
  city: string
  sector: string
  apartment: string
  full_address: string
}

export type ConversationStateName =
  | 'WELCOME'
  | 'AREA_CHECK'
  | 'RETURNING_CUSTOMER_CHECK'
  | 'ADDRESS_CITY'
  | 'ADDRESS_SECTOR'
  | 'ADDRESS_APARTMENT'
  | 'BLACKLIST_CHECK'
  | 'SLOT_DAY_SELECT'
  | 'SLOT_TIME_SELECT'
  | 'COLLECT_NAME'
  | 'COLLECT_ADDRESS'
  | 'COLLECT_LANDMARK'
  | 'COLLECT_NOTES'
  | 'PAYMENT'
  | 'CONFIRMED'
  | 'PROVIDER_RESPONSE'
  | 'PROVIDER_DECLINE_WORKING'
  | 'PROVIDER_DECLINE_REASON'
  | 'PROVIDER_REASSIGN'

export interface ConversationData {
  service_type?: ServiceType
  area?: string
  address_city?: string
  address_sector?: string
  address_apartment?: string
  slot_date?: SlotDate
  slot_time?: string
  slot_options?: { id: string; slot_time: string }[]
  saved_address_options?: SavedAddress[]
  user_name?: string
  address?: string
  landmark?: string
  notes?: string
  booking_id?: string
  provider_id?: string
  provider_decline_reason?: string
}

export interface Provider {
  id: string
  name: string
  phone: string | null
  profession: string | null
  services: string[]
  areas: string[]
  working_days: number[] // 0=Sun .. 6=Sat
  start_time: string // 'HH:MM' 24h
  end_time: string // 'HH:MM' 24h
  rating: number
  active: boolean
  created_at: string
}

export interface Booking {
  id: string
  booking_display_id?: string | null
  user_phone: string
  user_name: string | null
  service_type: string | null
  area: string | null
  slot_date: string | null
  slot_time: string | null
  address: string | null
  landmark: string | null
  notes: string | null
  provider_id: string | null
  payment_status: string
  payment_link: string | null
  amount_paid?: number | null
  payment_method?: string | null
  razorpay_payment_id?: string | null
  transaction_timestamp?: string | null
  status: string
  created_at: string
  // Optional joined provider name for display (admin dashboard).
  provider_name?: string | null
}
