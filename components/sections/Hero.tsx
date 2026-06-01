'use client'

import { motion } from 'framer-motion'

const CITIES = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bangalore']

// External QR generator — phone number placeholder until the WhatsApp number is live.
const QR_URL =
  'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://wa.me/+1234567890&bgcolor=ffffff&color=151515&margin=10'

const WHATSAPP_LINK = 'https://wa.me/+1234567890'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[82vh] items-center bg-background px-3 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto w-full max-w-[1900px]">
        <div className="relative min-h-[620px] rounded-md bg-ink text-white shadow-2xl shadow-black/15">
          <div className="absolute inset-x-0 bottom-0 h-24 flow-wash" />
          <div className="absolute inset-y-0 right-0 w-full flow-wash-soft opacity-50 sm:w-1/2" />

          <div className="relative grid min-h-[620px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1fr_360px] lg:px-14">
            <div className="max-w-3xl">
              <motion.span
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white"
              >
                <span className="size-1.5 rounded-full bg-whatsapp" />
                AI booking workflow live in India
              </motion.span>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-4xl font-bold leading-[1.06] sm:text-6xl md:text-7xl"
              >
                Book Home Services
                <br />
                in 30 Seconds.
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 max-w-xl text-base text-white/70 sm:text-lg"
              >
                A WhatsApp-first booking system for chefs, house help, provider confirmations, and payments.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-11 items-center justify-center gap-3 rounded-md bg-white px-5 text-sm font-semibold text-ink shadow-lg shadow-black/20 transition-colors hover:bg-saffron-soft"
                >
                  <WhatsAppIcon className="size-5 text-whatsapp" />
                  Scan to Book Now
                </a>

                <p className="text-xs text-white/58">
                  {CITIES.map((c, i) => (
                    <span key={c}>
                      <span>{c}</span>
                      {i < CITIES.length - 1 ? <span className="mx-1.5 text-white/25">/</span> : null}
                    </span>
                  ))}
                </p>
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex w-full flex-col items-center justify-self-center lg:w-auto lg:justify-self-end"
            >
              <div className="rounded-md border border-white/18 bg-white p-3 shadow-2xl shadow-black/25">
                {/* Plain <img> — no next/image per project rules */}
                <img
                  src={QR_URL}
                  alt="WhatsApp QR code - scan to book on DoneDanaDone"
                  className="block size-[220px] rounded"
                  width={220}
                  height={220}
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/70">WhatsApp booking entry</p>
            </motion.div>
          </div>
        </div>
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
