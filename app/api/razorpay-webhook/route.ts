import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { handlePaidBooking } from '@/lib/state-machine'
import { sendWhatsApp } from '@/lib/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Razorpay payment webhook ────────────────────────────────────────────────
// Configure this URL in Razorpay Dashboard → Webhooks with the events:
//   - payment_link.paid
// We verify the HMAC signature using RAZORPAY_WEBHOOK_SECRET, then mark the
// booking confirmed and send a WhatsApp confirmation to the user.
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!verifyWebhookSignature(raw, signature)) {
    console.warn('[razorpay] bad signature')
    return new NextResponse('bad signature', { status: 400 })
  }

  let payload: {
    event?: string
    payload?: {
      payment_link?: {
        entity?: {
          id?: string
          notes?: { booking_id?: string }
          status?: string
          amount?: number
          amount_paid?: number
        }
      }
      payment?: {
        entity?: {
          id?: string
          amount?: number
          method?: string
          created_at?: number
        }
      }
    }
  }
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('bad json', { status: 400 })
  }

  // Only act on payment_link.paid; other events are acknowledged silently.
  if (payload.event !== 'payment_link.paid') {
    return NextResponse.json({ received: true })
  }

  const bookingId = payload.payload?.payment_link?.entity?.notes?.booking_id
  if (!bookingId) {
    console.warn('[razorpay] missing booking_id in notes')
    return NextResponse.json({ received: true })
  }

  const payment = payload.payload?.payment?.entity
  const paymentLink = payload.payload?.payment_link?.entity
  const amountInPaise = payment?.amount ?? paymentLink?.amount_paid ?? paymentLink?.amount
  const transactionAt = payment?.created_at
    ? new Date(payment.created_at * 1000).toISOString()
    : new Date().toISOString()

  // Mark booking paid and ready for provider confirmation.
  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'success',
      status: 'confirmed',
      amount_paid:
        typeof amountInPaise === 'number' ? Math.round(amountInPaise) / 100 : null,
      payment_method: payment?.method ?? null,
      razorpay_payment_id: payment?.id ?? paymentLink?.id ?? null,
      transaction_timestamp: transactionAt,
    })
    .eq('id', bookingId)
  if (updateErr) {
    console.error('[razorpay] booking update failed', updateErr)
    return new NextResponse('db error', { status: 500 })
  }

  // Assign a provider and ask them to confirm. The final customer confirmation
  // goes out only after the provider replies "1" / "confirm".
  const confirmation = await handlePaidBooking(bookingId)
  if (confirmation) {
    try {
      await sendWhatsApp(confirmation.phone, confirmation.message)
    } catch (err) {
      console.error('[razorpay] whatsapp send failed', err)
    }
  }

  return NextResponse.json({ received: true })
}
