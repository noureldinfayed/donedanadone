export function normalizeWhatsAppAddress(phone: string): string {
  const raw = phone.replace(/^whatsapp:/i, '').trim()
  const compact = raw.replace(/[^\d+]/g, '')
  return compact ? `whatsapp:${compact}` : phone
}

export function phoneIdentity(phone: string): string {
  return normalizeWhatsAppAddress(phone).replace(/^whatsapp:/i, '').replace(/\D/g, '')
}

export function samePhone(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false
  return phoneIdentity(a) === phoneIdentity(b)
}
