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
    <section className="relative bg-background px-3 py-10 sm:px-6 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flow-wash mx-auto grid max-w-7xl grid-cols-1 gap-6 rounded-md p-8 text-center text-white shadow-xl shadow-black/10 sm:grid-cols-3 sm:p-12"
      >
        {STATS.map((s) => (
          <div key={s.label} className="rounded-md border border-white/10 bg-black/25 p-5">
            <p className="font-display text-4xl font-bold text-white sm:text-5xl">
              <CounterNumber target={s.value} />
              <span>{s.suffix}</span>
            </p>
            <p className="mt-2 text-sm uppercase text-white/70">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
