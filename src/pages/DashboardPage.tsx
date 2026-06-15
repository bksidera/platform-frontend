import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authStore } from '../stores/authStore'
import { getOnboardingStatus, requestCreatorLink, startOnboarding } from '../services/api'
import { MonumentsPanel } from '../components/dashboard/MonumentsPanel'

function SignIn() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await requestCreatorLink(email.trim(), name.trim() || undefined)
      setSent(true)
    } catch (e) {
      if (e instanceof Error && e.message.includes('NAME_REQUIRED')) {
        setNeedsName(true)
      }
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return <p className="text-muted">Check your email for a sign-in link.</p>
  }

  return (
    <div className="space-y-4 max-w-sm">
      <h1 className="font-display text-3xl">Sign in</h1>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
      />
      {needsName && (
        <input
          placeholder="Your name, as it should appear"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
        />
      )}
      <button
        type="button"
        disabled={busy || !email.includes('@')}
        onClick={submit}
        className="w-full py-3 border border-line bg-surface font-display disabled:opacity-40"
      >
        Send sign-in link
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
    <div className="space-y-8 max-w-sm">
      <header>
        <h1 className="font-display text-3xl">{principal?.name}</h1>
        {principal?.slug && (
          <p className="text-muted text-sm mt-1">Your archive: /{principal.slug}</p>
        )}
      </header>

      {isLoading ? (
        <p className="text-muted">…</p>
      ) : status?.onboarded ? (
        <p className="text-parchment/90">
          You're set up to receive gifts. All you need to do is exist.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-muted text-sm leading-relaxed">
            Payments arrive through Stripe. Set up your account once; gifts route to you directly.
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
    <div className="min-h-full max-w-xl mx-auto px-6 py-16 space-y-12">
      {signedInCreator ? (
        <>
          <Onboarding />
          <MonumentsPanel />
        </>
      ) : (
        <SignIn />
      )}
    </div>
  )
}
