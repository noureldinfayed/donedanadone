'use client'

import { useEffect, useRef, useState } from 'react'

type ScrollDirection = 'up' | 'down' | 'idle'

interface UseScrollDirectionOptions {
  /** Minimum scroll delta before direction changes (prevents jitter). Default: 10 */
  threshold?: number
}

/**
 * Returns the current scroll direction ('up' | 'down' | 'idle') and
 * the scroll Y position. Direction is 'idle' until the user first scrolls.
 *
 * Usage in Navbar: hide on 'down', show on 'up'.
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): { direction: ScrollDirection; scrollY: number } {
  const { threshold = 10 } = options

  const [direction, setDirection] = useState<ScrollDirection>('idle')
  const [scrollY, setScrollY] = useState(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current

      if (Math.abs(delta) < threshold) return

      setDirection(delta > 0 ? 'down' : 'up')
      setScrollY(currentScrollY)
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return { direction, scrollY }
}
