import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authStore } from '../stores/authStore'
import { getOnboardingStatus, requestCreatorLink, startOnboarding } from '../services/api'
import { FramesPanel } from '../components/dashboard/FramesPanel'

function SignIn() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await requestCreatorLink(email.trim(), name.trim() || undefined)
      setSent(true)
    } catch (e) {
      if (e instanceof Error && e.message.includes('NAME_REQUIRED')) {
        setError('Add your name to create your creator account.')
      } else {
        setError(e instanceof Error ? e.message : 'The sign-in link could not be sent.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm rounded-[8px] border border-line bg-surface p-6 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]">
        <h1 className="font-display text-3xl">Check your email.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We sent a sign-in link. Open it in this browser to continue.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm space-y-5">
      <header>
        <h1 className="font-display text-4xl">For the moment the work moves someone.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sign in to create a frame and gather cards beneath your work.
        </p>
      </header>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-[7px] border border-line bg-surface px-4 py-3 placeholder:text-muted/60"
      />
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-[7px] border border-line bg-surface px-4 py-3 placeholder:text-muted/60"
      />
      {error && <p className="text-sm text-red-300/90">{error}</p>}
      <button
        type="button"
        disabled={busy || !email.includes('@') || !name.trim()}
        onClick={submit}
        className="w-full rounded-[7px] border border-line bg-surface py-3 font-display disabled:opacity-40"
      >
        {busy ? 'Sending...' : 'Send sign-in link'}
      </button>
    </div>
  )
}

function Onboarding() {
  const principal = authStore((s) => s.principal)
  const { data: status, isLoading } = useQuery({
    queryKey: ['onboardingStatus'],
    queryFn: getOnboardingStatus,
  })
  const [busy, setBusy] = useState(false)

  const begin = async () => {
    setBusy(true)
    try {
      const { url } = await startOnboarding()
      window.location.href = url
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-surface shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]">
      <header className="flex items-start justify-between gap-5 border-b border-line p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Creator</p>
          <h1 className="mt-1 font-display text-3xl">{principal?.name}</h1>
        </div>
        {principal?.slug && (
          <p className="text-right text-sm text-muted">/{principal.slug}</p>
        )}
      </header>

      {isLoading ? (
        <p className="p-5 text-sm text-muted">Checking amount setup...</p>
      ) : status?.simulated ? (
        <div className="m-5 rounded-[7px] border border-brass/30 bg-brass/10 p-4">
          <p className="font-display text-lg text-parchment">Pilot amount mode</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Amounts can be felt in the product now. Live payouts can be connected after creator feedback.
          </p>
        </div>
      ) : status?.onboarded ? (
        <div className="p-5">
          <p className="text-sm leading-relaxed text-parchment/90">
            You're set up to receive amounts inside cards.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <p className="text-muted text-sm leading-relaxed">
            Connect payouts when you are ready to move live amounts. Cards stay attached to your work either way.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={begin}
            className="w-full rounded-[7px] border border-line bg-ink py-3 font-display disabled:opacity-40"
          >
            {status?.hasAccount ? 'Continue setup' : 'Set up payments'}
          </button>
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const isAuthenticated = authStore((s) => s.isAuthenticated)
  const principal = authStore((s) => s.principal)
  const signedInCreator = isAuthenticated && principal?.kind === 'creator'

  return (
    <div className="min-h-full bg-ink">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 44% at 50% 0%, rgba(236,230,217,0.055) 0%, rgba(0,0,0,0) 58%)',
        }}
      />
      <main className="relative mx-auto min-h-full max-w-5xl px-6 py-10 md:py-14">
        {signedInCreator ? (
          <div className="space-y-9">
            <Onboarding />
            <FramesPanel />
          </div>
        ) : (
          <SignIn />
        )}
      </main>
    </div>
  )
}
