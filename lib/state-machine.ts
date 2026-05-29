import { supabaseAdmin } from './supabase'
import type {
  ConversationData,
  ConversationStateName,
  ServiceType,
  SlotDate,
} from './supabase'
import { parseIntent } from './gemini'
import { createPaymentLink } from './razorpay'

// ─── Constants ───────────────────────────────────────────────────────────────
const BOOKING_PRICE_INR = Number(process.env.BOOKING_PRICE_INR ?? 499)
const SUPPORT_PHONE = '+91-98765-43210'

const SERVICE_LABEL: Record<ServiceType, string> = {
  home_chef: 'Home Chef',
  house_help: 'House Help',
}

const SLOT_DAY_LABEL: Record<SlotDate, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This Weekend',
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

function bookingSummary(data: ConversationData): string {
  const service = data.service_type ? SERVICE_LABEL[data.service_type] : 'Service'
  const day = data.slot_date ? SLOT_DAY_LABEL[data.slot_date] : ''
  const time = data.slot_time ?? ''
  return `${service} · ${day} · ${time}\n📍 ${data.address ?? ''}`
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
  // Universal reset words always go back to WELCOME.
  if (isResetWord(message)) {
    await resetState(phone)
    return welcomeMessage()
  }

  const current = await loadState(phone)

  try {
    return await advance(phone, current, message)
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
  let { state, data } = current

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
          // Fast-forward to slot day select (skip area question).
          if (data.slot_date) {
            return await enterSlotTimeSelect(phone, data)
          }
          return await enterSlotDaySelect(phone, data)
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
      return await enterSlotDaySelect(phone, data)
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
  // 1. Insert the booking.
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
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
    .select('id')
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
    "Once payment is confirmed, you'll receive a booking ID."
  )
}

// ─── Razorpay confirmation message ───────────────────────────────────────────
/**
 * Build the post-payment confirmation message and reset the user's
 * conversation so the next message starts a fresh booking.
 */
export async function buildConfirmationMessage(bookingId: string): Promise<{
  phone: string
  message: string
} | null> {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, user_phone, service_type, slot_date, slot_time, address')
    .eq('id', bookingId)
    .maybeSingle()
  if (error || !booking) {
    console.error('[state] confirmation lookup failed', error)
    return null
  }

  const service =
    booking.service_type === 'home_chef'
      ? SERVICE_LABEL.home_chef
      : booking.service_type === 'house_help'
        ? SERVICE_LABEL.house_help
        : 'Service'
  const day =
    booking.slot_date === 'today' ||
    booking.slot_date === 'tomorrow' ||
    booking.slot_date === 'weekend'
      ? SLOT_DAY_LABEL[booking.slot_date as SlotDate]
      : (booking.slot_date ?? '')

  await saveState(booking.user_phone, 'CONFIRMED', {})

  const shortId = booking.id.slice(0, 8).toUpperCase()
  const message =
    '🎉 Booking Confirmed!\n\n' +
    `Booking ID: ${shortId}\n` +
    `Service: ${service}\n` +
    `Date & Time: ${day} ${booking.slot_time ?? ''}\n` +
    `📍 ${booking.address ?? ''}\n\n` +
    `Our professional will arrive on time. For support: ${SUPPORT_PHONE}\n\n` +
    'Thank you for choosing DoneDanaDone! 🙏'
  return { phone: booking.user_phone, message }
}
