'use client'

import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: '📱',
    title: 'Scan the QR code',
    desc: 'Open WhatsApp instantly. No app download needed.',
  },
  {
    icon: '🤖',
    title: 'Chat with our AI',
    desc: 'Tell us what you need. Our AI books it in seconds.',
  },
  {
    icon: '✅',
    title: 'Professional arrives',
    desc: 'Sit back. A verified professional is on the way.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative bg-background px-3 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-7xl flow-panel rounded-md">
        <div className="flow-wash flex h-20 items-center justify-between rounded-t-md px-6 text-white sm:px-8">
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-black text-ink">
            D
          </span>
          <p className="text-sm font-semibold">Workflow</p>
          <p className="hidden text-[10px] font-medium text-white/75 sm:block">Automation Flow</p>
        </div>
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl px-6 pb-10 pt-12 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase text-muted">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-5xl">
            As easy as sending a message.
          </h2>
        </motion.header>

        <div className="relative grid gap-4 px-6 pb-8 sm:px-8 md:grid-cols-3">
          {/* Dashed connector — desktop only */}
          <div
            aria-hidden
            className="absolute left-[15%] right-[15%] top-10 hidden h-px md:block"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(21,21,21,0.24) 50%, transparent 0%)',
              backgroundSize: '12px 1px',
              backgroundRepeat: 'repeat-x',
            }}
          />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-md border border-[#dfe3e8] bg-white p-5 text-center"
            >
              <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-md bg-ink text-3xl text-white shadow-lg shadow-black/15">
                {s.icon}
                <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-md bg-saffron text-xs font-bold text-ink">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
