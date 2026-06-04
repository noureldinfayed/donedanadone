import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/state-machine'
import { extractIncomingWhatsAppMessages, sendWhatsApp } from '@/lib/whatsapp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta verifies the webhook by sending hub.challenge to this URL.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    challenge &&
    token &&
    token === process.env.META_WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// Meta sends inbound WhatsApp message events as JSON. We parse supported user
// replies, drive the state machine, then send responses through Cloud API.
export async function POST(req: NextRequest) {
  let messages: ReturnType<typeof extractIncomingWhatsAppMessages> = []

  try {
    const payload = await req.json()
    messages = extractIncomingWhatsAppMessages(payload)
  } catch (err) {
    console.error('[whatsapp] webhook parse failed', err)
  }

  if (messages.length === 0) {
    return NextResponse.json({ received: true })
  }

  for (const message of messages) {
    let reply: string
    try {
      reply = await handleIncomingMessage(message.from, message.body)
    } catch (err) {
      console.error('[whatsapp] state machine failed', err)
      reply =
        "😕 Sorry, something went wrong. Type 'menu' to start over and we'll get you booked."
    }

    // Acknowledge Meta webhooks even if sending fails; retries would replay the
    // same inbound message through the state machine.
    try {
      await sendWhatsApp(message.from, reply)
    } catch (err) {
      console.error('[whatsapp] send failed', err)
    }
  }

  return NextResponse.json({ received: true })
}
