'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 60 // px before navbar becomes opaque

// ─── PLACEHOLDER DATA ─────────────────────────────────────────────────────
// Replace with real nav links and logo component per project.
const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

// ─── NAVBAR ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { direction, scrollY } = useScrollDirection({ threshold: 10 })
  const [menuOpen, setMenuOpen] = useState(false)
  const isScrolled = scrollY > SCROLL_THRESHOLD

  // Hide on scroll down (after threshold), show on scroll up
  const isHidden = direction === 'down' && scrollY > SCROLL_THRESHOLD + 80

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <motion.header
        animate={{ y: isHidden ? '-100%' : '0%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-background/95 backdrop-blur-sm shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── LOGO SLOT ─────────────────────────────────────────────── */}
            <a
              href="/"
              className="flex items-center gap-2 flex-shrink-0"
              aria-label="Go to homepage"
            >
              {/* Replace with <Image> logo or SVG component */}
              <span className="font-display font-bold text-xl text-primary tracking-tight">
                [LOGO]
              </span>
            </a>

            {/* ── DESKTOP NAV LINKS ─────────────────────────────────────── */}
            <nav
              className="hidden md:flex items-center gap-8"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}

              {/* ── CTA BUTTON SLOT ─────────────────────────────────────── */}
              <a
                href="#contact"
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-secondary text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
              >
                Get in Touch
              </a>
            </nav>

            {/* ── MOBILE HAMBURGER ──────────────────────────────────────── */}
            <button
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-md text-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── MOBILE FULL-SCREEN OVERLAY ────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center gap-8 md:hidden"
          >
            <nav
              className="flex flex-col items-center gap-6"
              aria-label="Mobile navigation"
            >
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="text-2xl font-display font-semibold text-foreground hover:text-primary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.a
                href="#contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.06, duration: 0.2 }}
                className="mt-4 inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-secondary text-base font-semibold hover:opacity-90 transition-opacity"
                onClick={() => setMenuOpen(false)}
              >
                Get in Touch
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
