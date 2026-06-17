import { motion, useReducedMotion } from 'framer-motion'
import type { MouseEvent } from 'react'
import type { Contribution } from './types'
import type { ViewerRole } from './viewer'

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

type MoundTier = 'foreground' | 'midground' | 'background'
type MoundShape = 'full' | 'back' | 'sliver'

type MoundItem = {
  card: Contribution
  tier: MoundTier
  shape: MoundShape
  size: number
  x: number
  y: number
  rotate: number
  opacity: number
  z: number
  tone: number
}

type Slot = {
  tier: MoundTier
  shape?: MoundShape
  x: number
  y: number
  rotate: number
  z: number
  opacity?: number
}

const BASE_LAYOUT_SEED = 'living-frame-v4-mound'
const CARD_ASPECT = 1.05

function stableNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

function cardTime(card: Contribution): number {
  return new Date(card.createdAt).getTime()
}

function sortNewest(cards: Contribution[]): Contribution[] {
  return [...cards].sort((a, b) => cardTime(b) - cardTime(a))
}

function foregroundLimit(count: number): number {
  if (count <= 1) return count
  if (count <= 5) return 2
  return 3
}

function foregroundCards(cards: Contribution[], isOwn: (card: Contribution) => boolean): Contribution[] {
  const limit = foregroundLimit(cards.length)
  if (limit === 0) return []

  const newest = sortNewest(cards)
  const own = newest.filter(isOwn).slice(0, Math.min(2, limit))
  const selected = new Set(own.map((card) => card.id))
  const others = newest.filter((card) => !selected.has(card.id)).slice(0, limit - own.length)

  return [...own, ...others].slice(0, limit)
}

function remainingCards(cards: Contribution[], selected: Contribution[]): Contribution[] {
  const selectedIds = new Set(selected.map((card) => card.id))
  return sortNewest(cards).filter((card) => !selectedIds.has(card.id))
}

function moundWidthRatio(count: number): number {
  if (count <= 1) return 0.3
  if (count <= 5) return 0.5
  if (count <= 12) return 0.5
  if (count <= 25) return 0.54
  if (count <= 50) return 0.76
  return 0.9
}

function visibleCounts(count: number) {
  const foreground = foregroundLimit(count)
  if (count <= foreground) return { foreground, midground: 0, background: 0 }
  if (count <= 5) return { foreground, midground: count - foreground, background: 0 }
  if (count <= 12) return { foreground, midground: Math.min(4, count - foreground), background: Math.max(0, count - foreground - 4) }
  if (count <= 25) return { foreground, midground: Math.min(7, count - foreground), background: Math.min(14, count - foreground - 7) }
  if (count <= 50) return { foreground, midground: 9, background: 22 }
  return { foreground, midground: 10, background: 28 }
}

function generateBackgroundSlots(count: number): Slot[] {
  const rows = count <= 12 ? 2 : count <= 25 ? 3 : 4
  const total = visibleCounts(count).background
  const slots: Slot[] = []

  for (let i = 0; i < total; i += 1) {
    const row = i % rows
    const rowIndex = Math.floor(i / rows)
    const perRow = Math.ceil(total / rows)
    const t = perRow <= 1 ? 0.5 : rowIndex / (perRow - 1)
    const rowSpan = 0.94 - row * 0.1
    const jitterX = ((stableNumber(`${BASE_LAYOUT_SEED}:bgx:${count}:${i}`) % 100) / 100 - 0.5) * 0.035
    const jitterY = ((stableNumber(`${BASE_LAYOUT_SEED}:bgy:${count}:${i}`) % 100) / 100 - 0.5) * 5

    slots.push({
      tier: 'background',
      shape: i % 5 === 0 ? 'sliver' : 'back',
      x: (t - 0.5) * rowSpan + jitterX,
      y: 30 + row * 12 + jitterY,
      rotate: ((stableNumber(`${BASE_LAYOUT_SEED}:bgr:${count}:${i}`) % 120) / 10) - 6,
      z: 5 + row * 2 + (i % 3),
      opacity: 0.42 + row * 0.04,
    })
  }

  return slots
}

