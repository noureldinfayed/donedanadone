import type { Booking, Provider } from './supabase'
import { sendWhatsApp } from './twilio'

// ─── Provider notification ────────────────────────────────────────────────────
// The "ping the assigned provider" step of the automated flow. It is fully
// built but GATED: until a verified WhatsApp Business number exists, sends are
// switched off and we only log. Flip PROVIDER_NOTIFY_ENABLED=true (with the
// Twilio creds set) to turn it on later — no code change needed.

const SERVICE_LABEL: Record<string, string> = {
  home_chef: 'Home Chef',
  house_help: 'House Help',
  dog_walker: 'Dog Walker',
  babysitter: 'Babysitter',
  electrician: 'Electrician',
  plumber: 'Plumber',
}

function buildJobMessage(provider: Provider, booking: Booking): string {
  const service = booking.service_type
    ? SERVICE_LABEL[booking.service_type] ?? booking.service_type
    : 'Service'
  const orderId = booking.booking_display_id ?? booking.id.slice(0, 8).toUpperCase()
  return (
    'New Booking! 🔔\n\n' +
    `Order #${orderId}\n` +
    `Service: ${service}\n` +
    `Date: ${booking.slot_date ?? ''} at ${booking.slot_time ?? ''}\n` +
    `Address: ${booking.address ?? ''}\n` +
    `Customer: ${booking.user_name ?? ''}\n\n` +
    'Reply:\n' +
    '1 - Confirm ✅\n' +
    '2 - Decline ❌'
  )
}

const notifyEnabled = () =>
  process.env.PROVIDER_NOTIFY_ENABLED === 'true' && !!process.env.TWILIO_WHATSAPP_FROM

/**
 * Notify a provider that they've been assigned a booking. Returns true if a
 * message was actually sent. When notifications are disabled (no WhatsApp number
 * yet) it logs the message it *would* send and returns false — the workflow is
 * complete; only the transport is switched off.
 */
export async function notifyProviderOfBooking(
  provider: Provider,
  booking: Booking
): Promise<boolean> {
  const message = buildJobMessage(provider, booking)

  if (!notifyEnabled() || !provider.phone) {
    console.info(
      `[notify] (disabled) would send to ${provider.name} <${provider.phone ?? 'no phone'}>:\n${message}`
    )
    return false
  }

  try {
    await sendWhatsApp(provider.phone, message)
    return true
  } catch (err) {
    console.error('[notify] provider WhatsApp send failed', err)
    return false
  }
}
