import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ServiceType, SlotDate } from './supabase'

// ─── Gemini 2.5 Flash — intent normalization ─────────────────────────────────
type GenerativeModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>
let cachedModel: GenerativeModel | null = null

function getModel(): GenerativeModel {
  if (cachedModel) return cachedModel
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not configured.')
  const ai = new GoogleGenerativeAI(key)
  cachedModel = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
  return cachedModel
}

export interface ParsedIntent {
  service_type: ServiceType | null
  time_preference: SlotDate | null
  area: string | null
}

const SYSTEM_PROMPT = `You are a booking assistant parser. Given the user message, extract:
- service_type: "home_chef" or "house_help" or null
- time_preference: "today" or "tomorrow" or "weekend" or null
- area: string or null (only if the user clearly names a city/area)
Return JSON only, no markdown, no commentary.`

/**
 * Ask Gemini to parse a free-text WhatsApp message into a partial intent.
 * Returns nulls on parse failure — callers should treat every field as optional.
 */
export async function parseIntent(message: string): Promise<ParsedIntent> {
  const empty: ParsedIntent = {
    service_type: null,
    time_preference: null,
    area: null,
  }
  try {
    const model = getModel()
    const res = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser message: "${message}"` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    })
    const text = res.response.text().trim()
    const parsed = JSON.parse(text) as Partial<ParsedIntent>
    return {
      service_type:
        parsed.service_type === 'home_chef' || parsed.service_type === 'house_help'
          ? parsed.service_type
          : null,
      time_preference:
        parsed.time_preference === 'today' ||
        parsed.time_preference === 'tomorrow' ||
        parsed.time_preference === 'weekend'
          ? parsed.time_preference
          : null,
      area: typeof parsed.area === 'string' && parsed.area.trim() ? parsed.area.trim() : null,
    }
  } catch (err) {
    console.error('[gemini] parseIntent failed:', err)
    return empty
  }
}

function fallbackUnavailableUntil(message: string, now: Date): string | null {
  const m = message.match(/\b(?:after|from|until|post)?\s*(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?\b/i)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const minute = m[2] ? parseInt(m[2], 10) : 0
  const mer = m[3]?.toLowerCase()
  if (mer === 'pm' && hour < 12) hour += 12
  if (mer === 'am' && hour === 12) hour = 0
  if (!mer && hour >= 1 && hour <= 7) hour += 12
  if (hour > 23 || minute > 59) return null

  const until = new Date(now)
  until.setHours(hour, minute, 0, 0)
  if (until <= now) until.setDate(until.getDate() + 1)
  return until.toISOString()
}

export async function parseUnavailableUntil(
  message: string,
  now = new Date()
): Promise<string | null> {
  const fallback = fallbackUnavailableUntil(message, now)
  try {
    const model = getModel()
    const prompt =
      'Extract the time when a provider becomes available again. ' +
      'Return JSON only: {"unavailable_until":"ISO-8601 string or null"}. ' +
      'Interpret phrases like "after 13" or "from 14:00" as unavailable until that time today. ' +
      'If the time has already passed, use the next occurrence. ' +
      `Current time: ${now.toISOString()}\n\n` +
      `Provider message: "${message}"`
    const res = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    })
    const parsed = JSON.parse(res.response.text().trim()) as {
      unavailable_until?: unknown
    }
    if (typeof parsed.unavailable_until !== 'string') return fallback
    const date = new Date(parsed.unavailable_until)
    if (Number.isNaN(date.getTime())) return fallback
    if (date <= now) return fallback
    return date.toISOString()
  } catch (err) {
    console.error('[gemini] parseUnavailableUntil failed:', err)
    return fallback
  }
}
