'use client'

import { motion } from 'framer-motion'

const CITIES = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bangalore']

// External QR generator — phone number placeholder until Twilio sandbox is live.
const QR_URL =
  'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://wa.me/+1234567890&bgcolor=0a0a0a&color=25D366&margin=10'

const WHATSAPP_LINK = 'https://wa.me/+1234567890'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function Hero() {
  return (
    <section
      id="top"
      className="relative grain-overlay saffron-glow flex min-h-[calc(100vh-4rem)] items-center px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-saffron"
        >
          <span className="size-1.5 rounded-full bg-saffron animate-pulse" />
          Now live in India
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Book Home Services
          <br />
          <span className="text-saffron">in 30 Seconds.</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-xl text-base text-muted sm:text-lg"
        >
          Chat with our AI on WhatsApp. No app, no forms, no waiting.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-saffron/30 via-transparent to-whatsapp/30 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-ink-soft p-4 shadow-2xl">
              {/* Plain <img> — no next/image per project rules */}
              <img
                src={QR_URL}
                alt="WhatsApp QR code — scan to book on DoneDanaDone"
                className="block size-[240px] rounded-2xl"
                width={240}
                height={240}
              />
            </div>
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-whatsapp px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-whatsapp/20 transition-transform hover:scale-[1.02]"
          >
            <WhatsAppIcon className="size-5" />
            Scan to Book Now
          </a>

          <p className="text-xs text-muted">
            Available in{' '}
            {CITIES.map((c, i) => (
              <span key={c}>
                <span className="text-white/80">{c}</span>
                {i < CITIES.length - 1 ? <span className="mx-1.5 text-white/30">·</span> : null}
              </span>
            ))}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
    </svg>
  )
}
