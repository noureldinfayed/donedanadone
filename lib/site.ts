export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://donedanadone.vercel.app').replace(
  /\/$/,
  ''
)

export const SITE_NAME = 'DoneDanaDone'
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919873510510').replace(
  /\D/g,
  ''
)

export const SERVICE_CITIES = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bangalore']

export const SERVICE_TYPES = [
  'Home Chef',
  'House Help',
  'Electrician',
  'Plumber',
  'Babysitter',
  'Dog Walker',
]

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
