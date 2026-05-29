'use client'

import { useRef } from 'react'
import { useInView as useFramerInView, UseInViewOptions } from 'framer-motion'

/**
 * Thin wrapper around Framer Motion's useInView.
 * Returns a ref to attach to the element and a boolean `inView`.
 *
 * Defaults: triggers once when 15% of the element is visible.
 *
 * Usage:
 *   const { ref, inView } = useInView()
 *   <motion.div ref={ref} animate={inView ? 'visible' : 'hidden'} />
 */
export function useInView(options: UseInViewOptions = {}) {
  const ref = useRef<HTMLElement>(null)

  const mergedOptions: UseInViewOptions = {
    once: true,
    amount: 0.15,
    ...options,
  }

  const inView = useFramerInView(ref, mergedOptions)

  return { ref, inView }
}
