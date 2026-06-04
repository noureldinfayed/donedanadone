import { supabaseAdmin } from './supabase'
import type {
  ConversationData,
  ConversationStateName,
  Provider,
  SavedAddress,
  ServiceType,
  SlotDate,
} from './supabase'
import { parseIntent, parseUnavailableUntil } from './gemini'
import { createPaymentLink } from './razorpay'
import { autoAssignProvider } from './match'
import type { Booking } from './supabase'
import { sendWhatsApp } from './whatsapp'
import { normalizeWhatsAppAddress, samePhone } from './phone'

// ─── Constants ───────────────────────────────────────────────────────────────
const BOOKING_PRICE_INR = Number(process.env.BOOKING_PRICE_INR ?? 499)

const SERVICE_LABEL: Record<ServiceType, string> = {
  home_chef: 'Home Chef',
  house_help: 'House Help',
}

const SLOT_DAY_LABEL: Record<SlotDate, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This Weekend',
}

const ADDRESS_CITIES = ['Gurugram', 'Noida', 'Delhi', 'Mumbai', 'Bangalore'] as const

const CITY_SECTORS: Record<string, string[]> = {
  Delhi: ['Sector 48', 'Sector 49', 'Sector 50', 'Sector 51', 'Lajpat Nagar', 'Hauz Khas'],
  Gurugram: ['DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'Sector 14', 'Sector 15', 'Sector 29'],
  Noida: ['Sector 18', 'Sector 50', 'Sector 62', 'Sector 63', 'Greater Noida'],
  Mumbai: ['Bandra West', 'Andheri East', 'Powai', 'Juhu', 'Worli'],
  Bangalore: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Electronic City'],
}

// ─── State persistence ──────────────────────────────────────────────────────
interface PersistedState {
  state: ConversationStateName
  data: ConversationData
}

async function loadState(phone: string): Promise<PersistedState> {
  const { data, error } = await supabaseAdmin
    .from('conversation_state')
    .select('state, data')
    .eq('phone', phone)
    .maybeSingle()
  if (error) console.error('[state] loadState', error)
  if (!data) return { state: 'WELCOME', data: {} }
  return {
    state: data.state as ConversationStateName,
    data: (data.data as ConversationData) ?? {},
  }
}

async function saveState(
  phone: string,
  state: ConversationStateName,
  data: ConversationData
) {
  const { error } = await supabaseAdmin.from('conversation_state').upsert(
    {
      phone,
      state,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  )
  if (error) console.error('[state] saveState', error)
}

async function resetState(phone: string) {
  await saveState(phone, 'WELCOME', {})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function isResetWord(text: string): boolean {
  const t = normalize(text)
  return ['menu', 'restart', 'reset', 'start', 'hi', 'hello', 'hey'].includes(t)
}

function isProviderState(state: ConversationStateName): boolean {
  return (
    state === 'PROVIDER_RESPONSE' ||
    state === 'PROVIDER_DECLINE_WORKING' ||
    state === 'PROVIDER_DECLINE_REASON' ||
    state === 'PROVIDER_REASSIGN'
  )
}

function welcomeMessage(): string {
  return (
    'Welcome to DoneDanaDone! 🏠\n\n' +
    'What service do you need today?\n\n' +
    '1️⃣ Home Chef\n' +
    '2️⃣ House Help'
  )
}

function pickServiceFromInput(input: string): ServiceType | null {
  const t = normalize(input)
  if (t === '1' || t.includes('home chef') || t.includes('chef') || t.includes('cook'))
    return 'home_chef'
  if (
    t === '2' ||
    t.includes('house help') ||
    t.includes('maid') ||
    t.includes('cleaner') ||
    t.includes('cleaning')
  )
    return 'house_help'
  return null
}

function optionList(title: string, options: string[], suffix?: string): string {
  const lines = options.map((option, index) => `${index + 1}. ${option}`).join('\n')
  return `${title}\n\n${lines}${suffix ? `\n\n${suffix}` : ''}`
}

function pickFromOptions(input: string, options: string[]): string | null {
  const t = normalize(input)
  const index = Number.parseInt(t, 10) - 1
  if (Number.isInteger(index) && index >= 0 && index < options.length) {
    return options[index]
  }
  return options.find((option) => normalize(option) === t) ?? null
}

function addressLabel(address: SavedAddress): string {
  return address.full_address || `${address.apartment}, ${address.sector}, ${address.city}`
}

function savedAddressFromData(data: ConversationData): SavedAddress | null {
  if (!data.address_city || !data.address_sector || !data.address_apartment) return null
  return {
    city: data.address_city,
    sector: data.address_sector,
    apartment: data.address_apartment,
    full_address:
      data.address ?? `${data.address_apartment}, ${data.address_sector}, ${data.address_city}`,
  }
}

function normalizeSavedAddresses(value: unknown): SavedAddress[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const city = typeof row.city === 'string' ? row.city.trim() : ''
      const sector = typeof row.sector === 'string' ? row.sector.trim() : ''
      const apartment = typeof row.apartment === 'string' ? row.apartment.trim() : ''
      const full_address =
        typeof row.full_address === 'string'
          ? row.full_address.trim()
          : `${apartment}, ${sector}, ${city}`
      if (!city || !sector || !apartment) return null
      return { city, sector, apartment, full_address }
    })
    .filter((item): item is SavedAddress => !!item)
}

function pickSlotDayFromInput(input: string): SlotDate | null {
  const t = normalize(input)
  if (t === '1' || t.includes('today')) return 'today'
  if (t === '2' || t.includes('tomorrow')) return 'tomorrow'
  if (t === '3' || t.includes('weekend') || t.includes('saturday') || t.includes('sunday'))
    return 'weekend'
  return null
}

async function findArea(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return null
  const { data, error } = await supabaseAdmin
    .from('service_areas')
    .select('area_name, serviceable')
    .ilike('area_name', trimmed)
    .maybeSingle()
  if (error) {
    console.error('[state] findArea', error)
    return null
  }
  return data
}

async function fetchSlots(service_type: ServiceType, slot_date: SlotDate) {
  const { data, error } = await supabaseAdmin
    .from('slots')
    .select('id, slot_time')
    .eq('service_type', service_type)
    .eq('slot_date', slot_date)
    .eq('available', true)
    .order('slot_time')
  if (error) {
    console.error('[state] fetchSlots', error)
    return []
  }
  return data ?? []
}

async function fetchCustomer(phone: string): Promise<{
  name: string | null
  saved_addresses: SavedAddress[]
} | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('name, saved_addresses')
    .eq('phone', phone)
    .maybeSingle()
  if (error) {
    console.error('[state] fetchCustomer', error)
    return null
  }
  if (!data) return null
  return {
    name: typeof data.name === 'string' ? data.name : null,
    saved_addresses: normalizeSavedAddresses(data.saved_addresses),
  }
}

