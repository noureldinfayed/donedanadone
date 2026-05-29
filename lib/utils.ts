import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── cn() ──────────────────────────────────────────────────────────────────
// Merges Tailwind classes safely, resolving conflicts.
// Usage: cn('px-4', condition && 'bg-primary', className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── formatPhone ───────────────────────────────────────────────────────────
// Formats an Egyptian (+20) or German (+49) phone number for display.
// Strips non-numeric characters then applies country-aware formatting.
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  // Egyptian mobile: 01x xxxx xxxx (11 digits starting with 01)
  if (digits.startsWith('20') && digits.length === 12) {
    const local = digits.slice(2) // strip country code
    return `+20 ${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+20 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }

  // German mobile: +49 1xx xxxxxxx (10–11 local digits)
  if (digits.startsWith('49') && digits.length >= 11) {
    const local = digits.slice(2)
    return `+49 ${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`
  }
  if (digits.startsWith('0') && digits.length === 11) {
    // German local format 0xxx xxxxxxx
    return `+49 ${digits.slice(1, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`
  }

  // Fallback — return as-is
  return raw
}

// ─── formatCurrency ────────────────────────────────────────────────────────
// Formats a number as EGP or EUR with locale-appropriate display.
// Usage: formatCurrency(1500, 'EGP') → 'EGP 1,500.00'
//        formatCurrency(1500, 'EUR') → '€1,500.00'
export function formatCurrency(
  amount: number,
  currency: 'EGP' | 'EUR' = 'EGP',
  locale?: string
): string {
  const resolvedLocale = locale ?? (currency === 'EUR' ? 'de-DE' : 'en-EG')

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
