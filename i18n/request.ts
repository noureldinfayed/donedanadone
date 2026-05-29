import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

// ─── SUPPORTED LOCALES ────────────────────────────────────────────────────
// Add or remove locales per project.
// Common combos: ['en', 'ar'] for EGY sites, ['en', 'de'] for EU sites.
export const locales = ['en', 'ar', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale)
}

// ─── LOCALE DETECTION ─────────────────────────────────────────────────────
// Detects locale from:
// 1. NEXT_LOCALE cookie (set by language switcher)
// 2. Accept-Language header (browser preference)
// 3. Falls back to defaultLocale
async function detectLocale(): Promise<Locale> {
  // Cookie takes priority (user-chosen language)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale

  // Then check Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ?? ''
  const browserLocale = acceptLanguage.split(',')[0]?.split('-')[0]?.trim()
  if (browserLocale && isValidLocale(browserLocale)) return browserLocale

  return defaultLocale
}

// ─── REQUEST CONFIG ───────────────────────────────────────────────────────
export default getRequestConfig(async () => {
  const locale = await detectLocale()

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