async function saveCustomerAddress(phone: string, data: ConversationData) {
  const address = savedAddressFromData(data)
  if (!address) return

  const existing = await fetchCustomer(phone)
  const addresses = existing?.saved_addresses ?? []
  const key = (a: SavedAddress) =>
    `${normalize(a.city)}|${normalize(a.sector)}|${normalize(a.apartment)}`
  const next = [
    address,
    ...addresses.filter((item) => key(item) !== key(address)),
  ].slice(0, 6)

  const { error } = await supabaseAdmin.from('customers').upsert(
    {
      phone,
      name: data.user_name ?? existing?.name ?? null,
      saved_addresses: next,
      last_address: address,
    },
    { onConflict: 'phone' }
  )
  if (error) console.error('[state] saveCustomerAddress', error)
}

async function updateCustomerName(phone: string, name: string) {
  const { error } = await supabaseAdmin
    .from('customers')
    .upsert({ phone, name }, { onConflict: 'phone' })
  if (error) console.error('[state] updateCustomerName', error)
}

async function isBlacklistedAddress(data: ConversationData) {
  if (!data.address_city || !data.address_sector || !data.address_apartment) return false
  const { data: row, error } = await supabaseAdmin
    .from('blacklist_addresses')
    .select('id')
    .ilike('city', data.address_city)
    .ilike('sector', data.address_sector)
    .ilike('apartment', data.address_apartment)
    .maybeSingle()
  if (error) {
    console.error('[state] blacklist check', error)
    return false
  }
  return !!row
}

