import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { CardStackViewer } from '../prototype/frame/CardStackViewer'
import { ContributionCardRail } from '../prototype/frame/ContributionCardRail'
import { LivingFrame } from '../prototype/frame/LivingFrame'
import { OpenContributionCard, type CardDraft } from '../prototype/frame/OpenContributionCard'
import type { Contribution } from '../prototype/frame/types'
import type { ViewerRole } from '../prototype/frame/viewer'
import { useMatColor } from '../prototype/useMatColor'
import {
  createCard,
  createCardPaymentIntent,
  getCardPaymentStatus,
  getFrame,
  uploadImage,
} from '../services/api'
import type { PublicCard } from '../types/api.types'
import { PaymentStep } from '../components/payment/PaymentStep'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

type StackState = { isOpen: boolean; entryCardId: string | null }
type PendingPayment = { cardId: string; clientSecret: string; creatorName: string } | null

function asContribution(card: PublicCard, frameId: string, creatorId: string): Contribution {
  return {
    id: card.id,
    creatorId,
    roomId: frameId,
    type: card.hasAmount ? 'support' : 'note',
    displayName: card.displayName,
    note: card.note ?? undefined,
    imageUrl: card.photoUrl ?? undefined,
    supportAmountCents: card.amountCents ?? 0,
    currency: 'USD',
    hasSupport: card.hasAmount,
    createdAt: card.createdAt,
    visibility: card.visibility,
  }
}

