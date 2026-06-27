import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { HoldToConfirm } from './HoldToConfirm'

interface InnerProps {
  artistName: string
  onSucceeded: () => void
}

function PaymentForm({ artistName, onSucceeded }: InnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    if (!stripe || !elements || confirming) return
    setConfirming(true)
    setError(null)
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (result.error) {
      setError(result.error.message ?? 'The payment did not go through.')
      setConfirming(false)
      return
    }
    onSucceeded()
  }

  return (
    <div className="space-y-6">
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-300/90">{error}</p>}
      <HoldToConfirm
        label={confirming ? 'One moment' : `Hold for ${artistName}`}
        disabled={!ready || !stripe || confirming}
        onConfirm={confirm}
      />
    </div>
  )
}

interface Props extends InnerProps {
  stripePromise: Promise<Stripe | null>
  clientSecret: string
}

export function PaymentStep({ stripePromise, clientSecret, artistName, onSucceeded }: Props) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorBackground: '#1e1a15',
            colorText: '#ece6d9',
            colorPrimary: '#c2a36b',
            borderRadius: '2px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif',
          },
        },
      }}
    >
      <PaymentForm artistName={artistName} onSucceeded={onSucceeded} />
    </Elements>
  )
}