async function generateBookingDisplayId(): Promise<string> {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let attempt = 0; attempt < 8; attempt += 1) {
    let suffix = ''
    for (let i = 0; i < 4; i += 1) {
      suffix += letters[Math.floor(Math.random() * letters.length)]
    }
    const candidate = `DDD-${stamp}-${suffix}`
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('booking_display_id', candidate)
      .maybeSingle()
    if (error) {
      console.error('[state] display id check', error)
      return candidate
    }
    if (!data) return candidate
  }

  return `DDD-${stamp}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}

function bookingSummary(data: ConversationData): string {
  const service = data.service_type ? SERVICE_LABEL[data.service_type] : 'Service'
  const day = data.slot_date ? SLOT_DAY_LABEL[data.slot_date] : ''
  const time = data.slot_time ?? ''
  return `${service} · ${day} · ${time}\n📍 ${data.address ?? ''}`
}

function bookingOrderId(booking: Pick<Booking, 'id' | 'booking_display_id'>): string {
  return booking.booking_display_id ?? booking.id.slice(0, 8).toUpperCase()
}

function providerBookingMessage(provider: Provider, booking: Booking): string {
  const service = booking.service_type
    ? SERVICE_LABEL[booking.service_type as ServiceType] ?? booking.service_type
    : 'Service'
  return (
    'New Booking! 🔔\n\n' +
    `Order #${bookingOrderId(booking)}\n` +
    `Service: ${service}\n` +
    `Date: ${booking.slot_date ?? ''} at ${booking.slot_time ?? ''}\n` +
    `Address: ${booking.address ?? ''}\n` +
    `Customer: ${booking.user_name ?? ''}\n\n` +
    'Reply:\n' +
    '1 - Confirm ✅\n' +
    '2 - Decline ❌'
  )
}

function customerConfirmedMessage(booking: Booking, provider: Provider | null): string {
  const service = booking.service_type
    ? SERVICE_LABEL[booking.service_type as ServiceType] ?? booking.service_type
    : 'Service'
  const providerLine = provider
    ? `Provider: ${provider.name}${provider.phone ? ` (${provider.phone})` : ''}`
    : 'Provider: Confirmed'
  return (
    '🎉 Booking Confirmed!\n\n' +
    `Order ID: ${bookingOrderId(booking)}\n` +
    `Service: ${service}\n` +
    `Date & Time: ${booking.slot_date ?? ''} ${booking.slot_time ?? ''}\n` +
    `Address: ${booking.address ?? ''}\n` +
    `${providerLine}\n\n` +
    'Reply here if you need to change anything.'
  )
}

async function fetchBooking(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, booking_display_id, user_phone, user_name, service_type, area, slot_date, slot_time, address, landmark, notes, provider_id, payment_status, payment_link, amount_paid, payment_method, razorpay_payment_id, transaction_timestamp, status, created_at'
    )
    .eq('id', bookingId)
    .maybeSingle()
  if (error || !data) {
    console.error('[state] booking lookup failed', error)
    return null
  }
  return data as Booking
}

async function fetchProvider(providerId: string): Promise<Provider | null> {
  const { data, error } = await supabaseAdmin
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .maybeSingle()
  if (error || !data) {
    console.error('[state] provider lookup failed', error)
    return null
  }
  return data as Provider
}

async function findProviderByPhone(phone: string): Promise<Provider | null> {
  const { data, error } = await supabaseAdmin.from('providers').select('*')
  if (error) {
    console.error('[state] provider phone lookup failed', error)
    return null
  }
  return ((data ?? []) as Provider[]).find((provider) => samePhone(provider.phone, phone)) ?? null
}

