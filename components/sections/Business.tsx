'use client'

import { motion } from 'framer-motion'

const PILLS = [
  { icon: '⚡', label: 'Live in 48 hours' },
  { icon: '🔄', label: 'Fully Automated' },
  { icon: '📊', label: 'Admin Dashboard' },
]

const BUSINESS_WHATSAPP = 'https://wa.me/+201234567890'

export default function Business() {
  return (
    <section
      id="business"
      className="relative grain-overlay border-y border-white/10 px-5 py-24 sm:px-8 sm:py-32"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,160,39,0.12), transparent 60%), linear-gradient(180deg, #0d2b1a, #06160e)',
      }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-xs font-medium uppercase tracking-widest text-saffron"
        >
          For business owners
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
        >
          Want this for your business?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg"
        >
          We build custom WhatsApp AI booking systems for service businesses across India.
          Plumbing companies, salons, clinics, delivery services — any business that takes
          bookings.
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          {PILLS.map((p) => (
            <motion.span
              key={p.label}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white"
            >
              <span>{p.icon}</span>
              {p.label}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10"
        >
          <a
            href={BUSINESS_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-saffron px-8 py-4 text-base font-semibold text-ink shadow-lg shadow-saffron/20 transition-transform hover:scale-[1.02]"
          >
            Talk to Us
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
