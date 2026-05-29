import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DoneDanaDone — WhatsApp AI Booking',
  description:
    'Book Home Chef & House Help over WhatsApp. Twilio + Supabase + Gemini + Razorpay prototype.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  )
}
