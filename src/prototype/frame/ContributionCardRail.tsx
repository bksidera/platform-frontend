import { motion, useReducedMotion } from 'framer-motion'
import type { MouseEvent } from 'react'
import type { Contribution } from './types'
import { amountDisplay, type ViewerRole } from './viewer'
import { PaymentGlyph } from './PaymentGlyph'
import { SupportArtifact } from './SupportArtifact'

interface Props {
  cards: Contribution[]
  tile: number
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  justPlacedId?: string | null
  isGathering?: boolean
  hideLeaveYours?: boolean
  onLeaveYours: () => void
  onOpen: (c: Contribution, opener: HTMLElement) => void
}

type BasinItem = {
  card: Contribution
  kind: 'mini' | 'tile' | 'photo' | 'back' | 'sliver'
  size: number
  x: number
  y: number
  rotate: number
  opacity: number
  z: number
}

const BASE_LAYOUT_SEED = 'living-frame-foot-gather-v1'

type SlotKind = BasinItem['kind'] | 'auto'

type HeapSlot = {
  x: number
  y: number
  rotate: number
  scale: number
  z: number
  kind: SlotKind
  opacity?: number
}

const FALLBACK_SLOT: HeapSlot = { x: 0, y: 54, rotate: 0, scale: 0.7, z: 1, kind: 'auto' }

const INTIMATE_SLOTS: HeapSlot[] = [
  { x: 0, y: 44, rotate: -2.1, scale: 0.92, z: 40, kind: 'mini' },
  { x: -0.17, y: 50, rotate: 2.4, scale: 0.84, z: 35, kind: 'mini' },
  { x: 0.17, y: 50, rotate: -1.4, scale: 0.84, z: 34, kind: 'mini' },
  { x: -0.04, y: 63, rotate: 3.1, scale: 0.8, z: 38, kind: 'mini' },
  { x: 0.05, y: 34, rotate: -3.2, scale: 0.76, z: 26, kind: 'auto', opacity: 0.96 },
]

const SMALL_HEAP_SLOTS: HeapSlot[] = [
  { x: -0.34, y: 54, rotate: -4.2, scale: 0.5, z: 10, kind: 'back', opacity: 0.78 },
  { x: -0.19, y: 42, rotate: 3.3, scale: 0.58, z: 12, kind: 'auto', opacity: 0.86 },
  { x: 0.04, y: 36, rotate: -2.1, scale: 0.62, z: 14, kind: 'auto', opacity: 0.9 },
  { x: 0.26, y: 47, rotate: 3.8, scale: 0.52, z: 13, kind: 'back', opacity: 0.82 },
  { x: -0.28, y: 73, rotate: 2.5, scale: 0.68, z: 24, kind: 'auto' },
  { x: -0.08, y: 68, rotate: -2.8, scale: 0.8, z: 35, kind: 'mini' },
  { x: 0.15, y: 70, rotate: 2.1, scale: 0.78, z: 34, kind: 'mini' },
  { x: 0.34, y: 76, rotate: -3.5, scale: 0.62, z: 22, kind: 'auto' },
  { x: -0.19, y: 88, rotate: -1.3, scale: 0.55, z: 18, kind: 'sliver', opacity: 0.78 },
  { x: 0.02, y: 89, rotate: 3.6, scale: 0.88, z: 45, kind: 'mini' },
  { x: 0.22, y: 87, rotate: -2.3, scale: 0.54, z: 17, kind: 'sliver', opacity: 0.78 },
  { x: -0.01, y: 55, rotate: 1.2, scale: 0.5, z: 9, kind: 'back', opacity: 0.7 },
]

