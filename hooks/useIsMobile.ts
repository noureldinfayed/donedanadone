'use client'

import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768 // px — matches Tailwind's `md` breakpoint

/**
 * Returns true when the viewport width is below the mobile breakpoint (768px).
 * Safe for SSR: returns false during server render, then hydrates on client.
 *
 * Usage:
 *   const isMobile = useIsMobile()
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    // Set initial value
    setIsMobile(mql.matches)

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
