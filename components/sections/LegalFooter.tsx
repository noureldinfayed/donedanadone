'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type LegalDocId = 'privacy' | 'terms' | 'refunds' | 'delivery'

type LegalSection = {
  heading: string
  body: string
}

type LegalDoc = {
  id: LegalDocId
  title: string
  intro: string
  sections: LegalSection[]
}

const LAST_UPDATED = 'June 4, 2026'

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    intro:
      'This policy explains how DoneDanaDone handles customer and provider information for WhatsApp-based home service bookings.',
    sections: [
      {
        heading: 'Information We Collect',
        body:
          'We may collect your phone number, name, selected service, city, sector, apartment or address details, booking notes, slot preferences, WhatsApp conversation messages, provider assignment details, and payment metadata such as payment status, amount, method, transaction timestamp, and Razorpay payment ID.',
      },
      {
        heading: 'How We Use Information',
        body:
          'We use this information to run the chatbot flow, confirm service availability, create bookings, process payments, assign providers, send booking updates, support manual reassignment, improve operations, and maintain booking records.',
      },
      {
        heading: 'Payments',
        body:
          'Payments are processed by Razorpay. DoneDanaDone stores payment status and transaction reference information, but does not store card numbers, UPI credentials, or full payment instrument details.',
      },
      {
        heading: 'Sharing',
        body:
          'We share booking details with assigned providers only as needed to deliver the requested service. We may also share required data with Supabase, Meta WhatsApp Cloud API, Razorpay, hosting and email providers, or authorities where legally required.',
      },
      {
        heading: 'Retention And Requests',
        body:
          'Booking and customer records are retained as needed for operations, accounting, dispute handling, safety, and legal compliance. You can request correction or deletion of eligible personal data by contacting us through the DoneDanaDone WhatsApp chatbot.',
      },
    ],
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    intro:
      'These terms govern use of DoneDanaDone for booking home services through WhatsApp and related admin workflows.',
    sections: [
      {
        heading: 'Service Scope',
        body:
          'DoneDanaDone provides a WhatsApp-first booking system for supported home services in selected Indian cities and localities. Service availability depends on area coverage, slots, provider availability, and address eligibility.',
      },
      {
        heading: 'Customer Responsibilities',
        body:
          'Customers must provide accurate phone, name, address, service, timing, and access information. Customers are responsible for ensuring a safe work environment and being available at the selected time.',
      },
      {
        heading: 'Provider Assignment',
        body:
          'Provider assignment may be automated or manually adjusted by the admin team. A booking is fully confirmed only after payment is received and the provider confirmation flow is completed.',
      },
      {
        heading: 'Pricing And Payment',
        body:
          'Prices, booking fees, and payment links are shown during the booking flow. Payment completion is required before provider confirmation starts unless DoneDanaDone explicitly states otherwise.',
      },
      {
        heading: 'WhatsApp Consent',
        body:
          'By messaging DoneDanaDone on WhatsApp, you agree to receive booking, payment, provider, and operational messages related to your request on WhatsApp.',
      },
      {
        heading: 'Changes',
        body:
          'DoneDanaDone may update supported services, cities, pricing, operational rules, and these terms as the service evolves.',
      },
    ],
  },
  {
    id: 'refunds',
    title: 'Cancellation & Refund Policy',
    intro:
      'This policy explains how cancellations, failed payments, and refunds are handled for DoneDanaDone bookings.',
    sections: [
      {
        heading: 'Customer Cancellations',
        body:
          'Cancellation eligibility depends on booking status, provider assignment, and how close the request is to the scheduled slot. Requests should be made through the DoneDanaDone WhatsApp chatbot as early as possible.',
      },
      {
        heading: 'Provider Or Availability Issues',
        body:
          'If a provider declines or becomes unavailable, DoneDanaDone will try to reassign the booking. If no suitable provider can be assigned, the booking may be cancelled or manually reviewed.',
      },
      {
        heading: 'Refunds',
        body:
          'Eligible refunds are processed to the original payment method through Razorpay or the payment channel used. Bank, UPI, card, or payment provider timelines may apply after DoneDanaDone initiates the refund.',
      },
      {
        heading: 'Failed Or Duplicate Payments',
        body:
          'If a payment fails, the booking remains unpaid unless the payment provider later confirms success. Duplicate successful payments should be reported through WhatsApp with the order ID and payment reference.',
      },
      {
        heading: 'No-Show Or Incorrect Address',
        body:
          'Refunds may be denied or reduced if the customer is unavailable, the address is incorrect, access is not possible, or the booking cannot be completed due to customer-side information or access issues.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Service Delivery Policy',
    intro:
      'This policy describes how DoneDanaDone fulfils service bookings after a customer completes the WhatsApp booking and payment flow.',
    sections: [
      {
        heading: 'Booking Confirmation',
        body:
          'After payment, DoneDanaDone assigns an eligible provider based on service type, area, slot, and provider availability. The customer receives final confirmation after the provider accepts the booking.',
      },
      {
        heading: 'Service Timing',
        body:
          'Scheduled times are based on selected slots and operational availability. Arrival may be affected by traffic, access, weather, provider availability, or other local conditions.',
      },
      {
        heading: 'Address Coverage',
        body:
          'DoneDanaDone currently serves selected cities, sectors, and apartment or locality combinations. Some addresses may be unavailable or blacklisted for operational reasons.',
      },
      {
        heading: 'Manual Review',
        body:
          'If automated assignment cannot find a provider, the booking may be marked for manual assignment and the customer will be notified that provider confirmation is being handled shortly.',
      },
    ],
  },
]

export default function LegalFooter() {
  const [activeDocId, setActiveDocId] = useState<LegalDocId | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const activeDoc = LEGAL_DOCS.find((doc) => doc.id === activeDocId) ?? null

  useEffect(() => {
    if (!activeDoc) return

    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveDocId(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDoc])

  return (
    <>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/70 sm:justify-start">
        {LEGAL_DOCS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className="rounded-sm underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            onClick={() => setActiveDocId(doc.id)}
          >
            {doc.title}
          </button>
        ))}
      </nav>

      {activeDoc ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-3 sm:items-center sm:justify-center sm:p-6"
          onClick={() => setActiveDocId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-overlay-title"
            className="flex max-h-[88dvh] w-full max-w-3xl flex-col rounded-md border border-[#dfe3e8] bg-white text-ink shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#e4e7ec] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  DoneDanaDone Legal
                </p>
                <h2 id="legal-overlay-title" className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">
                  {activeDoc.title}
                </h2>
                <p className="mt-1 text-xs text-muted">Last updated: {LAST_UPDATED}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-[#dfe3e8] text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                aria-label="Close legal overlay"
                onClick={() => setActiveDocId(null)}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <p className="text-sm leading-6 text-muted sm:text-base">{activeDoc.intro}</p>

              <div className="mt-5 space-y-5">
                {activeDoc.sections.map((section) => (
                  <section key={section.heading} className="rounded-md border border-[#edf0f4] bg-[#f8f9fb] p-4">
                    <h3 className="font-display text-base font-semibold text-ink">{section.heading}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
                  </section>
                ))}
              </div>
            </div>

            <div className="border-t border-[#e4e7ec] bg-white px-4 py-3 sm:px-6">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-soft sm:w-auto"
                onClick={() => setActiveDocId(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
