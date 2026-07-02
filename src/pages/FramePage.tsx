import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { CardStackViewer } from '../components/frame/CardStackViewer'
import { ContributionCardRail } from '../components/frame/ContributionCardRail'
import { LivingFrame } from '../components/frame/LivingFrame'
import { OpenContributionCard, type CardDraft } from '../components/frame/OpenContributionCard'
import type { Contribution } from '../components/frame/types'
import type { ViewerRole } from '../components/frame/viewer'
import { Footer } from '../components/Footer'
import { useMatColor } from '../hooks/useMatColor'
import {
  createCard,
  createCardPaymentIntent,
  getCardPaymentStatus,
  getFrame,
  trackEvent,
  uploadImage,
} from '../services/api'
import type { PublicCard } from '../types/api.types'
import { PaymentStep } from '../components/payment/PaymentStep'

let stripePromise: Promise<Stripe | null> | null = null

function getStripePromise() {
  stripePromise ??= loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
  return stripePromise
}

type StackState = { isOpen: boolean; entryCardId: string | null }
type PendingPayment = {
  cardId: string
  clientSecret?: string
  creatorName: string
  amountCents: number
  demo: boolean
  demoOnly?: boolean
} | null

// The confirmation is a moment, not a toast: one or two quiet lines, and —
// when an amount still waits — the way to complete it. Actionable moments
// stay until dismissed; plain ones fade on their own.
type Confirmation = {
  primary: string
  secondary?: string
  action?: { label: string; cardId: string }
} | null

// The visitor's own cards, remembered across reloads so an amount that didn't
// go through can always be completed. Stored per frame; ids plus the intended
// amount are all that's needed — the cards themselves live on the server.
type OwnCardMeta = { id: string; amountCents: number | null }

const ownStorageKey = (slug: string) => `platform:own-cards:${slug}`

function loadOwnMeta(slug: string): OwnCardMeta[] {
  try {
    const raw = window.localStorage.getItem(ownStorageKey(slug))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is OwnCardMeta =>
        typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'string',
    )
  } catch {
    return []
  }
}

function saveOwnMeta(slug: string, metas: OwnCardMeta[]) {
  try {
    window.localStorage.setItem(ownStorageKey(slug), JSON.stringify(metas.slice(-40)))
  } catch {
    // Storage can be unavailable (private mode); the session state still covers this visit.
  }
}

