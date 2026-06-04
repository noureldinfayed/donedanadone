import Navbar from '@/components/sections/Navbar'
import Hero from '@/components/sections/Hero'
import Services from '@/components/sections/Services'
import HowItWorks from '@/components/sections/HowItWorks'
import Stats from '@/components/sections/Stats'
import Footer from '@/components/sections/Footer'
import { absoluteUrl, SERVICE_CITIES, SERVICE_TYPES, SITE_NAME, WHATSAPP_NUMBER } from '@/lib/site'

export default function Page() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    telephone: `+${WHATSAPP_NUMBER}`,
    areaServed: SERVICE_CITIES.map((city) => ({
      '@type': 'City',
      name: city,
      addressCountry: 'IN',
    })),
    serviceType: SERVICE_TYPES,
    description:
      'WhatsApp-first booking for home chefs, house help, electricians, plumbers, babysitters, and dog walkers in India.',
    potentialAction: {
      '@type': 'CommunicateAction',
      target: `https://wa.me/${WHATSAPP_NUMBER}`,
      name: 'Start WhatsApp booking',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Services />
        <HowItWorks />
        <Stats />
      </main>
      <Footer />
    </>
  )
}