const MEDIUM_HEAP_SLOTS: HeapSlot[] = [
  { x: -0.4, y: 54, rotate: -4.8, scale: 0.44, z: 7, kind: 'back', opacity: 0.62 },
  { x: -0.26, y: 39, rotate: 4.4, scale: 0.5, z: 8, kind: 'sliver', opacity: 0.7 },
  { x: -0.12, y: 32, rotate: -2.8, scale: 0.5, z: 9, kind: 'auto', opacity: 0.76 },
  { x: 0.1, y: 34, rotate: 2.6, scale: 0.5, z: 10, kind: 'back', opacity: 0.68 },
  { x: 0.28, y: 44, rotate: -4.1, scale: 0.5, z: 11, kind: 'auto', opacity: 0.78 },
  { x: 0.42, y: 59, rotate: 3.6, scale: 0.43, z: 7, kind: 'sliver', opacity: 0.62 },
  { x: -0.34, y: 73, rotate: 2.5, scale: 0.56, z: 18, kind: 'auto' },
  { x: -0.18, y: 66, rotate: -3.4, scale: 0.66, z: 26, kind: 'auto' },
  { x: 0.02, y: 63, rotate: 1.8, scale: 0.78, z: 34, kind: 'mini' },
  { x: 0.22, y: 69, rotate: -2.6, scale: 0.62, z: 24, kind: 'auto' },
  { x: 0.37, y: 78, rotate: 4.2, scale: 0.52, z: 20, kind: 'sliver', opacity: 0.72 },
  { x: -0.29, y: 91, rotate: -2.2, scale: 0.5, z: 16, kind: 'sliver', opacity: 0.64 },
  { x: -0.11, y: 91, rotate: 2.4, scale: 0.78, z: 42, kind: 'mini' },
  { x: 0.1, y: 92, rotate: -1.7, scale: 0.76, z: 43, kind: 'mini' },
  { x: 0.28, y: 91, rotate: 3.1, scale: 0.48, z: 15, kind: 'back', opacity: 0.62 },
]

const DENSE_HEAP_SLOTS: HeapSlot[] = [
  { x: -0.46, y: 53, rotate: -5.4, scale: 0.36, z: 2, kind: 'sliver', opacity: 0.55 },
  { x: -0.36, y: 40, rotate: 4.6, scale: 0.42, z: 4, kind: 'back', opacity: 0.58 },
  { x: -0.25, y: 31, rotate: -3.8, scale: 0.42, z: 5, kind: 'auto', opacity: 0.66 },
  { x: -0.12, y: 27, rotate: 2.7, scale: 0.42, z: 6, kind: 'sliver', opacity: 0.62 },
  { x: 0.02, y: 27, rotate: -1.9, scale: 0.44, z: 7, kind: 'back', opacity: 0.6 },
  { x: 0.16, y: 31, rotate: 3.7, scale: 0.42, z: 8, kind: 'auto', opacity: 0.66 },
  { x: 0.3, y: 39, rotate: -4.5, scale: 0.4, z: 5, kind: 'back', opacity: 0.58 },
  { x: 0.43, y: 54, rotate: 5, scale: 0.36, z: 3, kind: 'sliver', opacity: 0.55 },
  { x: -0.41, y: 71, rotate: 3.4, scale: 0.44, z: 13, kind: 'auto', opacity: 0.78 },
  { x: -0.28, y: 62, rotate: -2.9, scale: 0.5, z: 17, kind: 'auto', opacity: 0.84 },
  { x: -0.14, y: 57, rotate: 2.2, scale: 0.52, z: 18, kind: 'photo', opacity: 0.86 },
  { x: 0, y: 55, rotate: -2.4, scale: 0.54, z: 19, kind: 'back', opacity: 0.8 },
  { x: 0.15, y: 58, rotate: 2.8, scale: 0.52, z: 20, kind: 'auto', opacity: 0.86 },
  { x: 0.29, y: 64, rotate: -3.4, scale: 0.48, z: 16, kind: 'auto', opacity: 0.82 },
  { x: 0.41, y: 74, rotate: 3.8, scale: 0.4, z: 12, kind: 'sliver', opacity: 0.68 },
  { x: -0.34, y: 92, rotate: -3.2, scale: 0.45, z: 14, kind: 'sliver', opacity: 0.7 },
  { x: -0.2, y: 89, rotate: 2.5, scale: 0.64, z: 32, kind: 'auto' },
  { x: -0.05, y: 86, rotate: -1.8, scale: 0.78, z: 45, kind: 'mini' },
  { x: 0.12, y: 89, rotate: 2.2, scale: 0.74, z: 44, kind: 'mini' },
  { x: 0.27, y: 92, rotate: -2.8, scale: 0.58, z: 30, kind: 'auto' },
  { x: -0.11, y: 105, rotate: 3.1, scale: 0.68, z: 46, kind: 'mini' },
  { x: 0.08, y: 106, rotate: -2.5, scale: 0.66, z: 43, kind: 'mini' },
]

function stableNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function firstName(name: string): string {
  if (name === 'A card was left') return 'A card'
  return name.trim().split(/\s+/)[0] ?? name
}

function getHeapPlan(count: number, tile: number) {
  if (count <= 5) {
    return { widthRatio: 0.44, height: Math.round(tile * 1.18), slots: INTIMATE_SLOTS.slice(0, count) }
  }
  if (count <= 12) {
    return { widthRatio: 0.74, height: Math.round(tile * 1.5), slots: SMALL_HEAP_SLOTS.slice(0, count) }
  }
  if (count <= 40) {
    return { widthRatio: 0.8, height: Math.round(tile * 1.58), slots: MEDIUM_HEAP_SLOTS }
  }
  return { widthRatio: 0.92, height: Math.round(tile * 1.72), slots: DENSE_HEAP_SLOTS }
}

function visibleCards(cards: Contribution[], limit: number): Contribution[] {
  if (cards.length <= limit) return cards

  const selected = new Map<string, Contribution>()
  const newestTarget = Math.max(0, limit - 4)
  cards.slice(-newestTarget).forEach((card) => selected.set(card.id, card))

  const photoCards = cards
    .filter((card) => card.imageUrl && !selected.has(card.id))
    .sort((a, b) => stableNumber(`${BASE_LAYOUT_SEED}:photo:${a.id}`) - stableNumber(`${BASE_LAYOUT_SEED}:photo:${b.id}`))

  for (const card of photoCards) {
    if (selected.size >= limit) break
    selected.set(card.id, card)
  }

  const sampled = cards
    .filter((card) => !selected.has(card.id))
    .sort((a, b) => stableNumber(`${BASE_LAYOUT_SEED}:sample:${a.id}`) - stableNumber(`${BASE_LAYOUT_SEED}:sample:${b.id}`))

  for (const card of sampled) {
    if (selected.size >= limit) break
    selected.set(card.id, card)
  }

  const selectedIds = new Set(selected.keys())
  return cards.filter((card) => selectedIds.has(card.id))
}

function resolveKind(slotKind: SlotKind, card: Contribution, index: number): BasinItem['kind'] {
  if (slotKind !== 'auto') return slotKind
  if (card.imageUrl && index % 2 === 0) return 'photo'
  return 'tile'
}

function buildBasinItems(cards: Contribution[], tile: number, width: number, heapWidth: number, slots: HeapSlot[]): BasinItem[] {
  const shown = visibleCards(cards, slots.length)
  const centerX = width / 2
  const slotScale = tile / 76

  return shown.map((card, index) => {
    const slot = slots[index % slots.length] ?? FALLBACK_SLOT
    const kind = resolveKind(slot.kind, card, index)
    const baseSize =
      kind === 'mini'
        ? tile
        : kind === 'photo'
          ? tile * 0.74
          : kind === 'tile'
            ? tile * 0.58
            : kind === 'back'
              ? tile * 0.6
              : tile * 0.54

    return {
      card,
      kind,
      size: Math.round(baseSize * slot.scale),
      x: Math.round(centerX + slot.x * heapWidth),
      y: Math.round(slot.y * slotScale),
      rotate: slot.rotate,
      opacity: slot.opacity ?? 1,
      z: slot.z,
    }
  })
}