async function loadPendingProviderState(phone: string): Promise<PersistedState | null> {
  const provider = await findProviderByPhone(phone)
  if (!provider) return null
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('provider_id', provider.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  const state: PersistedState = {
    state: 'PROVIDER_RESPONSE',
    data: { booking_id: data.id as string, provider_id: provider.id },
  }
  await saveState(phone, state.state, state.data)
  return state
}

// ─── Main entry point ───────────────────────────────────────────────────────
/**
 * Drive the state machine forward by one user message. Returns the bot's reply
 * (to be sent back over WhatsApp by the caller).
 */
export async function handleIncomingMessage(
  phone: string,
  message: string
): Promise<string> {
  const normalizedPhone = normalizeWhatsAppAddress(phone)
  const current = await loadState(normalizedPhone)

  if (isProviderState(current.state)) {
    try {
      return await advance(normalizedPhone, current, message)
    } catch (err) {
      console.error('[state] provider advance failed:', err)
      return 'Sorry, something went wrong. Please reply again in a moment.'
    }
  }

  const providerFallback = current.state === 'WELCOME'
    ? await loadPendingProviderState(normalizedPhone)
    : null
  if (providerFallback) {
    try {
      return await advance(normalizedPhone, providerFallback, message)
    } catch (err) {
      console.error('[state] provider fallback failed:', err)
      return 'Sorry, something went wrong. Please reply again in a moment.'
    }
  }

  // Universal reset words always go back to WELCOME for customer flows.
  if (isResetWord(message)) {
    await resetState(normalizedPhone)
    return welcomeMessage()
  }

  try {
    return await advance(normalizedPhone, current, message)
  } catch (err) {
    console.error('[state] advance failed:', err)
    return (
      "😕 Sorry, something went wrong on our side. Type 'menu' to start over " +
      'and we’ll get you booked.'
    )
  }
}

async function advance(
  phone: string,
  current: PersistedState,
  rawMessage: string
): Promise<string> {
  const message = rawMessage.trim()
  const { state, data } = current

  switch (state) {
    // ─── WELCOME ───────────────────────────────────────────────────────────
    case 'WELCOME': {
      let service = pickServiceFromInput(message)
      if (!service) {
        // Free-text fallback — ask Gemini.
        const intent = await parseIntent(message)
        service = intent.service_type
        if (intent.area) data.area = intent.area
        if (intent.time_preference) data.slot_date = intent.time_preference
      }
      if (!service) {
        return (
          "I didn’t catch that. Please reply with:\n\n" +
          '1️⃣ Home Chef\n' +
          '2️⃣ House Help'
        )
      }
      data.service_type = service

      // If Gemini already gave us an area, try to validate it.
      if (data.area) {
        const area = await findArea(data.area)
        if (area && area.serviceable) {
          data.area = area.area_name
          return await enterReturningCustomerCheck(phone, data)
        }
        // Bad area inferred — clear and ask explicitly.
        data.area = undefined
      }

      await saveState(phone, 'AREA_CHECK', data)
      return `Got it — ${SERVICE_LABEL[service]} 🙌\n\nWhich area are you in? Please type your area name.`
    }

    // ─── AREA_CHECK ────────────────────────────────────────────────────────
    case 'AREA_CHECK': {
      const area = await findArea(message)
      if (!area) {
        return (
          `Hmm, I couldn’t find "${message}" in our list. ` +
          'Please type your area/city name (e.g. Gurugram, Noida, Delhi, Mumbai, Bangalore).'
        )
      }
      if (!area.serviceable) {
        await resetState(phone)
        return (
          `😔 Sorry, we’re not serviceable in ${area.area_name} yet. ` +
          'We’ll notify you when we expand!\n\n' +
          "Type 'menu' to start over."
        )
      }
      data.area = area.area_name
      return await enterReturningCustomerCheck(phone, data)
    }

    // ─── RETURNING_CUSTOMER_CHECK ─────────────────────────────────────────
    case 'RETURNING_CUSTOMER_CHECK': {
      const options = data.saved_address_options ?? []
      const labels = [...options.map(addressLabel), 'New Address']
      const choice = pickFromOptions(message, labels)
      if (!choice) {
        return optionList(
          `Welcome back${data.user_name ? ` ${data.user_name}` : ''}! Which address should we use?`,
          labels,
          'Reply with a number or address name.'
        )
      }
      if (normalize(choice) === 'new address') {
        delete data.saved_address_options
        return await enterAddressCity(phone, data)
      }
      const selected = options[labels.indexOf(choice)]
      if (!selected) return await enterAddressCity(phone, data)
      data.address_city = selected.city
      data.address_sector = selected.sector
      data.address_apartment = selected.apartment
      data.address = selected.full_address
      data.area = selected.city
      delete data.saved_address_options
      await saveCustomerAddress(phone, data)
      return await enterSlotDaySelect(phone, data)
    }

    // ─── ADDRESS_CITY ─────────────────────────────────────────────────────
    case 'ADDRESS_CITY': {
      const city = pickFromOptions(message, [...ADDRESS_CITIES])
      if (!city) {
        return optionList('Please choose your city:', [...ADDRESS_CITIES])
      }
      data.address_city = city
      data.area = city
      return await enterAddressSector(phone, data)
    }

    // ─── ADDRESS_SECTOR ───────────────────────────────────────────────────
    case 'ADDRESS_SECTOR': {
      const city = data.address_city
      if (!city) return await enterAddressCity(phone, data)
      const sectors = CITY_SECTORS[city] ?? []
      const sector = pickFromOptions(message, sectors)
      if (!sector) {
        return optionList(`Choose your sector/locality in ${city}:`, sectors)
      }
      data.address_sector = sector
      await saveState(phone, 'ADDRESS_APARTMENT', data)
      return 'Please type your apartment/building name and flat number:'
    }

    // ─── ADDRESS_APARTMENT ────────────────────────────────────────────────
    case 'ADDRESS_APARTMENT': {
      if (message.length < 2) {
        return 'Please type your apartment/building name and flat number:'
      }
      data.address_apartment = message
      data.address = `${message}, ${data.address_sector ?? ''}, ${data.address_city ?? ''}`
      return await enterBlacklistCheck(phone, data)
    }

    // ─── BLACKLIST_CHECK ──────────────────────────────────────────────────
    case 'BLACKLIST_CHECK': {
      return await enterBlacklistCheck(phone, data)
    }

    // ─── SLOT_DAY_SELECT ──────────────────────────────────────────────────
    case 'SLOT_DAY_SELECT': {
      let day = pickSlotDayFromInput(message)
      if (!day) {
        const intent = await parseIntent(message)
        day = intent.time_preference
      }
      if (!day) {
        return (
          'Please pick a day:\n\n' +
          '1️⃣ Today\n' +
          '2️⃣ Tomorrow\n' +
          '3️⃣ This Weekend'
        )
      }
      data.slot_date = day
      return await enterSlotTimeSelect(phone, data)
    }

    // ─── SLOT_TIME_SELECT ─────────────────────────────────────────────────
    case 'SLOT_TIME_SELECT': {
      const options = data.slot_options ?? []
      const idx = parseInt(message, 10) - 1
      if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
        return `Please reply with a slot number (1–${options.length}).`
      }
      const choice = options[idx]
      data.slot_time = choice.slot_time
      delete data.slot_options
      await saveState(phone, 'COLLECT_NAME', data)
      return 'Please share your full name:'
    }

    // ─── COLLECT_NAME ─────────────────────────────────────────────────────
    case 'COLLECT_NAME': {
      if (message.length < 2) return 'Please share your full name (at least 2 characters):'
      data.user_name = message
      await updateCustomerName(phone, message)
      if (data.address) {
        await saveState(phone, 'COLLECT_LANDMARK', data)
        return "Any landmark near your location? (or type 'skip')"
      }
      await saveState(phone, 'COLLECT_ADDRESS', data)
      return 'Please share your full address:'
    }

    // ─── COLLECT_ADDRESS ──────────────────────────────────────────────────
    case 'COLLECT_ADDRESS': {
      if (message.length < 5) return 'Please share your full address (at least 5 characters):'
      data.address = message
      await saveState(phone, 'COLLECT_LANDMARK', data)
      return "Any landmark near your location? (or type 'skip')"
    }

    // ─── COLLECT_LANDMARK ─────────────────────────────────────────────────
    case 'COLLECT_LANDMARK': {
      data.landmark = normalize(message) === 'skip' ? '' : message
      await saveState(phone, 'COLLECT_NOTES', data)
      return "Any special instructions for the professional? (or type 'skip')"
    }

    // ─── COLLECT_NOTES ────────────────────────────────────────────────────
    case 'COLLECT_NOTES': {
      data.notes = normalize(message) === 'skip' ? '' : message
      return await enterPayment(phone, data)
    }

    // ─── PROVIDER_RESPONSE ────────────────────────────────────────────────
    case 'PROVIDER_RESPONSE': {
      const t = normalize(message)
      if (t === '1' || t === 'confirm' || t === 'confirmed') {
        return await confirmProviderBooking(phone, data)
      }
      if (t === '2' || t === 'decline' || t === 'declined') {
        await saveState(phone, 'PROVIDER_DECLINE_WORKING', data)
        return 'Are you working today?'
      }
      return 'Please reply with 1 to confirm or 2 to decline.'
    }

    // ─── PROVIDER_DECLINE_WORKING ─────────────────────────────────────────
    case 'PROVIDER_DECLINE_WORKING': {
      const t = normalize(message)
      if (t === 'yes' || t === 'y') {
        await saveState(phone, 'PROVIDER_DECLINE_REASON', data)
        return 'Reason for declining?'
      }
      if (t === 'no' || t === 'n') {
        if (data.provider_id) {
          await markProviderUnavailableToday(data.provider_id, 'Provider not working today')
        }
        data.provider_decline_reason = 'Provider not working today'
        await saveState(phone, 'PROVIDER_REASSIGN', data)
        return await providerReassign(phone, data)
      }
      return 'Please reply yes or no.'
    }

    // ─── PROVIDER_DECLINE_REASON ──────────────────────────────────────────
    case 'PROVIDER_DECLINE_REASON': {
      data.provider_decline_reason = message
      await saveState(phone, 'PROVIDER_REASSIGN', data)
      return await providerReassign(phone, data)
    }

    // ─── PROVIDER_REASSIGN ────────────────────────────────────────────────
    case 'PROVIDER_REASSIGN': {
      return await providerReassign(phone, data)
    }

    // ─── PAYMENT (waiting for Razorpay webhook) ───────────────────────────
    case 'PAYMENT': {
      return (
        '⏳ Waiting for payment confirmation. Once it’s through, you’ll get your ' +
        "booking ID here.\n\nType 'menu' to start a new booking."
      )
    }

    // ─── CONFIRMED (post-payment) ─────────────────────────────────────────
    case 'CONFIRMED': {
      await resetState(phone)
      return welcomeMessage()
    }

    default: {
      await resetState(phone)
      return welcomeMessage()
    }
  }
}