function generateMidgroundSlots(count: number): Slot[] {
  const total = visibleCounts(count).midground
  const slots: Slot[] = []
  if (total === 0) return slots

  const span = count <= 12 ? 0.58 : count <= 25 ? 0.68 : 0.78
  for (let i = 0; i < total; i += 1) {
    const t = total <= 1 ? 0.5 : i / (total - 1)
    const jitterX = ((stableNumber(`${BASE_LAYOUT_SEED}:midx:${count}:${i}`) % 100) / 100 - 0.5) * 0.045
    const jitterY = ((stableNumber(`${BASE_LAYOUT_SEED}:midy:${count}:${i}`) % 100) / 100 - 0.5) * 8
    slots.push({
      tier: 'midground',
      shape: 'full',
      x: (t - 0.5) * span + jitterX,
      y: 56 + (i % 2) * 12 + jitterY,
      rotate: ((stableNumber(`${BASE_LAYOUT_SEED}:midr:${count}:${i}`) % 100) / 10) - 5,
      z: 28 + i,
      opacity: 0.7,
    })
  }

  return slots
}

function foregroundSlots(count: number): Slot[] {
  const foreground = foregroundLimit(count)
  if (foreground === 0) return []
  if (foreground === 1) {
    return [{ tier: 'foreground', shape: 'full', x: 0, y: 68, rotate: -1.4, z: 80 }]
  }
  if (foreground === 2) {
    return [
      { tier: 'foreground', shape: 'full', x: -0.12, y: 75, rotate: -2.2, z: 82 },
      { tier: 'foreground', shape: 'full', x: 0.12, y: 74, rotate: 2, z: 83 },
    ]
  }

  return [
    { tier: 'foreground', shape: 'full', x: 0, y: 69, rotate: -0.7, z: 86 },
    { tier: 'foreground', shape: 'full', x: -0.18, y: 88, rotate: -2.6, z: 84 },
    { tier: 'foreground', shape: 'full', x: 0.18, y: 90, rotate: 2.4, z: 85 },
  ]
}

function getMoundPlan(count: number, tile: number, stageWidth: number) {
  const foregroundSize = tile
  const midgroundSize = Math.round(foregroundSize * 0.74)
  const backgroundSize = Math.round(foregroundSize * 0.56)
  const spread = Math.round(stageWidth * moundWidthRatio(count))
  const slots = [
    ...generateBackgroundSlots(count),
    ...generateMidgroundSlots(count),
    ...foregroundSlots(count),
  ]
  const height = count <= 1 ? Math.round(tile * 1.48) : count <= 12 ? Math.round(tile * 1.72) : Math.round(tile * 1.86)

  return { foregroundSize, midgroundSize, backgroundSize, spread, slots, height }
}

function buildMoundItems(cards: Contribution[], tile: number, stageWidth: number, isOwn: (card: Contribution) => boolean): MoundItem[] {
  const count = cards.length
  const plan = getMoundPlan(count, tile, stageWidth)
  const foreground = foregroundCards(cards, isOwn)
  const remaining = remainingCards(cards, foreground)
  const counts = visibleCounts(count)
  const midground = remaining.slice(0, counts.midground)
  const background = remaining.slice(counts.midground, counts.midground + counts.background)
  const tierCards = [...background, ...midground, ...foreground]

  return tierCards.map((card, index) => {
    const slot = plan.slots[index]
    const tier = slot?.tier ?? 'background'
    const size =
      tier === 'foreground'
        ? plan.foregroundSize
        : tier === 'midground'
          ? plan.midgroundSize
          : plan.backgroundSize
    const halfWidth = size / 2
    const x = Math.max(halfWidth + 4, Math.min(stageWidth - halfWidth - 4, stageWidth / 2 + (slot?.x ?? 0) * plan.spread))

    return {
      card,
      tier,
      shape: slot?.shape ?? 'full',
      size,
      x: Math.round(x),
      y: Math.round((slot?.y ?? 40) * (tile / 76)),
      rotate: slot?.rotate ?? 0,
      opacity: slot?.opacity ?? 1,
      z: slot?.z ?? index,
      tone: stableNumber(`${BASE_LAYOUT_SEED}:tone:${card.id}`) % 4,
    }
  })
}

