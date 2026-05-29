import { Resend } from 'resend'

// Lazy singleton — defers construction to first use so the module can be
// imported even when RESEND_API_KEY is not yet set (e.g. during build).
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Add it to .env.local before sending emails.'
      )
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

// Named export for convenience — resolves at call time, not module load time.
export const resend = {
  emails: {
    send: (...args: Parameters<Resend['emails']['send']>) =>
      getResend().emails.send(...args),
  },
}
