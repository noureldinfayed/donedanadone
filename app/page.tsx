import Link from 'next/link'

// ─── DoneDanaDone — Landing ─────────────────────────────────────────────────
// Prototype landing for the WhatsApp AI booking chatbot demo.
export default function Page() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted">
            Prototype · Client demo
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            DoneDanaDone — WhatsApp AI Booking
          </h1>
          <p className="text-lg text-muted">
            Book Home Chef & House Help over WhatsApp. Powered by Twilio,
            Supabase, Gemini 2.5 Flash, and Razorpay.
          </p>
        </header>

        <section className="rounded-2xl border border-black/10 p-6 space-y-3">
          <h2 className="font-semibold">How to demo</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              Join the Twilio WhatsApp sandbox from your phone (see Twilio
              Console → Messaging → Try it out → WhatsApp).
            </li>
            <li>
              Send <code className="rounded bg-black/5 px-1.5 py-0.5">hi</code>{' '}
              to the sandbox number.
            </li>
            <li>Pick a service, area, slot, and follow the prompts.</li>
            <li>Pay with the Razorpay test card or UPI on the link sent.</li>
            <li>
              Watch the booking turn green on{' '}
              <Link className="underline" href="/admin">
                /admin
              </Link>{' '}
              in real time.
            </li>
          </ol>
        </section>

        <section className="rounded-2xl border border-black/10 p-6 space-y-3 text-sm">
          <h2 className="font-semibold">Webhook endpoints</h2>
          <ul className="space-y-1 font-mono text-xs">
            <li>
              <span className="text-muted">POST</span> /api/whatsapp{' '}
              <span className="text-muted">— Twilio incoming message</span>
            </li>
            <li>
              <span className="text-muted">POST</span> /api/razorpay-webhook{' '}
              <span className="text-muted">— Razorpay payment_link.paid</span>
            </li>
          </ul>
        </section>

        <footer className="text-xs text-muted">
          Architected & Engineered by Fayed Intelligence
        </footer>
      </div>
    </main>
  )
}