function BasinTile({
  item,
  viewerRole,
  isOwn,
  onClick,
}: {
  item: BasinItem
  viewerRole: ViewerRole
  isOwn: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const { card, size, kind } = item
  const mark = amountDisplay(card, viewerRole, isOwn)
  const privateCard = card.visibility === 'private'
  const name = privateCard ? 'Private' : firstName(card.displayName)
  const hasPhoto = kind === 'photo' && !!card.imageUrl
  const isSliver = kind === 'sliver'
  const isBack = kind === 'back'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={privateCard ? 'Private card' : `Card from ${card.displayName}`}
      className="pointer-events-auto relative overflow-hidden rounded-[5px] border border-[#d4c8b2]/55 bg-[#eee6d7] text-left text-[#2a251e]
                 shadow-[0_1px_0_rgba(255,255,255,0.52)_inset,0_2px_5px_rgba(0,0,0,0.18),0_10px_20px_-12px_rgba(0,0,0,0.75)]
                 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-parchment/70"
      style={{
        width: size,
        height: Math.round(size * (isSliver ? 0.46 : hasPhoto ? 1.05 : 0.74)),
        background:
          'linear-gradient(145deg, rgba(243,236,222,0.98), rgba(231,222,204,0.97) 62%, rgba(218,207,185,0.94))',
      }}
    >
      {hasPhoto ? (
        <span className="block h-full w-full p-[3px]">
          <img src={card.imageUrl} alt="" className="h-full w-full rounded-[2px] object-cover" draggable={false} />
        </span>
      ) : isBack || isSliver ? (
        <span className="flex h-full flex-col justify-between px-1.5 py-1.5">
          <span className="block h-px w-4/5 bg-[#2a251e]/8" />
          <span className="block h-px w-2/3 bg-[#2a251e]/7" />
          <span className="block h-px w-1/2 bg-[#2a251e]/6" />
        </span>
      ) : (
        <span className="flex h-full flex-col justify-between px-1.5 py-1.5">
          <span className="flex items-start justify-between gap-1">
            <span className="max-w-[70%] truncate font-display text-[10px] leading-none text-[#2a251e]/70">
              {name}
            </span>
            {mark.kind !== 'none' && (
              <span role="img" aria-label="Amount attached" className="pt-[1px]">
                {mark.kind === 'glyph' ? (
                  <PaymentGlyph tone="green" size={7} />
                ) : (
                  <span className="text-[8px] font-medium leading-none text-[#2a251e]/52">{mark.text}</span>
                )}
              </span>
            )}
          </span>
          <span className="block h-px w-3/4 bg-[#2a251e]/10" />
        </span>
      )}
      {hasPhoto && mark.kind !== 'none' && (
        <span className="absolute right-1.5 top-1.5" role="img" aria-label="Amount attached">
          {mark.kind === 'glyph' ? (
            <PaymentGlyph tone="green" size={7} />
          ) : (
            <span className="rounded-full bg-[#f7f0e1]/85 px-1 py-0.5 text-[8px] font-medium leading-none text-[#2a251e]/62">
              {mark.text}
            </span>
          )}
        </span>
      )}
    </button>
  )
}

