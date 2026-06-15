import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import {
  createMomentIntent,
  getMonument,
  getPublicArchive,
  getStreamStatus,
  placeInscription,
  requestClaimLink,
  trackEvent,
} from '../services/api'
import { PaymentStep } from '../components/give/PaymentStep'
import { PlaceMarkStep } from '../components/give/PlaceMarkStep'
import { LandingView } from '../components/give/LandingView'
import { HoldToConfirm } from '../components/give/HoldToConfirm'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

// Three presets + custom (spec §12). Amounts matter-of-fact, never celebrated.
const PRESETS_CENTS = [500, 1000, 2500]

type Mark = { x: number; y: number; glyph: string }
type Step = 'amount' | 'identity' | 'place' | 'observe' | 'pay' | 'land'

// The Moment flow (spec §12): amount → name + email → place your mark →
// observation → payment → the Hold → watch the mark land. Under 60s end to end.
export function MomentFlowPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const monumentSlug = params.get('m') ?? undefined

  const { data: archive } = useQuery({
    queryKey: ['archive', slug],
    queryFn: () => getPublicArchive(slug),
  })
  const { data: monument } = useQuery({
    queryKey: ['monument', monumentSlug],
    queryFn: () => getMonument(monumentSlug as string),
    enabled: !!monumentSlug,
  })

  const [step, setStep] = useState<Step>('amount')
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [mark, setMark] = useState<Mark | null>(null)
  const [observation, setObservation] = useState('')
  const [signPublicly, setSignPublicly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!archive) return <div className="h-full" />
  const simulated = clientSecret?.startsWith('sim_secret') ?? false

  const submitIdentity = async () => {
    if (!name.trim() || !email.includes('@') || !amountCents) return
    setBusy(true)
    setError(null)
    try {
      const intent = await createMomentIntent({
        creatorSlug: slug,
        amountCents,
        name: name.trim(),
        email: email.trim(),
        monumentSlug,
      })
      setClientSecret(intent.clientSecret)
      setStreamId(intent.streamId)
      setStep(monument ? 'place' : 'pay')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  // After payment confirms: settle the Stream server-side, then set the mark.
  const onPaymentSucceeded = async () => {
    if (!streamId) return
    for (let i = 0; i < 12; i++) {
      const status = await getStreamStatus(streamId).catch(() => null)
      if (status?.status === 'succeeded') break
      await new Promise((r) => setTimeout(r, 800))
    }
    if (monument && mark) {
      await placeInscription({
        streamId,
        x: mark.x,
        y: mark.y,
        glyph: mark.glyph,
        observationText: observation.trim() || undefined,
        visibility: signPublicly ? 'public' : 'private',
      }).catch(() => undefined)
      if (observation.trim()) trackEvent({ type: 'observation_attached', monumentId: monument.id })
    }
    setStep('land')
  }

  if (step === 'place' && monument) {
    return (
      <PlaceMarkStep
        imageUrl={monument.imageUrl}
        existingPins={monument.inscriptions}
        onPlaced={(m) => {
          setMark(m)
          setStep('observe')
        }}
      />
    )
  }

  if (step === 'land' && monument && mark) {
    return (
      <LandingView
        monument={monument}
        ownMark={mark}
        giverEmail={email}
        onRequestClaim={() => requestClaimLink(email.trim()).catch(() => undefined)}
      />
    )
  }

  return (
    <div className="min-h-full max-w-md mx-auto px-6 py-12 flex flex-col gap-10">
      <header>
        <p className="text-muted text-sm tracking-wide">A gift for</p>
        <h1 className="font-display text-3xl">{archive.name}</h1>
        {monument && <p className="text-muted text-xs mt-1">{monument.venue}</p>}
      </header>

      {step === 'amount' && (
        <div className="space-y-3">
          {PRESETS_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setAmountCents(cents)
                setStep('identity')
              }}
              className="w-full py-4 border border-line bg-surface font-display text-xl hover:border-parchment/30"
            >
              ${cents / 100}
            </button>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              inputMode="decimal"
              placeholder="Another amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
            />
            <button
              type="button"
              onClick={() => {
                const dollars = parseFloat(customAmount)
                if (dollars >= 1) {
                  setAmountCents(Math.round(dollars * 100))
                  setStep('identity')
                }
              }}
              className="px-5 border border-line text-muted hover:text-parchment"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 'identity' && (
        <div className="space-y-4">
          <p className="text-muted text-sm leading-relaxed">
            Your name travels with your gift. {archive.name} will know who held the line.
          </p>
          <input
            autoFocus
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60"
          />
          {error && <p className="text-sm text-red-300/90">{error}</p>}
          <button
            type="button"
            disabled={busy || !name.trim() || !email.includes('@')}
            onClick={submitIdentity}
            className="w-full py-4 border border-line bg-surface font-display text-lg disabled:opacity-40"
          >
            {busy ? 'One moment' : 'Continue'}
          </button>
        </div>
      )}

      {step === 'observe' && (
        <div className="space-y-4">
          <p className="text-muted text-sm leading-relaxed">
            A few words, if you have them. They stay with your mark.
          </p>
          <textarea
            maxLength={240}
            rows={3}
            placeholder="Optional"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full bg-surface border border-line px-4 py-3 placeholder:text-muted/60 resize-none"
          />
          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={signPublicly}
              onChange={(e) => setSignPublicly(e.target.checked)}
              className="accent-[#c2a36b] w-4 h-4"
            />
            Sign my name publicly. Otherwise only {archive.name} sees it.
          </label>
          <button
            type="button"
            onClick={() => setStep('pay')}
            className="w-full py-4 border border-line bg-surface font-display text-lg"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'pay' && clientSecret && (
        simulated ? (
          <div className="space-y-6">
            <p className="text-muted text-sm">
              ${(amountCents ?? 0) / 100} · test mode, no charge
            </p>
            <HoldToConfirm
              label={busy ? 'One moment' : `Hold for ${archive.name}`}
              disabled={busy}
              onConfirm={() => {
                setBusy(true)
                void onPaymentSucceeded().finally(() => setBusy(false))
              }}
            />
          </div>
        ) : (
          <PaymentStep
            stripePromise={stripePromise}
            clientSecret={clientSecret}
            artistName={archive.name}
            onSucceeded={() => void onPaymentSucceeded()}
          />
        )
      )}

      {step === 'land' && !monument && (
        <p className="font-display text-2xl leading-snug">
          You held the line for {archive.name} tonight.
        </p>
      )}
    </div>
  )
}