// ─── State entry helpers ─────────────────────────────────────────────────────
async function enterReturningCustomerCheck(phone: string, data: ConversationData) {
  const customer = await fetchCustomer(phone)
  if (!customer || customer.saved_addresses.length === 0) {
    return await enterAddressCity(phone, data)
  }

  data.user_name = data.user_name ?? customer.name ?? undefined
  data.saved_address_options = customer.saved_addresses
  await saveState(phone, 'RETURNING_CUSTOMER_CHECK', data)

  const labels = [...customer.saved_addresses.map(addressLabel), 'New Address']
  return optionList(
    `Welcome back${customer.name ? ` ${customer.name}` : ''}! Which address should we use?`,
    labels,
    'Reply with a number.'
  )
}

async function enterAddressCity(phone: string, data: ConversationData) {
  await saveState(phone, 'ADDRESS_CITY', data)
  return optionList('Please choose your city:', [...ADDRESS_CITIES])
}

async function enterAddressSector(phone: string, data: ConversationData) {
  const city = data.address_city
  if (!city) return await enterAddressCity(phone, data)
  const sectors = CITY_SECTORS[city] ?? []
  await saveState(phone, 'ADDRESS_SECTOR', data)
  return optionList(`Choose your sector/locality in ${city}:`, sectors)
}

