import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/state-machine'
import { sendWhatsApp } from '@/lib/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Twilio WhatsApp webhook ────────────────────────────────────────────────
// Twilio sends incoming WhatsApp messages here as application/x-www-form-urlencoded.
// We parse `From` (sender) and `Body` (message text), drive the state machine,
// then push the reply out via the Twilio REST API (rather than using TwiML,
// so the same code path is reused by the Razorpay webhook).
export async function POST(req: NextRequest) {
  let from: string | null = null
  let body: string | null = null

  try {
    const form = await req.formData()
    from = (form.get('From') as string | null) ?? null
    body = (form.get('Body') as string | null) ?? null
  } catch (err) {
    console.error('[whatsapp] form parse failed', err)
  }

  if (!from || !body) {
    return new NextResponse('OK', { status: 200 })
  }

  let reply: string
  try {
    reply = await handleIncomingMessage(from, body)
  } catch (err) {
    console.error('[whatsapp] state machine failed', err)
    reply =
      "😕 Sorry, something went wrong. Type 'menu' to start over and we'll get you booked."
  }

  // Send reply via Twilio REST API. We swallow send errors so Twilio doesn't
  // retry (which would re-drive the state machine for the same message).
  try {
    await sendWhatsApp(from, reply)
  } catch (err) {
    console.error('[whatsapp] send failed', err)
  }

  return new NextResponse('OK', { status: 200 })
}
