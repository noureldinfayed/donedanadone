import { normalizeWhatsAppAddress } from './phone'

const DEFAULT_GRAPH_VERSION = 'v24.0'

type MetaWebhookMessage = {
  id?: string
  from?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string; payload?: string }
  interactive?: {
    type?: string
    button_reply?: { id?: string; title?: string }
    list_reply?: { id?: string; title?: string }
  }
}

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: MetaWebhookMessage[]
      }
    }>
  }>
}

export type IncomingWhatsAppMessage = {
  id?: string
  from: string
  body: string
}

function metaConfig() {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const graphVersion = process.env.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_VERSION

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      'Meta WhatsApp Cloud API is not configured. Set META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID.'
    )
  }

  return { accessToken, phoneNumberId, graphVersion }
}

export function whatsappEngineConfigured(): boolean {
  return Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID)
}

function recipientId(phone: string): string {
  return phone.replace(/^whatsapp:/i, '').replace(/\D/g, '')
}

function messageBody(message: MetaWebhookMessage): string | null {
  if (message.type === 'text') return message.text?.body?.trim() || null
  if (message.type === 'button') {
    return message.button?.payload?.trim() || message.button?.text?.trim() || null
  }
  if (message.type === 'interactive') {
    return (
      message.interactive?.button_reply?.title?.trim() ||
      message.interactive?.button_reply?.id?.trim() ||
      message.interactive?.list_reply?.title?.trim() ||
      message.interactive?.list_reply?.id?.trim() ||
      null
    )
  }
  return null
}

export function extractIncomingWhatsAppMessages(payload: unknown): IncomingWhatsAppMessage[] {
  if (!payload || typeof payload !== 'object') return []

  const data = payload as MetaWebhookPayload
  const messages: IncomingWhatsAppMessage[] = []

  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const body = messageBody(message)
        if (!message.from || !body) continue
        messages.push({
          id: message.id,
          from: normalizeWhatsAppAddress(message.from),
          body,
        })
      }
    }
  }

  return messages
}

export async function sendWhatsApp(to: string, body: string) {
  const { accessToken, phoneNumberId, graphVersion } = metaConfig()
  const recipient = recipientId(to)
  if (!recipient) {
    throw new Error('Cannot send WhatsApp message without a recipient phone number.')
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Meta WhatsApp send failed (${response.status}): ${errorText.slice(0, 500)}`)
  }

  return response.json()
}