async function enterBlacklistCheck(phone: string, data: ConversationData) {
  await saveState(phone, 'BLACKLIST_CHECK', data)
  const blacklisted = await isBlacklistedAddress(data)
  if (blacklisted) {
    await resetState(phone)
    return (
      `Sorry, we currently don't provide services in ${data.address_apartment}, ` +
      `${data.address_sector}, ${data.address_city}. We'll notify you when we expand! ` +
      "Type 'menu' to start over."
    )
  }

  await saveCustomerAddress(phone, data)
  return await enterSlotDaySelect(phone, data)
}

async function enterSlotDaySelect(phone: string, data: ConversationData) {
  await saveState(phone, 'SLOT_DAY_SELECT', data)
  return (
    `Great! When do you need the service?\n\n` +
    '1️⃣ Today\n' +
    '2️⃣ Tomorrow\n' +
    '3️⃣ This Weekend'
  )
}

async function enterSlotTimeSelect(phone: string, data: ConversationData) {
  if (!data.service_type || !data.slot_date) {
    return await enterSlotDaySelect(phone, data)
  }
  const slots = await fetchSlots(data.service_type, data.slot_date)
  if (slots.length === 0) {
    return (
      `Sorry, no slots available for ${SLOT_DAY_LABEL[data.slot_date]}. ` +
      'Please reply with another day:\n\n1️⃣ Today\n2️⃣ Tomorrow\n3️⃣ This Weekend'
    )
  }
  data.slot_options = slots
  await saveState(phone, 'SLOT_TIME_SELECT', data)
  const lines = slots
    .map((s, i) => `${i + 1}️⃣ ${s.slot_time}`)
    .join('\n')
  return `Pick a time slot:\n\n${lines}`
}

