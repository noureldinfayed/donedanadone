import type { Variants } from 'framer-motion'

export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
}

export const clipRevealVariant: Variants = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
  },
}

export const wordRevealVariant: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const wordVariant: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

export const counterVariant = (target: number) => ({
  from: 0,
  to: target,
  duration: 2,
  ease: 'easeOut',
})
