// ─── SHARED TYPESCRIPT INTERFACES ──────────────────────────────────────────
// Add client-specific types in this file or create separate
// domain files (e.g. lib/types/products.ts) as the project grows.

// ── Navigation ──────────────────────────────────────────────────────────────
export interface NavLink {
  label: string
  href: string
  external?: boolean
}

// ── Contact Form ─────────────────────────────────────────────────────────────
export interface ContactFormData {
  name: string
  email: string
  phone: string
  message: string
}

export interface ContactFormResponse {
  success?: boolean
  error?: string
}

// ── Section / Content ────────────────────────────────────────────────────────
export interface SectionProps {
  className?: string
}

export interface HeroContent {
  headline: string
  subheadline: string
  ctaLabel: string
  ctaHref: string
  imageUrl?: string
  imageAlt?: string
}

export interface ServiceItem {
  id: string
  title: string
  description: string
  icon?: string
}

export interface TestimonialItem {
  id: string
  author: string
  role?: string
  company?: string
  body: string
  rating?: number
  avatarUrl?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

// ── Social Media ─────────────────────────────────────────────────────────────
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'whatsapp'
  | 'telegram'

export interface SocialLink {
  platform: SocialPlatform
  href: string
  label: string
}

// ── i18n ─────────────────────────────────────────────────────────────────────
export type Locale = 'en' | 'ar' | 'de'
