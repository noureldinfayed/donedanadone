import { Phone, Mail, ExternalLink } from 'lucide-react'
import type { SocialLink } from '@/lib/types'

// ─── PLACEHOLDER DATA ─────────────────────────────────────────────────────
// Replace with real data from environment variables or CMS per project.
const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? '[Business Name]'
const TAGLINE = '[Your professional tagline goes here]'
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? '[email@domain.com]'
const CONTACT_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? '[+XX XXX XXX XXXX]'

// Social links — add per project.
// Note: lucide-react v1+ removed brand icons. Use SVG icons from
// simple-icons or inline SVGs for brand-specific social icons.
const SOCIAL_LINKS: SocialLink[] = [
  // { platform: 'instagram', href: 'https://instagram.com/...', label: 'Instagram' },
  // { platform: 'facebook',  href: 'https://facebook.com/...',  label: 'Facebook'  },
  // { platform: 'linkedin',  href: 'https://linkedin.com/...',  label: 'LinkedIn'  },
]

// ─── FOOTER ──────────────────────────────────────────────────────────────
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-secondary">
      {/* ── MAIN FOOTER CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ── BRAND COLUMN ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* LOGO / BUSINESS NAME SLOT */}
            <span className="font-display font-bold text-2xl text-secondary">
              {BUSINESS_NAME}
            </span>

            {/* TAGLINE SLOT */}
            <p className="text-sm text-secondary/70 leading-relaxed max-w-xs">
              {TAGLINE}
            </p>

            {/* SOCIAL LINKS SLOT ──────────────────────────────────────────
              Replace ExternalLink with brand SVG icons per project.
              Example with simple-icons:
                import { siInstagram } from 'simple-icons'
                <svg ... dangerouslySetInnerHTML={{ __html: siInstagram.svg }} />
            ──────────────────────────────────────────────────────────── */}
            {SOCIAL_LINKS.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.platform}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex items-center justify-center w-9 h-9 rounded-full border border-secondary/30 text-secondary/70 hover:text-secondary hover:border-secondary transition-colors duration-200"
                  >
                    {/* Replace with brand SVG icon per project */}
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── NAV LINKS SLOT ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary/50 mb-1">
              Navigation
            </h3>
            {/* Replace with real links per project */}
            {['Home', 'Services', 'About', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-secondary/70 hover:text-secondary transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* ── CONTACT INFO SLOT ────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary/50 mb-1">
              Contact
            </h3>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 text-sm text-secondary/70 hover:text-secondary transition-colors duration-200"
            >
              <Mail size={14} className="flex-shrink-0" />
              {CONTACT_EMAIL}
            </a>

            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-2 text-sm text-secondary/70 hover:text-secondary transition-colors duration-200"
            >
              <Phone size={14} className="flex-shrink-0" />
              {CONTACT_PHONE}
            </a>

            {/* ADDRESS SLOT — uncomment and fill per project */}
            {/* <p className="flex items-start gap-2 text-sm text-secondary/70">
              <MapPin size={14} className="flex-shrink-0 mt-0.5" />
              [Street Address, City, Country]
            </p> */}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ───────────────────────────────────────────────────── */}
      <div className="border-t border-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary/40">
          <span>
            © {currentYear} {BUSINESS_NAME}. All rights reserved.
          </span>

          {/* ── FI STAMP — NON-NEGOTIABLE, DO NOT REMOVE ─────────────────── */}
          <span className="font-medium tracking-wide">
            Architected &amp; Engineered by Fayed Intelligence
          </span>
        </div>
      </div>
    </footer>
  )
}
