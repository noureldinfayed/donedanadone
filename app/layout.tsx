import type { Metadata } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import { absoluteUrl, SERVICE_CITIES, SERVICE_TYPES, SITE_NAME, SITE_URL, WHATSAPP_NUMBER } from '@/lib/site'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'DoneDanaDone - WhatsApp Home Services Booking in India',
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Book home chefs, house help, electricians, plumbers, babysitters, and dog walkers on WhatsApp across Delhi, Gurugram, Noida, Mumbai, and Bangalore.',
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  keywords: [
    'home services India',
    'WhatsApp home services',
    'book home chef India',
    'house help booking India',
    'electrician booking Delhi',
    'plumber booking Gurugram',
    'home services Noida',
    'home services Mumbai',
    'home services Bangalore',
    ...SERVICE_CITIES.map((city) => `home services ${city}`),
    ...SERVICE_TYPES.map((service) => `${service.toLowerCase()} booking India`),
  ],
  alternates: {
    canonical: absoluteUrl('/'),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    title: 'DoneDanaDone - WhatsApp Home Services Booking in India',
    description:
      'Book Home Chef, House Help, Electrician, Plumber, Babysitter, and Dog Walker services on WhatsApp in major Indian cities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoneDanaDone - WhatsApp Home Services Booking in India',
    description: 'Book trusted home services on WhatsApp across Delhi NCR, Mumbai, and Bangalore.',
  },
  category: 'home services',
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'geo.position': '28.4595;77.0266',
    ICBM: '28.4595, 77.0266',
    'business:contact_data:country_name': 'India',
    'business:contact_data:phone_number': `+${WHATSAPP_NUMBER}`,
    'og:country-name': 'India',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-text font-body">
        {children}
      </body>
    </html>
  )
}
