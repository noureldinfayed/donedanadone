import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

// ─── RATE LIMITER ──────────────────────────────────────────────────────────
// In-memory store — suitable for prototype/single-instance deployment.
// Replace with Redis (e.g. Upstash) before scaling to multi-instance production.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) return true

  entry.count += 1
  return false
}

// ─── CONTACT FORM HANDLER ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Get IP from header (set by Vercel / reverse proxy)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, phone, message } = body as {
    name?: string
    email?: string
    phone?: string
    message?: string
  }

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: 'All fields (name, email, phone, message) are required.' },
      { status: 400 }
    )
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400 }
    )
  }

  const toEmail = process.env.CONTACT_EMAIL_TO
  if (!toEmail) {
    console.error('CONTACT_EMAIL_TO is not configured.')
    return NextResponse.json(
      { error: 'Server configuration error.' },
      { status: 500 }
    )
  }

  try {
    await resend.emails.send({
      from: `Contact Form <onboarding@resend.dev>`,
      to: toEmail,
      replyTo: email,
      subject: `New Contact: ${name} — ${process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Website'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="8" style="border-collapse:collapse; font-family:sans-serif;">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
          <tr><td><strong>Message</strong></td><td style="white-space:pre-wrap;">${message}</td></tr>
        </table>
        <hr />
        <p style="color:#888;font-size:12px;">
          Sent from ${process.env.NEXT_PUBLIC_SITE_URL ?? 'website'} contact form
        </p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}
