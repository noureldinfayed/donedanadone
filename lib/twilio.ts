import twilio from 'twilio'

// ─── Twilio WhatsApp sender ──────────────────────────────────────────────────
// Lazy init so dev server can start without env vars set.
let cachedClient: ReturnType<typeof twilio> | null = null

function getClient() {
  if (cachedClient) return cachedClient
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) {
    throw new Error(
      'Twilio is not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
    )
  }
  cachedClient = twilio(sid, token)
  return cachedClient
}

/**
 * Send a WhatsApp message via Twilio. `to` may be a bare phone number or already
 * prefixed with `whatsapp:`. The configured sender comes from TWILIO_WHATSAPP_FROM.
 */
export async function sendWhatsApp(to: string, body: string) {
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!from) {
    throw new Error('TWILIO_WHATSAPP_FROM is not configured.')
  }
  const normalizedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  return getClient().messages.create({ from, to: normalizedTo, body })
}