async function enterPayment(phone: string, data: ConversationData) {
  const bookingDisplayId = await generateBookingDisplayId()

  // 1. Insert the booking.
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      booking_display_id: bookingDisplayId,
      user_phone: phone,
      user_name: data.user_name ?? null,
      service_type: data.service_type ?? null,
      area: data.area ?? null,
      slot_date: data.slot_date ?? null,
      slot_time: data.slot_time ?? null,
      address: data.address ?? null,
      landmark: data.landmark || null,
      notes: data.notes || null,
      payment_status: 'pending',
      status: 'pending',
    })
    .select('id, booking_display_id')
    .single()
  if (error || !booking) {
    console.error('[state] booking insert failed', error)
    return '😕 We couldn’t create your booking right now. Please try again in a moment.'
  }

  // 2. Create Razorpay payment link.
  let paymentUrl = ''
  try {
    const link = await createPaymentLink({
      bookingId: booking.id,
      amountInr: BOOKING_PRICE_INR,
      customerName: data.user_name,
      customerPhone: phone.replace(/^whatsapp:/, ''),
      description: `${data.service_type ? SERVICE_LABEL[data.service_type] : 'Service'} booking on ${data.slot_date} at ${data.slot_time}`,
    })
    paymentUrl = link.short_url
    await supabaseAdmin
      .from('bookings')
      .update({ payment_link: paymentUrl })
      .eq('id', booking.id)
  } catch (err) {
    console.error('[state] razorpay link failed', err)
    return (
      '😕 We saved your booking but couldn’t generate the payment link. ' +
      'Our team will reach out shortly.'
    )
  }

  data.booking_id = booking.id
  await saveState(phone, 'PAYMENT', data)

  return (
    "✅ Almost done! Here's your booking summary:\n\n" +
    bookingSummary(data) +
    `\n\nTotal: ₹${BOOKING_PRICE_INR}\n\n` +
    `💳 Pay here: ${paymentUrl}\n\n` +
    `Once payment is confirmed, you'll receive your booking ID (${booking.booking_display_id ?? bookingDisplayId}).`
  )
}

// ─── Provider confirmation / reassignment helpers ────────────────────────────
export async function requestProviderConfirmation(provider: Provider, booking: Booking) {
  await startProviderConfirmation(provider, booking)
}

async function notifyProviderWithCurrentMessage(provider: Provider, booking: Booking) {
  const message = providerBookingMessage(provider, booking)
  if (process.env.PROVIDER_NOTIFY_ENABLED === 'true' && provider.phone) {
    try {
      await sendWhatsApp(provider.phone, message)
      return
    } catch (err) {
      console.error('[state] provider confirmation send failed', err)
    }
  }
  console.info(
    `[state] (disabled) would send provider confirmation to ${provider.name} <${provider.phone ?? 'no phone'}>:\n${message}`
  )
}

export async function startProviderConfirmation(provider: Provider, booking: Booking) {
  if (provider.phone) {
    await saveState(normalizeWhatsAppAddress(provider.phone), 'PROVIDER_RESPONSE', {
      booking_id: booking.id,
      provider_id: provider.id,
    })
  }
  await notifyProviderWithCurrentMessage(provider, booking)
}

