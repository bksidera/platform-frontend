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
      <div className="max-w-sm border border-line bg-surface p-6">
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
        <h1 className="font-display text-4xl">PLATFORM</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sign in to create a Living Frame and collect cards beneath your work.
        </p>
      </header>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
      />
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
      />
      {error && <p className="text-sm text-red-300/90">{error}</p>}
      <button
        type="button"
        disabled={busy || !email.includes('@') || !name.trim()}
        onClick={submit}
        className="w-full py-3 border border-line bg-surface font-display disabled:opacity-40"
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
    <div className="border border-line bg-surface p-5">
      <header className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Creator</p>
          <h1 className="mt-1 font-display text-3xl">{principal?.name}</h1>
        </div>
        {principal?.slug && (
          <p className="text-right text-sm text-muted">/{principal.slug}</p>
        )}
      </header>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Checking payment setup...</p>
      ) : status?.onboarded ? (
        <p className="mt-6 text-sm leading-relaxed text-parchment/90">
          You're set up to receive amounts inside cards. All you need to do is exist.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-muted text-sm leading-relaxed">
            Amounts arrive through Stripe. Set up your account once; cards stay attached to your work.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={begin}
            className="w-full py-3 border border-line bg-surface font-display disabled:opacity-40"
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
    <div className="min-h-full max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10">
      {signedInCreator ? (
        <>
          <Onboarding />
          <FramesPanel />
        </>
      ) : (
        <SignIn />
      )}
    </div>
  )
}
