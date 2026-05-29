'use client'

import { useRef, useEffect } from 'react'
import { useMotionValue, useSpring, useInView, motion } from 'framer-motion'

interface CounterNumberProps {
  target: number
  className?: string
}

export default function CounterNumber({ target, className }: CounterNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: 2000, bounce: 0 })

  useEffect(() => {
    if (isInView) {
      motionValue.set(target)
    }
  }, [isInView, motionValue, target])

  useEffect(() => {
    return springValue.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = Math.round(v).toLocaleString()
      }
    })
  }, [springValue])

  return (
    <span ref={ref} className={className}>
      0
    </span>
  )
}
