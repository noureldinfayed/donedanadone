'use client'

import { useState } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Login failed')
        return
      }
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-md border border-[#dfe3e8] bg-white shadow-xl shadow-black/10"
    >
      <div className="flow-wash flex h-16 items-center justify-center rounded-t-md px-5 text-white">
        <span className="text-sm font-semibold">Admin</span>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Admin login</h1>
          <p className="text-sm text-muted">Enter the admin password to continue.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-[#d8dde4] bg-[#f8f9fb] px-3 py-2 text-ink outline-none focus:border-ink"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ink px-3 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}
