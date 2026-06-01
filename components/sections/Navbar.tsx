'use client'

import { useEffect, useState } from 'react'

// Sticky top navbar — turns slightly opaque once the user scrolls.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full px-3 pt-3 transition-all duration-300 ${
        scrolled
          ? 'pb-3'
          : 'pb-0'
      }`}
    >
      <div className="flow-wash mx-auto flex h-14 max-w-[1900px] items-center justify-between rounded-md px-5 shadow-xl shadow-black/10 sm:px-7">
        <a href="#top" className="inline-flex items-center gap-3 text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-lg font-black text-ink">
            D
          </span>
          <span className="font-display text-lg font-bold">DoneDanaDone</span>
        </a>
        <nav className="hidden items-center gap-5 text-xs font-medium text-white/80 sm:flex">
          <a href="#services" className="hover:text-white">Services</a>
          <a href="#how" className="hover:text-white">Workflow</a>
        </nav>
      </div>
    </header>
  )
}