function MoundCard({
  item,
  onClick,
}: {
  item: MoundItem
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const { card, size, tier, shape, tone } = item
  const hasPhoto = !!card.imageUrl
  const hasNote = !!card.note
  const readable = tier === 'foreground'
  const midground = tier === 'midground'
  const height = Math.round(size * (shape === 'sliver' ? 0.38 : CARD_ASPECT))
  const paperTone = [
    'rgba(242,235,222,0.99)',
    'rgba(236,227,210,0.99)',
    'rgba(231,222,204,0.98)',
    'rgba(224,213,193,0.98)',
  ][tone] ?? 'rgba(242,235,222,0.99)'
  const contentOpacity = readable ? 1 : midground ? 0.28 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Card from ${card.displayName}`}
      className="pointer-events-auto relative overflow-hidden rounded-[7px] border border-[#d1c2a8]/60 text-left text-[#2a251e]
                 focus:outline-none focus:ring-2 focus:ring-parchment/70"
      style={{
        width: size,
        height,
        opacity: item.opacity,
        background: `linear-gradient(145deg, ${paperTone}, rgba(221,209,187,0.96))`,
        boxShadow:
          tier === 'foreground'
            ? '0 1px 0 rgba(255,255,255,0.52) inset, 0 12px 24px rgba(0,0,0,0.42), 0 2px 5px rgba(0,0,0,0.24)'
            : tier === 'midground'
              ? '0 1px 0 rgba(255,255,255,0.35) inset, 0 7px 14px rgba(0,0,0,0.38)'
              : '0 3px 8px rgba(0,0,0,0.44)',
        filter:
          tier === 'foreground'
            ? 'none'
            : tier === 'midground'
              ? 'brightness(0.78) saturate(0.8)'
              : 'brightness(0.58) saturate(0.62)',
      }}
    >
      {shape !== 'full' ? (
        <span className="flex h-full flex-col justify-between px-2 py-2" aria-hidden>
          <span className="block h-px w-4/5 bg-[#2a251e]/10" />
          <span className="block h-px w-2/3 bg-[#2a251e]/8" />
          <span className="block h-px w-1/2 bg-[#2a251e]/7" />
        </span>
      ) : hasPhoto ? (
        <span className="block h-full w-full p-[7%]">
          <span className="relative block h-full w-full overflow-hidden rounded-[4px] bg-[#efe6d4] shadow-[0_1px_2px_rgba(0,0,0,0.2)_inset]">
            <img
              src={card.imageUrl}
              alt=""
              draggable={false}
              className="h-full w-full object-cover opacity-90 saturate-[0.48] contrast-[0.88] sepia-[0.16]"
            />
            {readable && (
              <span className="absolute inset-x-0 bottom-0 bg-[#efe6d4]/88 px-1.5 py-1">
                <span className="block truncate font-display text-[11px] leading-none text-[#2a251e]/76">
                  {firstName(card.displayName)}
                </span>
              </span>
            )}
          </span>
        </span>
      ) : (
        <span className="flex h-full flex-col px-[12%] py-[12%]" style={{ opacity: contentOpacity }}>
          <span
            className="truncate font-display leading-none text-[#2a251e]/80"
            style={{ fontSize: readable ? Math.max(12, size * 0.14) : Math.max(9, size * 0.13) }}
          >
            {firstName(card.displayName)}
          </span>
          {hasNote && (
            <span
              className="mt-auto block overflow-hidden font-display leading-tight text-[#2a251e]/70"
              style={{
                fontSize: readable ? Math.max(11, size * 0.125) : Math.max(8, size * 0.1),
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: readable ? 3 : 2,
              }}
            >
              {card.note}
            </span>
          )}
          {!hasNote && <span className="mt-auto block h-px w-2/3 bg-[#2a251e]/12" />}
        </span>
      )}
    </button>
  )
}

function LeaveYoursCard({
  tile,
  onOpen,
}: {
  tile: number
  onOpen: () => void
}) {
  const size = tile

  return (
    <motion.button
      layoutId="waiting-card"
      type="button"
      onClick={onOpen}
      aria-label="Leave a card"
      className="pointer-events-auto flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[7px] border border-[#d8ceb9]/75 p-3
                 text-[#211c16] shadow-[0_1px_0_rgba(255,255,255,0.62)_inset,0_7px_16px_rgba(0,0,0,0.28)]
                 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-parchment/70"
      style={{
        width: size,
        height: Math.round(size * CARD_ASPECT),
        background:
          'linear-gradient(145deg, rgba(244,237,224,0.99), rgba(231,222,204,0.98) 58%, rgba(220,209,188,0.96))',
      }}
    >
      <span className="font-display text-[15px] leading-tight text-[#3b342b]/88">Leave yours</span>
      <span className="text-[23px] font-light leading-none text-[#6e6558]/74">+</span>
    </motion.button>
  )
}

export function ContributionCardRail({
  cards,
  tile,
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
  const stageWidth = compact ? 334 : 380
  const plan = getMoundPlan(count, tile, stageWidth)
  const items = buildMoundItems(cards, tile, stageWidth, isOwn)

  return (
    <div className="pointer-events-none flex flex-col items-center" aria-label="Cards gathered with the artist">
      {count > 0 && (
        <motion.div
          className="relative overflow-hidden"
          style={{ width: stageWidth, height: plan.height }}
          animate={{ opacity: isGathering ? 0.5 : 1, scale: isGathering && !reducedMotion ? 0.975 : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            aria-hidden
            className="absolute left-1/2 bottom-0 h-14 rounded-full bg-black/24 blur-2xl"
            style={{ width: Math.min(stageWidth * 0.86, 360), transform: 'translateX(-50%)' }}
          />

          {items.map((item) => {
            const ownCard = isOwn(item.card)
            const isNew = item.card.id === justPlacedId
            const sharedStyle = {
              left: item.x,
              top: item.y,
              marginLeft: -item.size / 2,
              marginTop: -(item.size * CARD_ASPECT) / 2,
              zIndex: ownCard ? 900 + item.z : item.z,
            }

            return (
              <motion.div
                key={item.card.id}
                initial={isNew && !reducedMotion ? { opacity: 0, y: 70, scale: 0.84, rotate: item.rotate * 0.25 } : false}
                animate={{
                  opacity: 1,
                  x: isGathering && !reducedMotion ? stageWidth / 2 - item.x : 0,
                  y: isGathering && !reducedMotion ? plan.height * 0.62 - item.y : 0,
                  rotate: isGathering && !reducedMotion ? item.rotate * 0.18 : item.rotate,
                  scale: isGathering && !reducedMotion ? 0.72 : 1,
                }}
                transition={{ duration: reducedMotion ? 0 : isNew ? 0.56 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                style={sharedStyle}
              >
                <MoundCard item={item} onClick={(event) => onOpen(item.card, event.currentTarget)} />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {!hideLeaveYours && !isGathering && (
        <motion.div
          className={count > 0 ? 'relative z-10 mt-5 md:mt-5' : 'relative z-10 mt-0'}
          animate={{
            opacity: isGathering ? 0 : 1,
            rotate: 0,
            scale: isGathering && !reducedMotion ? 0.96 : 1,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <LeaveYoursCard tile={tile} onOpen={onLeaveYours} />
        </motion.div>
      )}
    </div>
  )
}
