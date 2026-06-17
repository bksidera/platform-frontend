import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LivingFrame } from './LivingFrame'
import { ContributionCardRail } from './ContributionCardRail'
import { OpenContributionCard, type CardDraft } from './OpenContributionCard'
import { CardStackViewer } from './CardStackViewer'
import { CREATOR, seedSupport } from './seeds'
import { submitSupport, submitNote, loadUserContributions, clearUserContributions } from './contributions'
import { useMatColor } from '../useMatColor'
import type { ViewerRole } from './viewer'
import type { Contribution } from './types'

/**
 * Creator Demo v0.1: one public object, the card. The work stays dominant
 * while cards gather at its lower edge. Some cards include an amount; some
 * simply omit it.
 */

const SEED_STATES = [0, 1, 4, 10, 20, 50, 100]

type Confirmation = { kind: 'paid' | 'note' } | null
type StackState = { isOpen: boolean; entryCardId: string | null }

export function FramePrototypePage() {
  const matColor = useMatColor(CREATOR.imageUrl)
  const [seedCount, setSeedCount] = useState(10)
  const [userContribs, setUserContribs] = useState<Contribution[]>(() => loadUserContributions())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null)
  const [cardKey, setCardKey] = useState(0) // remounts the open card blank after placing
  const [stackState, setStackState] = useState<StackState>({ isOpen: false, entryCardId: null })
  const [composerOpen, setComposerOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [viewerRole, setViewerRole] = useState<ViewerRole>('public')
  const composerRef = useRef<HTMLDivElement | null>(null)
  const stackReturnRef = useRef<HTMLElement | null>(null)
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setCompact(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCompact(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const cards = useMemo(
    () => [...seedSupport(seedCount), ...userContribs],
    [seedCount, userContribs],
  )

  // Cards the visitor placed this session are "their own" — the only cards a
  // giver-role viewer sees the actual amount on.
  const ownIds = useMemo(() => new Set(userContribs.map((c) => c.id)), [userContribs])
  const ownCardIds = useMemo(() => userContribs.map((c) => c.id), [userContribs])
  const isOwn = (c: Contribution) => ownIds.has(c.id)

  const tile = compact ? 76 : 92
  const openComposer = () => {
    setComposerOpen(true)
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const place = async (draft: CardDraft) => {
    setBusy(true)
    setError(null)
    try {
      const input = {
        creatorId: CREATOR.id,
        roomId: CREATOR.roomId,
        type: (draft.amountCents ? 'support' : 'note') as 'support' | 'note',
        displayName: draft.displayName,
        note: draft.note || undefined,
        imageUrl: draft.imageUrl ?? undefined,
        supportAmountCents: draft.amountCents ?? 0,
        currency: 'USD' as const,
      }
      const created = draft.amountCents ? await submitSupport(input) : await submitNote(input)
      setUserContribs((prev) => [...prev, created])
      setCardKey((k) => k + 1)
      setComposerOpen(false)
      if (draft.amountCents) setJustPlacedId(created.id)
      setTimeout(() => setConfirmation({ kind: draft.amountCents ? 'paid' : 'note' }), draft.amountCents ? 800 : 350)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const openStack = (card: Contribution, opener: HTMLElement) => {
    stackReturnRef.current = opener
    setStackState({ isOpen: true, entryCardId: card.id })
  }

  const closeStack = () => {
    setStackState({ isOpen: false, entryCardId: null })
    window.requestAnimationFrame(() => stackReturnRef.current?.focus())
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
        {/* The plaque: identity and evidence, no verbs. */}
        <header className="text-center pt-12 md:pt-7 pb-5">
          <h1 className="font-display text-2xl text-parchment/95 leading-none">{CREATOR.name}</h1>
          <p className="text-[11px] tracking-[0.14em] text-parchment/50 mt-1.5">
            {CREATOR.context}
          </p>
          <p className="mt-3 font-display text-base text-parchment/82">
            Cards left with {CREATOR.name.split(' ')[0]}
          </p>
        </header>

        <div className="relative inline-flex flex-col items-center">
          {/* The work. Completed cards gather at its foot. */}
          <LivingFrame imageUrl={CREATOR.imageUrl} />

          {/* Gathered paper presence, readable only when picked up. */}
          <div className={`relative z-10 ${cards.length > 0 ? '-mt-8 md:-mt-10' : 'mt-4'}`}>
            <ContributionCardRail
              cards={cards}
              tile={tile}
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
                  onPlace={(d) => void place(d)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Surfaces. */}
      <AnimatePresence>
        {stackState.isOpen && (
          <CardStackViewer
            cards={cards}
            entryCardId={stackState.entryCardId}
            ownCardIds={ownCardIds}
            creatorName={CREATOR.name}
            viewerRole={viewerRole}
            isOwn={isOwn}
            onClose={closeStack}
          />
        )}
      </AnimatePresence>

      {/* Confirmation: quiet, after the card has joined. */}
      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none"
          >
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="pointer-events-auto bg-ink/95 border border-line rounded-[8px] px-6 py-3.5 text-center"
            >
              <p className="font-display text-base text-parchment/95">
                You placed your card.
              </p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {debug && (
        <div className="fixed top-2 right-2 z-50 flex flex-wrap justify-end gap-1 font-mono text-[10px] text-white/40 max-w-[60vw]">
          {SEED_STATES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSeedCount(n)}
              className={`px-1.5 py-1 border ${seedCount === n ? 'border-white/40 text-white/70' : 'border-white/15'}`}
            >
              {n}
            </button>
          ))}
          {(['public', 'giver', 'creator'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setViewerRole(r)}
              className={`px-1.5 py-1 border ${viewerRole === r ? 'border-white/40 text-white/70' : 'border-white/15'}`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              clearUserContributions()
              setUserContribs([])
              setJustPlacedId(null)
              setConfirmation(null)
              setError(null)
              setComposerOpen(false)
              setCardKey((k) => k + 1)
            }}
            className="px-1.5 py-1 border border-white/15"
          >
            reset
          </button>
        </div>
      )}
    </div>
  )
}
