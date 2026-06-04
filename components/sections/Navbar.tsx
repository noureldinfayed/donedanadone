'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import DoneDanaDoneLogo from '@/components/brand/DoneDanaDoneLogo'

// Sticky top navbar — turns slightly opaque once the user scrolls.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
      <div className="mx-auto max-w-[1900px]">
        <div className="flow-wash flex h-14 items-center justify-between rounded-md px-5 shadow-xl shadow-black/10 sm:px-7">
          <a
            href="#top"
            className="inline-flex items-center gap-3 text-white"
            onClick={() => setMenuOpen(false)}
          >
            <DoneDanaDoneLogo
              markClassName="h-8 w-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              wordmarkClassName="font-display text-lg font-bold"
            />
          </a>

          <nav className="hidden items-center gap-5 text-xs font-medium text-white/80 sm:flex">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#how" className="hover:text-white">Workflow</a>
          </nav>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/15 sm:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>

        {menuOpen ? (
          <nav
            id="mobile-navigation"
            className="mt-2 rounded-md border border-white/12 bg-ink px-3 py-3 text-sm font-medium text-white shadow-xl shadow-black/15 sm:hidden"
          >
            <a
              href="#services"
              className="block rounded-md px-3 py-3 transition-colors hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#how"
              className="block rounded-md px-3 py-3 transition-colors hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Workflow
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
