import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'framer-motion'
import type { Contribution } from './types'
import type { ViewerRole } from './viewer'
import { ReadableContributionCard } from './ReadableContributionCard'

interface Props {
  cards: Contribution[]
  entryCardId: string | null
  ownCardId: string | null
  creatorName: string
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  onClose: () => void
}

export function buildStackOrder(
  cards: Contribution[],
  entryCardId: string | null,
  ownCardId: string | null,
): Contribution[] {
  const entryCard = entryCardId ? cards.find((card) => card.id === entryCardId) : null
  const ownCard = ownCardId ? cards.find((card) => card.id === ownCardId) : null
  const excludedIds = new Set([entryCard?.id, ownCard?.id].filter((id): id is string => Boolean(id)))

  const remainingCards = cards
    .filter((card) => !excludedIds.has(card.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return [
    entryCard,
    ownCard && ownCard.id !== entryCard?.id ? ownCard : null,
    ...remainingCards,
  ].filter((card): card is Contribution => Boolean(card))
}

export function CardStackViewer({
  cards,
  entryCardId,
  ownCardId,
  creatorName,
  viewerRole,
  isOwn,
  onClose,
}: Props) {
  const reducedMotion = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const creatorFirst = creatorName.split(' ')[0] ?? creatorName
  const orderedCards = useMemo(
    () => buildStackOrder(cards, entryCardId, ownCardId),
    [cards, entryCardId, ownCardId],
  )
  const [index, setIndex] = useState(0)
  const current = orderedCards[index]
  const count = orderedCards.length
  const canGoPrevious = index > 0
  const canGoNext = index < count - 1

  useEffect(() => {
    setIndex(0)
  }, [entryCardId])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(count - 1, value + 1))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [count, onClose])

  if (!current) return null

  const goPrevious = () => setIndex((value) => Math.max(0, value - 1))
  const goNext = () => setIndex((value) => Math.min(count - 1, value + 1))
  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 86 || info.velocity.y > 620) {
      onClose()
      return
    }

    if (info.offset.x < -68 || info.velocity.x < -520) goNext()
    if (info.offset.x > 68 || info.velocity.x > 520) goPrevious()
  }

  const labelDate = new Date(current.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/58 px-5 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={`Card ${index + 1} of ${count}. Left with ${creatorFirst} on ${labelDate}.`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative" style={{ width: 'min(88vw, 390px)' }}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close card stack"
          className="absolute -right-1 -top-12 z-20 h-9 w-9 rounded-full border border-white/15 bg-[#1a160f]/80 text-parchment/70 shadow-[0_12px_30px_rgba(0,0,0,0.32)] transition hover:text-parchment focus:outline-none focus:ring-2 focus:ring-parchment/70"
        >
          ×
        </button>

        <div aria-hidden className="absolute inset-0">
          {[0, 1, 2].map((layer) => (
            <motion.div
              key={`${current.id}-layer-${layer}`}
              className="absolute inset-0 rounded-[14px] border border-white/10 bg-[#201b14]"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 22 + layer * 7, x: layer % 2 === 0 ? -8 : 8, rotate: layer % 2 === 0 ? -2 : 2 }
              }
              animate={{
                opacity: 0.42 - layer * 0.1,
                y: 10 + layer * 9,
                x: layer % 2 === 0 ? -7 - layer * 2 : 7 + layer * 2,
                rotate: layer % 2 === 0 ? -1.8 - layer * 0.5 : 1.8 + layer * 0.5,
              }}
              transition={{ duration: reducedMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>

        <AnimatePresence initial={false} mode="wait">
          <motion.article
            key={current.id}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.06}
            onDragEnd={onDragEnd}
            initial={reducedMotion ? false : { opacity: 0, x: 26, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -22, scale: 0.985 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[min(72vh,620px)] overflow-y-auto rounded-[14px] border border-white/10 bg-[#1a160f] px-6 py-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing"
          >
            <ReadableContributionCard
              contribution={current}
              creatorFirst={creatorFirst}
              viewerRole={viewerRole}
              isOwn={isOwn(current)}
            />
          </motion.article>
        </AnimatePresence>

        {count > 1 && (
          <div className="relative z-20 mt-8 flex items-center justify-between gap-4 text-parchment/54">
            <button
              type="button"
              onClick={goPrevious}
              disabled={!canGoPrevious}
              aria-label="Previous card"
              className="h-9 w-9 rounded-full border border-white/12 bg-[#1a160f]/55 text-lg leading-none transition enabled:hover:text-parchment disabled:opacity-25"
            >
              ‹
            </button>
            <p className="text-xs" aria-live="polite">
              {index + 1} of {count}
            </p>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Next card"
              className="h-9 w-9 rounded-full border border-white/12 bg-[#1a160f]/55 text-lg leading-none transition enabled:hover:text-parchment disabled:opacity-25"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
