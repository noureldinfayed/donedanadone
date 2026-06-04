'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768 // px — matches Tailwind's `md` breakpoint

/**
 * Returns true when the viewport width is below the mobile breakpoint (768px).
 * Safe for SSR: returns false during server render, then hydrates on client.
 *
 * Usage:
 *   const isMobile = useIsMobile()
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToViewport, getMobileSnapshot, getServerSnapshot)
}

function mediaQuery() {
  return `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
}

function getMobileSnapshot() {
  return window.matchMedia(mediaQuery()).matches
}

function getServerSnapshot() {
  return false
}

function subscribeToViewport(callback: () => void) {
  const mql = window.matchMedia(mediaQuery())

  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}
