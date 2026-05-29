'use client'

import { motion } from 'framer-motion'

const SERVICES = [
  {
    emoji: '👨‍🍳',
    title: 'Home Chef',
    desc: 'Fresh, home-cooked meals — North Indian, South Indian, Continental.',
  },
  {
    emoji: '🏠',
    title: 'House Help',
    desc: 'Trusted, background-verified help for cleaning, dishes, and laundry.',
  },
  {
    emoji: '🐕',
    title: 'Dog Walker',
    desc: 'Daily walks and playtime with kind, vetted dog lovers.',
  },
  {
    emoji: '👶',
    title: 'Babysitter',
    desc: 'Caring, experienced sitters for date nights, errands, and weekends.',
  },
  {
    emoji: '⚡',
    title: 'Electrician',
    desc: 'Same-day fixes — fans, wiring, switchboards, geysers.',
  },
  {
    emoji: '🔧',
    title: 'Plumber',
    desc: 'Leaks, blockages, fittings — sorted before the day is out.',
  },
]

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function Services() {
  return (
    <section
      id="services"
      className="relative px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-saffron">
            Services
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            What can we do for you?
          </h2>
          <p className="mt-4 text-muted">
            Six everyday needs, one WhatsApp chat. Verified pros, transparent pricing.
          </p>
        </motion.header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6"
        >
          {SERVICES.map((s) => (
            <motion.a
              key={s.title}
              href="#top"
              variants={cardVariant}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-soft p-6 transition-all hover:-translate-y-1 hover:border-saffron/40 sm:p-7"
            >
              <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-saffron to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
              <div className="mb-5 text-4xl sm:text-5xl">{s.emoji}</div>
              <h3 className="font-display text-lg font-semibold text-white sm:text-xl">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              <p className="mt-5 text-sm font-medium text-saffron">
                Book Now{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </p>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
