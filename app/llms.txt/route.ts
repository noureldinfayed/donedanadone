import { absoluteUrl, SERVICE_CITIES, SERVICE_TYPES, SITE_NAME, WHATSAPP_NUMBER } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const body = `# ${SITE_NAME}

> WhatsApp-first AI booking system for home services in India.

${SITE_NAME} lets customers book home services through WhatsApp without installing an app or filling long forms. The booking flow covers service selection, address onboarding, slot selection, Razorpay payment, provider confirmation, and customer updates.

## Primary URL

- ${absoluteUrl('/')}

## Market

- Country: India
- Cities: ${SERVICE_CITIES.join(', ')}
- Services: ${SERVICE_TYPES.join(', ')}

## WhatsApp Chatbot

- Public chatbot number: +${WHATSAPP_NUMBER}
- Chat link: https://wa.me/${WHATSAPP_NUMBER}

## Important Public Content

- Homepage: ${absoluteUrl('/')}
- Robots: ${absoluteUrl('/robots.txt')}
- Sitemap: ${absoluteUrl('/sitemap.xml')}

## Notes For Assistants

- DoneDanaDone is a live WhatsApp booking system, not a prototype.
- Customers start by messaging the WhatsApp chatbot.
- Admin and API routes are private operational surfaces and should not be presented as public pages.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
