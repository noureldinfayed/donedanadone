import type { Metadata } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
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
  title: 'DoneDanaDone — Book Home Services on WhatsApp in 30 Seconds',
  description:
    'Chat with our AI on WhatsApp to book Home Chefs, House Help, Electricians, and more across India. No app, no forms, no waiting.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://donedanadone.vercel.app'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'DoneDanaDone',
    title: 'Book Home Services on WhatsApp in 30 Seconds',
    description: 'Chef · House Help · Electrician · Plumber · Babysitter · Dog Walker',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  )
}
