import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'

/**
 * The amount completing its card. This surface stays in the card's paper
 * world: the amount and its recipient are restated plainly, Stripe's handling
 * is named once, and the confirm is a standard button — familiarity is the
 * kindness at the money moment.
 */

function formatAmount(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

interface InnerProps {
  artistName: string
  amountCents: number
  onSucceeded: () => void
}

function DemoWalletPayment({ artistName, amountCents, onSucceeded }: InnerProps) {
  const [confirming, setConfirming] = useState(false)
  const amount = formatAmount(amountCents)

  const complete = () => {
    if (confirming) return
    setConfirming(true)
    window.setTimeout(onSucceeded, 640)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[9px] border border-[#211c16]/10 bg-[#fff8e8]/42 px-4 py-3">
        <p className="font-display text-[16px] leading-snug text-[#211c16]/88">
          {amount} goes with your card to {artistName}.
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[#211c16]/55">
          The card is ready. This sends the amount with it.
        </p>
      </div>

      <button
        type="button"
        disabled={confirming}
        onClick={complete}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[9px] border border-[#0f0f0f] bg-[#111] px-4 py-3 font-sans text-[15px] font-semibold text-white shadow-[0_10px_18px_rgba(0,0,0,0.22)] disabled:opacity-55"
        aria-label={`Let ${amount} go with your card`}
      >
        <span>{confirming ? 'Carrying it...' : 'Apple Pay'}</span>
      </button>

      <button
        type="button"
        disabled={confirming}
        onClick={complete}
        className="w-full rounded-[8px] border border-[#211c16]/16 bg-[#211c16]/[0.035] py-2.5 font-display text-[14px] text-[#211c16]/76 transition-colors hover:bg-[#211c16]/[0.06] disabled:opacity-50"
      >
        Use another card
      </button>

      <p className="text-center text-[11px] leading-snug text-[#211c16]/58">
        The amount is private in public. {artistName} sees it with your card.
      </p>
    </div>
  )
}

function PaymentForm({ artistName, amountCents, onSucceeded }: InnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amount = formatAmount(amountCents)

  const confirm = async () => {
    if (!stripe || !elements || confirming) return
    setConfirming(true)
    setError(null)
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (result.error) {
      setError(result.error.message ?? "The amount didn't go through. You can try again.")
      setConfirming(false)
      return
    }
    onSucceeded()
  }

  return (
    <div className="space-y-5">
      <p className="font-display text-[16px] leading-snug text-[#211c16]/85">
        {amount} goes with your card to {artistName}.
      </p>
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-[#7a2e22]">{error}</p>}
      <button
        type="button"
        disabled={!ready || !stripe || confirming}
        onClick={() => void confirm()}
        className={`w-full rounded-[9px] border py-3 font-display text-base transition-colors ${
          ready && stripe && !confirming
            ? 'border-[#211c16] bg-[#211c16] text-[#f2ebdd] shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
            : 'border-[#211c16]/10 bg-[#211c16]/5 text-[#211c16]/45'
        }`}
      >
        {confirming ? 'One moment' : 'Let it go with the card'}
      </button>
      <p className="text-center text-[11px] leading-snug text-[#211c16]/68">
        The amount is private in public. {artistName} sees it with your card.
      </p>
    </div>
  )
}

interface Props extends InnerProps {
  stripePromise?: Promise<Stripe | null>
  clientSecret?: string
  demo?: boolean
}

export function PaymentStep({
  stripePromise,
  clientSecret,
  artistName,
  amountCents,
  onSucceeded,
  demo = false,
}: Props) {
  if (demo || !stripePromise || !clientSecret) {
    return (
      <DemoWalletPayment
        artistName={artistName}
        amountCents={amountCents}
        onSucceeded={onSucceeded}
      />
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorBackground: '#faf5ea',
            colorText: '#211c16',
            colorTextSecondary: '#5d5343',
            colorTextPlaceholder: '#6b5f4d',
            colorPrimary: '#211c16',
            colorDanger: '#7a2e22',
            borderRadius: '6px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif',
          },
        },
      }}
    >
      <PaymentForm artistName={artistName} amountCents={amountCents} onSucceeded={onSucceeded} />
    </Elements>
  )
}
