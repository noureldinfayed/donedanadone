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