export function FramePage() {
  const { slug = '' } = useParams()
  const queryClient = useQueryClient()
  const { data: frame, isLoading, isError } = useQuery({
    queryKey: ['frame', slug],
    queryFn: () => getFrame(slug),
    enabled: !!slug,
  })
  const matColor = useMatColor(frame?.imageUrl ?? '')
  const [ownCards, setOwnCards] = useState<Contribution[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [stackState, setStackState] = useState<StackState>({ isOpen: false, entryCardId: null })
  const [pendingPayment, setPendingPayment] = useState<PendingPayment>(null)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const stackReturnRef = useRef<HTMLElement | null>(null)
  const viewerRole: ViewerRole = 'public'

  useEffect(() => {
    if (!confirmation) return
    const timeout = window.setTimeout(() => setConfirmation(null), 4200)
    return () => window.clearTimeout(timeout)
  }, [confirmation])

  const cards = useMemo(() => {
    if (!frame) return ownCards
    const serverCards = frame.cards.map((card) => asContribution(card, frame.id, frame.creator.slug))
    const serverIds = new Set(serverCards.map((card) => card.id))
    return [...serverCards, ...ownCards.filter((card) => !serverIds.has(card.id))]
  }, [frame, ownCards])

  const ownIds = useMemo(() => new Set(ownCards.map((card) => card.id)), [ownCards])
  const ownCardIds = useMemo(() => ownCards.map((card) => card.id), [ownCards])
  const isOwn = (card: Contribution) => ownIds.has(card.id)

  const openComposer = () => {
    setComposerOpen(true)
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const pollPayment = async (cardId: string) => {
    for (let i = 0; i < 12; i++) {
      const status = await getCardPaymentStatus(cardId).catch(() => null)
      if (status?.status === 'succeeded') return true
      if (status?.status === 'failed') return false
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
    return false
  }

  const place = async (draft: CardDraft) => {
    if (!frame) return
    setBusy(true)
    setError(null)
    try {
      const photoUrl = draft.imageFile ? await uploadImage(draft.imageFile) : undefined
      const created = await createCard(frame.slug, {
        displayName: draft.displayName,
        email: draft.email,
        note: draft.note || undefined,
        photoUrl,
        amountCents: draft.amountCents ?? undefined,
      })
      const own = asContribution(
        {
          ...created,
          amountCents: draft.amountCents ?? null,
          hasAmount: Boolean(draft.amountCents),
          photoUrl: draft.imageUrl,
        },
        frame.id,
        frame.creator.slug,
      )
      setOwnCards((prev) => [...prev, own])
      setCardKey((key) => key + 1)
      setComposerOpen(false)
      setJustPlacedId(created.id)

      if (draft.amountCents) {
        const intent = await createCardPaymentIntent(created.id)
        if (intent.clientSecret.startsWith('sim_secret')) {
          const paid = await pollPayment(created.id)
          setConfirmation(paid ? 'You placed your card.' : 'Your card is here. The amount needs another try.')
        } else {
          setPendingPayment({
            cardId: created.id,
            clientSecret: intent.clientSecret,
            creatorName: frame.creator.name,
          })
        }
      } else {
        setConfirmation('You placed your card.')
      }

      await queryClient.invalidateQueries({ queryKey: ['frame', slug] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setComposerOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const closePayment = async () => {
    if (!pendingPayment) return
    const paid = await pollPayment(pendingPayment.cardId)
    setPendingPayment(null)
    setConfirmation(paid ? 'You placed your card.' : 'Your card is here. The amount needs another try.')
    await queryClient.invalidateQueries({ queryKey: ['frame', slug] })
  }

  const dismissPayment = () => {
    setPendingPayment(null)
    setConfirmation('Your card is here. The amount needs another try.')
  }

  const openStack = (card: Contribution, opener: HTMLElement) => {
    stackReturnRef.current = opener
    setStackState({ isOpen: true, entryCardId: card.id })
  }

  const closeStack = () => {
    setStackState({ isOpen: false, entryCardId: null })
    window.requestAnimationFrame(() => stackReturnRef.current?.focus())
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-ink px-6 text-center">
        <div className="border border-line bg-surface px-7 py-6">
          <p className="font-display text-xl text-parchment">Preparing frame</p>
          <p className="mt-2 text-sm text-muted">The image and cards are coming into view.</p>
        </div>
      </div>
    )
  }

  if (!frame || isError) {
    return (
      <div className="flex min-h-full items-center justify-center bg-ink px-6 text-center">
        <div className="max-w-sm border border-line bg-surface px-7 py-6">
          <p className="font-display text-xl text-parchment">Frame not found</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This frame may have moved, or the link may need another look.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex border border-line px-4 py-2 text-sm text-parchment hover:border-parchment/30"
          >
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full overflow-y-auto" style={{ background: matColor }}>
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 30%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-7 md:px-12 pb-12 flex flex-col items-center">
        <header className="text-center pt-12 md:pt-7 pb-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-parchment/45">
            {frame.creator.name}
          </p>
          <h1 className="mt-1 font-display text-2xl text-parchment/95 leading-none">{frame.title}</h1>
          {frame.context && (
            <p className="text-[11px] tracking-[0.14em] text-parchment/50 mt-2">
              {frame.context}
            </p>
          )}
        </header>

        <div className="relative inline-flex flex-col items-center">
          <LivingFrame imageUrl={frame.imageUrl} />
          <div className={`relative z-10 ${cards.length > 0 ? '-mt-7 md:-mt-8' : 'mt-4'}`}>
            <ContributionCardRail
              cards={cards}
              tile={92}
              viewerRole={viewerRole}
              isOwn={isOwn}
              justPlacedId={justPlacedId}
              isGathering={stackState.isOpen}
              hideLeaveYours={composerOpen}
              onLeaveYours={openComposer}
              onOpen={openStack}
            />
          </div>
        </div>

        <div className="w-full max-w-[21rem] mt-3 md:mt-2">
          <AnimatePresence initial={false} mode="wait">
            {composerOpen && (
              <motion.div
                ref={composerRef}
                key="composer"
                layoutId="waiting-card"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <OpenContributionCard
                  key={cardKey}
                  busy={busy}
                  error={error}
                  onPlace={(draft) => void place(draft)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {stackState.isOpen && (
          <CardStackViewer
            cards={cards}
            entryCardId={stackState.entryCardId}
            ownCardIds={ownCardIds}
            creatorName={frame.creator.name}
            viewerRole={viewerRole}
            isOwn={isOwn}
            onClose={closeStack}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <motion.button
            type="button"
            onClick={() => setConfirmation(null)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 bg-ink/95 border border-line rounded-[8px] px-6 py-3.5 text-center font-display text-base text-parchment/95"
          >
            {confirmation}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 px-5 py-10 overflow-y-auto"
          >
            <div className="mx-auto max-w-md border border-line bg-ink p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-parchment">Finish amount</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Your card has been placed. Finish the amount here when you are ready.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissPayment}
                  className="shrink-0 border border-line px-3 py-1.5 text-sm text-muted hover:text-parchment"
                >
                  Close
                </button>
              </div>
              <PaymentStep
                stripePromise={stripePromise}
                clientSecret={pendingPayment.clientSecret}
                artistName={pendingPayment.creatorName}
                onSucceeded={() => void closePayment()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
