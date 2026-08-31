import { useState } from 'react'
import { LogIn, Snowflake } from 'lucide-react'
import { useAuth } from '../stores/auth'

export default function Login() {
  const login = useAuth((s) => s.login)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || password === '') return
    setBusy(true)
    setError(null)
    const message = await login(password)
    setBusy(false)
    if (message) {
      setError(message)
      setPassword('')
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-ice-50 to-ice-100 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-ice-200 bg-white p-8 shadow-lg shadow-ice-200/60"
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
            <Snowflake className="size-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">eTemplator</h1>
          <p className="text-sm text-ink-600">Enter your password to access the builder.</p>
        </div>

        <label className="mb-1.5 block text-sm font-medium text-ink-600" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-ice-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy || password === ''}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
        >
          <LogIn className="size-4" />
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
