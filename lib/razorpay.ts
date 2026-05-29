import crypto from 'node:crypto'
import Razorpay from 'razorpay'

// ─── Razorpay payment links ──────────────────────────────────────────────────
let cachedClient: Razorpay | null = null

function getClient(): Razorpay {
  if (cachedClient) return cachedClient
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  cachedClient = new Razorpay({ key_id, key_secret })
  return cachedClient
}

export interface CreatePaymentLinkArgs {
  bookingId: string
  amountInr: number          // rupees, will be converted to paise
  customerName?: string
  customerPhone: string
  description: string
}

/**
 * Create a Razorpay payment link. Returns the short_url to share with the user
 * and the link id (stored alongside the booking for reconciliation).
 */
export async function createPaymentLink(args: CreatePaymentLinkArgs) {
  const client = getClient()
  const link = await client.paymentLink.create({
    amount: Math.round(args.amountInr * 100),
    currency: 'INR',
    accept_partial: false,
    description: args.description,
    customer: {
      name: args.customerName || 'DoneDanaDone Customer',
      contact: args.customerPhone,
    },
    notify: { sms: false, email: false },
    reminder_enable: true,
    notes: { booking_id: args.bookingId },
    callback_url:
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/booking/thanks`,
    callback_method: 'get',
  })
  return { id: link.id as string, short_url: link.short_url as string }
}

/**
 * Verify the Razorpay webhook signature using HMAC-SHA256 of the raw body
 * with the webhook secret. Returns true if the signatures match.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