function formatAmount(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

function demoPaymentEnabled() {
  return import.meta.env.VITE_PAYMENT_DEMO_MODE !== 'false'
}

function useResponsiveRailTile() {
  const [tile, setTile] = useState(() => (window.matchMedia('(max-width: 767px)').matches ? 82 : 92))

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setTile(media.matches ? 82 : 92)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return tile
}

function asContribution(card: PublicCard, frameId: string, creatorId: string): Contribution {
  return {
    id: card.id,
    creatorId,
    roomId: frameId,
    type: card.hasAmount ? 'amount' : 'note',
    displayName: card.displayName,
    note: card.note ?? undefined,
    imageUrl: card.photoUrl ?? undefined,
    amountCents: card.amountCents ?? 0,
    currency: 'USD',
    hasAmount: card.hasAmount,
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
    staleTime: 60_000,
  })
  const matColor = useMatColor(frame?.imageUrl ?? '')
  const [sessionCards, setSessionCards] = useState<Contribution[]>([])
  const [ownMeta, setOwnMeta] = useState<OwnCardMeta[]>(() => loadOwnMeta(slug))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [stackState, setStackState] = useState<StackState>({ isOpen: false, entryCardId: null })
  const [pendingPayment, setPendingPayment] = useState<PendingPayment>(null)
  const railTile = useResponsiveRailTile()
  const composerRef = useRef<HTMLDivElement | null>(null)
  const stackReturnRef = useRef<HTMLElement | null>(null)
  const greetedPendingRef = useRef(false)
  const viewedRef = useRef<string | null>(null)

  const creatorFirst = frame?.creator.name.split(' ')[0] ?? 'the creator'

  useEffect(() => {
    setOwnMeta(loadOwnMeta(slug))
    greetedPendingRef.current = false
  }, [slug])

  useEffect(() => {
    if (!frame) return
    document.title = `${frame.creator.name} — ${frame.title}`
    return () => {
      document.title = 'PLATFORM'
    }
  }, [frame])

  useEffect(() => {
    if (!frame || viewedRef.current === frame.id) return
    viewedRef.current = frame.id
    trackEvent({ type: 'frame_view', sourceSlug: slug, frameId: frame.id })
  }, [frame, slug])

  useEffect(() => {
    if (!confirmation || confirmation.action) return
    const timeout = window.setTimeout(() => setConfirmation(null), 4200)
    return () => window.clearTimeout(timeout)
  }, [confirmation])

  const metaById = useMemo(() => new Map(ownMeta.map((meta) => [meta.id, meta])), [ownMeta])

  const cards = useMemo(() => {
    if (!frame) return sessionCards
    const sessionById = new Map(sessionCards.map((card) => [card.id, card]))
    const serverCards = frame.cards.map((card) => {
      const contribution = asContribution(card, frame.id, frame.creator.slug)
      const sessionCard = sessionById.get(card.id)
      const meta = metaById.get(card.id)
      return {
        ...contribution,
        // A just-uploaded photo previews from the local blob until the server copy lands.
        imageUrl: contribution.imageUrl ?? sessionCard?.imageUrl,
        // The server never exposes amounts publicly; the author's own card
        // remembers what they attached.
        amountCents: meta?.amountCents ?? sessionCard?.amountCents ?? contribution.amountCents,
        hasAmount:
          card.paymentStatus === 'succeeded'
            ? true
            : Boolean(meta?.amountCents ?? sessionCard?.amountCents) || contribution.hasAmount,
      }
    })
    const serverIds = new Set(serverCards.map((card) => card.id))
    return [...serverCards, ...sessionCards.filter((card) => !serverIds.has(card.id))]
  }, [frame, sessionCards, metaById])

  const ownIds = useMemo(() => {
    const ids = new Set(sessionCards.map((card) => card.id))
    ownMeta.forEach((meta) => ids.add(meta.id))
    return ids
  }, [sessionCards, ownMeta])
  const ownCardIds = useMemo(() => [...ownIds], [ownIds])
  const isOwn = (card: Contribution) => ownIds.has(card.id)
  const viewerRole: ViewerRole = ownIds.size > 0 ? 'giver' : 'public'

  // Own cards whose intended amount has not succeeded yet — the no-dead-ends set.
  const pendingAmountIds = useMemo(() => {
    if (!frame) return []
    const statusById = new Map(frame.cards.map((card) => [card.id, card.paymentStatus]))
    return ownMeta
      .filter((meta) => {
        if (!meta.amountCents) return false
        const status = statusById.get(meta.id)
        return status !== 'succeeded'
      })
      .map((meta) => meta.id)
  }, [frame, ownMeta])

  // After a reload with an amount still waiting, greet the visitor with the
  // way to complete it — once, quietly.
  useEffect(() => {
    if (!frame || greetedPendingRef.current || pendingAmountIds.length === 0) return
    if (justPlacedId || pendingPayment || confirmation) return
    greetedPendingRef.current = true
    const meta = ownMeta.find((m) => m.id === pendingAmountIds[0])
    if (!meta?.amountCents) return
    setConfirmation({
      primary: `Your ${formatAmount(meta.amountCents)} hasn't gone with your card yet.`,
      action: { label: 'Let it go', cardId: meta.id },
    })
  }, [frame, pendingAmountIds, ownMeta, justPlacedId, pendingPayment, confirmation])

  const rememberOwnCard = (id: string, amountCents: number | null) => {
    setOwnMeta((prev) => {
      const next = [...prev.filter((meta) => meta.id !== id), { id, amountCents }]
      saveOwnMeta(slug, next)
      return next
    })
  }

  const openComposer = () => {
    setComposerOpen(true)
    if (frame) trackEvent({ type: 'card_started', sourceSlug: slug, frameId: frame.id })
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const pollPayment = async (cardId: string) => {
    let delay = 800
    for (let i = 0; i < 18; i++) {
      const status = await getCardPaymentStatus(cardId).catch(() => null)
      if (status?.status === 'succeeded') return true
      if (status?.status === 'failed') return false
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(Math.round(delay * 1.25), 2200)
    }
    return false
  }

  const confirmPlaced = (amountCents: number | null, paid: boolean, cardId: string) => {
    if (!amountCents) {
      setConfirmation({
        primary: `Your card is with ${creatorFirst}.`,
        secondary: `${creatorFirst} will see your name.`,
      })
    } else if (paid) {
      setConfirmation({
        primary: `Your card is with ${creatorFirst}.`,
        secondary: `${formatAmount(amountCents)} went with it.`,
      })
    } else {
      setConfirmation({
        primary: `The ${formatAmount(amountCents)} is still waiting.`,
        secondary: `Your card is saved. You can let the amount go with it when ready.`,
        action: { label: 'Let it go', cardId },
      })
    }
  }

  const startPayment = async (cardId: string, amountCents: number) => {
    if (!frame) return
    try {
      const intent = await createCardPaymentIntent(cardId)
      const simulatedIntent = intent.clientSecret.startsWith('sim_secret')
      setPendingPayment({
        cardId,
        clientSecret: intent.clientSecret,
        creatorName: frame.creator.name,
        amountCents,
        demo: demoPaymentEnabled() || simulatedIntent,
      })
    } catch (e) {
      if (!demoPaymentEnabled()) throw e
      setPendingPayment({
        cardId,
        creatorName: frame.creator.name,
        amountCents,
        demo: true,
        demoOnly: true,
      })
    }
  }

  const completeAmount = async (cardId: string) => {
    const meta = metaById.get(cardId)
    if (!frame || !meta?.amountCents) return
    setConfirmation(null)
    try {
      await startPayment(cardId, meta.amountCents)
    } catch {
      setConfirmation({
        primary: `The ${formatAmount(meta.amountCents)} didn't go with your card yet.`,
        action: { label: 'Let it go', cardId },
      })
    }
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
        visibility: draft.visibility,
      })
      const own = asContribution(
        {
          ...created,
          amountCents: draft.amountCents ?? null,
          hasAmount: Boolean(draft.amountCents),
          photoUrl: photoUrl ?? draft.imageUrl,
        },
        frame.id,
        frame.creator.slug,
      )
      setSessionCards((prev) => [...prev, own])
      rememberOwnCard(created.id, draft.amountCents ?? null)
      setCardKey((key) => key + 1)
      setComposerOpen(false)
      setJustPlacedId(created.id)

      if (draft.amountCents) {
        try {
          await startPayment(created.id, draft.amountCents)
        } catch {
          confirmPlaced(draft.amountCents, false, created.id)
        }
      } else {
        confirmPlaced(null, false, created.id)
      }

      await queryClient.invalidateQueries({ queryKey: ['frame', slug] })
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Your card didn't place. Check your connection and try again.",
      )
      setComposerOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const closePayment = async () => {
    if (!pendingPayment) return
    const { cardId, amountCents, demoOnly } = pendingPayment
    const paid = demoOnly ? true : await pollPayment(cardId)
    setPendingPayment(null)
    confirmPlaced(amountCents, paid, cardId)
    await queryClient.invalidateQueries({ queryKey: ['frame', slug] })
  }

  const dismissPayment = () => {
    if (!pendingPayment) return
    const { cardId, amountCents } = pendingPayment
    setPendingPayment(null)
    confirmPlaced(amountCents, false, cardId)
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
      <div className="relative min-h-full overflow-hidden bg-ink" aria-busy="true">
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 75% 55% at 50% 30%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.42) 100%)',
          }}
        />
        <div className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center px-7 pb-12 pt-24 md:px-12 md:pt-20">
          <div className="h-[52vh] max-h-[34rem] w-[min(88vw,26rem)] animate-pulse rounded-[8px] border border-line bg-surface/35 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]" />
          <span className="sr-only">Loading frame</span>
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

  const cardCount = cards.filter((card) => card.visibility === 'public').length

  return (
    <div className="relative flex min-h-full flex-col overflow-y-auto" style={{ background: matColor }}>
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 30%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pb-4 md:px-12">
        <header className="text-center pt-6 pb-3 md:pt-6 md:pb-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-parchment/58">
            {frame.creator.name}
          </p>
          <h1 className="mt-1 font-display text-2xl text-parchment/95 leading-none">{frame.title}</h1>
          {frame.context && (
            <p className="text-[11px] tracking-[0.14em] text-parchment/58 mt-2">
              {frame.context}
            </p>
          )}
        </header>

        <div className="relative inline-flex flex-col items-center">
          <LivingFrame imageUrl={frame.imageUrl} />
          <div className={`relative z-10 ${cards.length > 0 ? '-mt-7 md:-mt-8' : 'mt-4'}`}>
            <ContributionCardRail
              cards={cards}
              tile={railTile}
              viewerRole={viewerRole}
              isOwn={isOwn}
              creatorFirst={creatorFirst}
              justPlacedId={justPlacedId}
              isGathering={stackState.isOpen}
              hideLeaveYours={composerOpen}
              onLeaveYours={openComposer}
              onOpen={openStack}
            />
          </div>
        </div>

        <div className="mt-3 text-center md:mt-2">
          <p className="text-[12px] tracking-[0.04em] text-parchment/72">
            {cardCount > 0
              ? `${cardCount} ${cardCount === 1 ? 'card is' : 'cards are'} with ${creatorFirst}.`
              : 'Be the first to leave a card.'}
          </p>
        </div>

        <div className="w-full max-w-[21rem] mt-3 md:mt-2">
          <AnimatePresence initial={false} mode="wait">
            {composerOpen && (
              <motion.div
                key="composer"
                layoutId="waiting-card"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {/* The ref lives on a plain child: a ref on the AnimatePresence
                    child itself breaks its exit removal (framer-motion PopChild). */}
                <div ref={composerRef}>
                  <OpenContributionCard
                    key={cardKey}
                    busy={busy}
                    error={error}
                    creatorFirst={creatorFirst}
                    onPlace={(draft) => void place(draft)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Footer />
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
            pendingAmountIds={pendingAmountIds}
            onCompleteAmount={(cardId) => void completeAmount(cardId)}
            onClose={closeStack}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <motion.div
            role="status"
            onClick={() => setConfirmation(null)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-8 left-1/2 z-30 w-[min(88vw,22rem)] -translate-x-1/2 cursor-pointer rounded-[8px] border border-line bg-ink/95 px-6 py-4 text-center"
          >
            <p className="font-display text-base leading-snug text-parchment/95">
              {confirmation.primary}
            </p>
            {confirmation.secondary && (
              <p className="mt-1 text-[12px] leading-snug text-parchment/68">
                {confirmation.secondary}
              </p>
            )}
            {confirmation.action && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  void completeAmount(confirmation.action!.cardId)
                }}
                className="mt-3 rounded-[6px] border border-parchment/35 px-4 py-1.5 font-display text-[13px] text-parchment transition-colors hover:border-parchment/70"
              >
                {confirmation.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-black/70 px-5 py-10 backdrop-blur-sm"
          >
            <div
              className="mx-auto max-w-md rounded-[11px] border border-[#d5c7ad]/78 p-6 text-[#211c16]"
              style={{
                background:
                  'linear-gradient(145deg, rgba(244,237,224,0.99), rgba(231,222,204,0.98) 58%, rgba(219,208,187,0.96))',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.65) inset, 0 34px 84px -20px rgba(0,0,0,0.9)',
              }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <p className="font-display text-xl text-[#211c16]/90">Send your card to {frame.creator.name}</p>
                <button
                  type="button"
                  onClick={dismissPayment}
                  className="shrink-0 rounded-[6px] border border-[#211c16]/15 px-3 py-1.5 text-xs text-[#211c16]/52 transition-colors hover:border-[#211c16]/32 hover:text-[#211c16]/72"
                >
                  Leave waiting
                </button>
              </div>
              <PaymentStep
                stripePromise={pendingPayment.demo ? undefined : getStripePromise()}
                clientSecret={pendingPayment.clientSecret}
                demo={pendingPayment.demo}
                artistName={pendingPayment.creatorName}
                amountCents={pendingPayment.amountCents}
                onSucceeded={() => void closePayment()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