function LeaveYoursCard({
  count,
  tile,
  onOpen,
}: {
  count: number
  tile: number
  onOpen: () => void
}) {
  const size = count === 0 ? Math.round(tile * 1.28) : Math.round(tile * 0.92)

  return (
    <motion.button
      layoutId="waiting-card"
      type="button"
      onClick={onOpen}
      aria-label="Leave a card"
      className="group pointer-events-auto flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[7px] border border-[#d8ceb9]/75 p-3
                 text-[#211c16] shadow-[0_1px_0_rgba(255,255,255,0.62)_inset,0_4px_10px_rgba(0,0,0,0.22),0_18px_34px_-18px_rgba(0,0,0,0.82)]
                 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-parchment/70"
      style={{
        width: size,
        height: size,
        background:
          'linear-gradient(145deg, rgba(243,236,222,0.99), rgba(230,221,203,0.97) 58%, rgba(219,208,187,0.95))',
      }}
    >
      <span className="font-display text-[17px] leading-tight">Leave yours</span>
      <span className="text-[30px] leading-none opacity-58 transition-opacity group-hover:opacity-80">+</span>
    </motion.button>
  )
}

export function ContributionCardRail({
  cards,
  tile,
  viewerRole,
  isOwn,
  justPlacedId,
  isGathering = false,
  hideLeaveYours = false,
  onLeaveYours,
  onOpen,
}: Props) {
  const reducedMotion = useReducedMotion()
  const count = cards.length
  const compact = tile < 84
  const width = compact ? 338 : 380
  const heapPlan = getHeapPlan(count, tile)
  const heapWidth = Math.round(width * heapPlan.widthRatio)
  const items = buildBasinItems(cards, tile, width, heapWidth, heapPlan.slots)

  return (
    <div className="pointer-events-none flex flex-col items-center" aria-label="Cards gathered with the artist">
      {count > 0 && (
        <motion.div
          className="relative"
          style={{ width, height: heapPlan.height }}
          animate={{ opacity: isGathering ? 0.5 : 1, scale: isGathering && !reducedMotion ? 0.975 : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            aria-hidden
            className="absolute left-1/2 bottom-0 h-16 rounded-full bg-black/30 blur-2xl"
            style={{ width: Math.min(width * 0.82, 430), transform: 'translateX(-50%)' }}
          />
          <div
            aria-hidden
            className="absolute left-1/2 bottom-5 h-20 rounded-full"
            style={{
              width: Math.min(width * 0.78, 390),
              transform: 'translateX(-50%)',
              background:
                'radial-gradient(ellipse at center, rgba(18,14,10,0.19) 0%, rgba(18,14,10,0.09) 43%, rgba(18,14,10,0) 76%)',
            }}
          />

          {items.map((item) => {
            const ownCard = isOwn(item.card)
            const isNew = item.card.id === justPlacedId
            const sharedStyle = {
              left: item.x,
              top: item.y,
              marginLeft: -item.size / 2,
              marginTop: -item.size / 2,
              zIndex: ownCard ? 900 + item.z : item.z,
            }

            return (
              <motion.div
                key={item.card.id}
                initial={isNew && !reducedMotion ? { opacity: 0, y: 30, scale: 0.96, rotate: item.rotate * 0.4 } : false}
                animate={{
                  opacity: 1,
                  x: isGathering && !reducedMotion ? width / 2 - item.x : 0,
                  y: isGathering && !reducedMotion ? heapPlan.height * 0.58 - item.y : 0,
                  rotate: isGathering && !reducedMotion ? item.rotate * 0.18 : item.rotate,
                  scale: isGathering && !reducedMotion ? 0.72 : 1,
                }}
                transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                style={sharedStyle}
              >
                {item.kind === 'mini' ? (
                  <SupportArtifact
                    contribution={item.card}
                    size={item.size}
                    viewerRole={viewerRole}
                    isOwn={ownCard}
                    onClick={(event) => onOpen(item.card, event.currentTarget)}
                  />
                ) : (
                  <BasinTile
                    item={item}
                    viewerRole={viewerRole}
                    isOwn={ownCard}
                    onClick={(event) => onOpen(item.card, event.currentTarget)}
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {!hideLeaveYours && !isGathering && (
        <motion.div
          className={count > 5 ? 'relative z-10 mt-7 md:mt-7' : count > 0 ? 'relative z-10 mt-6 md:mt-6' : 'relative z-10 mt-0'}
          animate={{
            opacity: isGathering ? 0 : 1,
            rotate: count === 0 ? -1 : 2.5,
            scale: isGathering && !reducedMotion ? 0.96 : 1,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <LeaveYoursCard count={count} tile={tile} onOpen={onLeaveYours} />
        </motion.div>
      )}
    </div>
  )
}