async function confirmProviderBooking(phone: string, data: ConversationData) {
  if (!data.booking_id || !data.provider_id) {
    await resetState(phone)
    return 'Booking context expired. Please contact admin.'
  }

  const booking = await fetchBooking(data.booking_id)
  const provider = await fetchProvider(data.provider_id)
  if (!booking) {
    await resetState(phone)
    return 'Booking not found. Please contact admin.'
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'provider_confirmed', provider_id: data.provider_id })
    .eq('id', data.booking_id)
  if (error) {
    console.error('[state] provider confirm failed', error)
    return 'Could not confirm this booking right now. Please try again.'
  }

  try {
    await sendWhatsApp(booking.user_phone, customerConfirmedMessage(booking, provider))
    await saveState(booking.user_phone, 'CONFIRMED', {})
  } catch (err) {
    console.error('[state] customer confirmation send failed', err)
  }

  await resetState(phone)
  return `Confirmed. Order #${bookingOrderId(booking)} is now assigned to you.`
}

async function markProviderUnavailableToday(providerId: string, reason: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  const { error } = await supabaseAdmin.from('provider_unavailability').insert({
    provider_id: providerId,
    unavailable_from: start.toISOString(),
    unavailable_until: end.toISOString(),
    reason,
  })
  if (error) console.error('[state] markProviderUnavailableToday', error)
}

function reasonContainsTime(reason: string | undefined): reason is string {
  return !!reason && /\b(?:after|from|until|post)?\s*\d{1,2}(?::?\d{2})?\s*(?:am|pm)?\b/i.test(reason)
}

async function markProviderUnavailableFromReason(providerId: string, reason: string) {
  if (!reasonContainsTime(reason)) return
  const unavailableUntil = await parseUnavailableUntil(reason)
  if (!unavailableUntil) return
  const { error } = await supabaseAdmin.from('provider_unavailability').insert({
    provider_id: providerId,
    unavailable_from: new Date().toISOString(),
    unavailable_until: unavailableUntil,
    reason,
  })
  if (error) console.error('[state] markProviderUnavailableFromReason', error)
}

async function providerReassign(phone: string, data: ConversationData) {
  if (!data.booking_id || !data.provider_id) {
    await resetState(phone)
    return 'Booking context expired. Please contact admin.'
  }

  const booking = await fetchBooking(data.booking_id)
  if (!booking) {
    await resetState(phone)
    return 'Booking not found. Please contact admin.'
  }

  if (data.provider_decline_reason) {
    await markProviderUnavailableFromReason(data.provider_id, data.provider_decline_reason)
  }

  const nextProvider = await autoAssignProvider(booking.id, booking, [data.provider_id])
  const refreshed = await fetchBooking(booking.id)

  if (nextProvider && refreshed) {
    await startProviderConfirmation(nextProvider, refreshed)
    await resetState(phone)
    return `Thanks. Order #${bookingOrderId(booking)} has been reassigned.`
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ provider_id: null, status: 'needs_manual_assignment' })
    .eq('id', booking.id)
  if (error) console.error('[state] needs_manual_assignment update failed', error)

  try {
    await sendWhatsApp(
      booking.user_phone,
      "We're confirming your provider shortly, you'll receive a message in 10 minutes."
    )
  } catch (err) {
    console.error('[state] customer reassignment hold send failed', err)
  }

  await resetState(phone)
  return 'Thanks for letting us know. No replacement was available, so admin will assign this manually.'
}

export async function handlePaidBooking(bookingId: string): Promise<{
  phone: string
  message: string
} | null> {
  const booking = await fetchBooking(bookingId)
  if (!booking) return null

  const provider = await autoAssignProvider(booking.id, booking)
  const assignedBooking = (await fetchBooking(booking.id)) ?? booking

  if (provider) {
    await startProviderConfirmation(provider, assignedBooking)
    return {
      phone: booking.user_phone,
      message:
        `Payment received for Order #${bookingOrderId(assignedBooking)}. ` +
        "We're confirming your provider now and will message you shortly.",
    }
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'needs_manual_assignment' })
    .eq('id', booking.id)
  if (error) console.error('[state] manual assignment status failed', error)

  return {
    phone: booking.user_phone,
    message: "We're confirming your provider shortly, you'll receive a message in 10 minutes.",
  }
}
