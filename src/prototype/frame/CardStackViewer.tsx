import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'framer-motion'
import type { Contribution } from './types'
import type { ViewerRole } from './viewer'
import { ReadableContributionCard } from './ReadableContributionCard'

interface Props {
  cards: Contribution[]
  entryCardId: string | null
  ownCardIds: string[]
  creatorName: string
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  onClose: () => void
}

// One lit material. The front card at full light; the stack beneath is this
// same paper, pushed into shadow by a brightness filter — never by alpha.
const PAPER =
  'linear-gradient(145deg, rgba(244,237,224,0.99), rgba(231,222,204,0.98) 58%, rgba(219,208,187,0.96))'

// Weighted, damped — cards have mass. No spring, no bounce.
const WEIGHTED = [0.32, 0, 0.18, 1] as const

// The opaque-paper cards sitting beneath the front card, receding into shadow.
// Dimmed enough to read as "deeper in the dark room," but still warm paper —
// never charcoal slabs.
const BACK_LAYERS = [
  { y: 13, scale: 0.965, rotate: -1.6, brightness: 0.9 },
  { y: 25, scale: 0.935, rotate: 2.1, brightness: 0.8 },
  { y: 37, scale: 0.905, rotate: -2.6, brightness: 0.7 },
]

export function buildStackOrder(
  cards: Contribution[],
  entryCardId: string | null,
  ownCardIds: string[] = [],
): Contribution[] {
  const entryCard = entryCardId ? cards.find((card) => card.id === entryCardId) : null
  const ownIdSet = new Set(ownCardIds)
  const excludedIds = new Set([entryCard?.id].filter((id): id is string => Boolean(id)))

  const ownCards = cards
    .filter((card) => ownIdSet.has(card.id) && !excludedIds.has(card.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  ownCards.forEach((card) => excludedIds.add(card.id))

  const otherCards = cards
    .filter((card) => !excludedIds.has(card.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return [
    entryCard,
    ...ownCards,
    ...otherCards,
  ].filter((card): card is Contribution => Boolean(card))
}

export function CardStackViewer({
  cards,
  entryCardId,
  ownCardIds,
  creatorName,
  viewerRole,
  isOwn,
  onClose,
}: Props) {
  const reducedMotion = useReducedMotion()
  const setDownRef = useRef<HTMLButtonElement | null>(null)
  const creatorFirst = creatorName.split(' ')[0] ?? creatorName
  const orderedCards = useMemo(
    () => buildStackOrder(cards, entryCardId, ownCardIds),
    [cards, entryCardId, ownCardIds],
  )
  const [index, setIndex] = useState(0)
  const current = orderedCards[index]
  const count = orderedCards.length

  // The stack is continuous — riffling cycles, with no first/last and no end.
  const riffle = (step: number) =>
    setIndex((value) => (count > 0 ? (value + step + count) % count : 0))

  useEffect(() => {
    setIndex(0)
  }, [entryCardId])

  useEffect(() => {
    setDownRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') riffle(-1)
      if (event.key === 'ArrowRight') riffle(1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, onClose])

  if (!current) return null

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Flick down: set the card back onto the stack.
    if (info.offset.y > 96 || info.velocity.y > 660) {
      onClose()
      return
    }
    // Thumb-riffle: a horizontal swipe sends the front card settling back and
    // draws the neighbor up into focus. Continuous in both directions.
    if (info.offset.x < -64 || info.velocity.x < -520) riffle(1)
    else if (info.offset.x > 64 || info.velocity.x > 520) riffle(-1)
  }

  const cardName = current.visibility === 'private' ? 'a private giver' : current.displayName
  const labelDate = new Date(current.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label={`Card from ${cardName}. Left with ${creatorFirst} on ${labelDate}.`}
      style={{ background: 'rgba(12, 10, 7, 0.46)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: WEIGHTED }}
      onMouseDown={(event) => {
        // Tap-away on the dark room sets the card down.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div style={{ width: 'min(82vw, 350px)' }}>
        {/* The held stack: front card + the opaque paper cards beneath it,
            scoped to one box so the beneath-cards match the card's footprint. */}
        <div className="relative">
        {/* The stack beneath: opaque warm paper, dimmed into shadow by light,
            never by alpha. Tapping the exposed paper sets the card down too. */}
        {BACK_LAYERS.map((layer, i) => (
          <motion.div
            key={`${current.id}-beneath-${i}`}
            aria-hidden
            onMouseDown={onClose}
            className="absolute inset-0 rounded-[12px] border border-[#cbbd9f]/45"
            style={{ background: PAPER, filter: `brightness(${layer.brightness}) saturate(1.12) sepia(0.08)` }}
            initial={
              reducedMotion
                ? false
                : { opacity: 1, y: layer.y + 8, scale: layer.scale, rotate: layer.rotate }
            }
            animate={{ opacity: 1, y: layer.y, scale: layer.scale, rotate: layer.rotate }}
            transition={{ duration: reducedMotion ? 0 : 0.34, ease: WEIGHTED }}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-[12px]"
              style={{ boxShadow: '0 18px 40px -22px rgba(0,0,0,0.8)' }}
            />
          </motion.div>
        ))}

        {/* The lifted, lit top card — raised slightly forward off the stack. */}
        <AnimatePresence initial={false} mode="wait">
          <motion.article
            key={current.id}
            drag
            dragSnapToOrigin
            dragElastic={0.08}
            onDragEnd={onDragEnd}
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: reducedMotion ? 0 : 0.34, ease: WEIGHTED }}
            className="relative z-10 max-h-[min(64vh,540px)] overflow-y-auto rounded-[12px] border border-[#d4c8b2]/65 px-6 py-6 text-[#2a251e] shadow-[0_1px_0_rgba(255,255,255,0.72)_inset,0_34px_84px_-20px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing"
            style={{ background: PAPER }}
          >
            <ReadableContributionCard
              contribution={current}
              creatorFirst={creatorFirst}
              viewerRole={viewerRole}
              isOwn={isOwn(current)}
              surface="paper"
            />
          </motion.article>
        </AnimatePresence>
        </div>

        {/* Whisper-quiet "set down" — usability insurance, never chrome. */}
        <div className="relative z-20 mt-12 flex justify-center">
          <button
            ref={setDownRef}
            type="button"
            onClick={onClose}
            aria-label="Set the card down"
            className="px-6 py-1 text-lg leading-none text-parchment/28 transition hover:text-parchment/55 focus:outline-none focus-visible:text-parchment/75"
          >
            ⌄
          </button>
        </div>
      </div>
    </motion.div>
  )
}
