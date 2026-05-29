'use client'

import { motion } from 'framer-motion'
import CounterNumber from '@/components/ui/CounterNumber'

const STATS = [
  { value: 10000, suffix: '+', label: 'Happy customers' },
  { value: 500, suffix: '+', label: 'Verified professionals' },
  { value: 5, suffix: ' cities', label: 'And growing' },
]

export default function Stats() {
  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mx-auto grid max-w-5xl grid-cols-1 gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-ink-soft to-ink p-10 text-center sm:grid-cols-3 sm:p-14"
      >
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-4xl font-bold tracking-tight text-saffron sm:text-5xl">
              <CounterNumber target={s.value} />
              <span>{s.suffix}</span>
            </p>
            <p className="mt-2 text-sm uppercase tracking-widest text-muted">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
