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
      className="relative bg-background px-3 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-[1900px] flow-panel rounded-md">
        <div className="flow-wash flex h-20 items-center justify-between rounded-t-md px-6 text-white sm:px-8">
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-black text-ink">
            D
          </span>
          <p className="text-sm font-semibold">Services</p>
          <p className="hidden text-[10px] font-medium text-white/75 sm:block">DoneDanaDone Style</p>
        </div>
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl px-6 pb-10 pt-12 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase text-muted">
            Service menu
          </p>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-5xl">
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
          className="grid grid-cols-1 gap-3 px-6 pb-8 sm:grid-cols-2 sm:px-8 md:grid-cols-3"
        >
          {SERVICES.map((s) => (
            <motion.a
              key={s.title}
              href="#top"
              variants={cardVariant}
              transition={{ duration: 0.5 }}
              className="group relative rounded-md border border-[#dfe3e8] bg-white p-5 text-ink transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg"
            >
              <span className="absolute inset-x-0 top-0 h-1 rounded-t-md bg-gradient-to-r from-saffron via-accent to-whatsapp opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-[#f2f4f7] text-2xl">{s.emoji}</div>
              <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              <p className="mt-5 text-sm font-medium text-ink">
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
