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
  kind: 'mini' | 'tile' | 'photo'
  size: number
  x: number
  y: number
  rotate: number
  z: number
}

const BASE_LAYOUT_SEED = 'living-frame-paper-basin-v1'

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

function visibleCards(cards: Contribution[]): Contribution[] {
  if (cards.length <= 24) return cards

  const newest = cards.slice(-18)
  const sampled = cards
    .slice(0, -18)
    .filter((card) => stableNumber(`${BASE_LAYOUT_SEED}:sample:${card.id}`) % 3 === 0)
    .slice(-32)

  return [...sampled, ...newest]
}

function itemKind(card: Contribution, index: number, count: number): BasinItem['kind'] {
  if (count <= 5) return 'mini'
  if (card.imageUrl && index % 3 !== 0) return 'photo'
  if (index % 9 === 1 || index % 11 === 4 || index >= count - 3) return 'mini'
  return 'tile'
}

function buildBasinItems(cards: Contribution[], tile: number, width: number, height: number): BasinItem[] {
  const shown = visibleCards(cards)
  const count = shown.length
  const compact = tile < 84
  const centerX = width / 2
  const centerY = height * 0.52

  return shown.map((card, index) => {
    const n = stableNumber(`${BASE_LAYOUT_SEED}:${card.id}`)
    const kind = itemKind(card, index, count)
    const normalized = count <= 1 ? 0 : (index / (count - 1)) * 2 - 1
    const centerBias = Math.sign(normalized) * Math.pow(Math.abs(normalized), 0.78)
    const jitterX = ((Math.floor(n / 37) % 101) - 50) / 50
    const jitterY = ((Math.floor(n / 97) % 101) - 50) / 50
    const layer = Math.floor(index / 12)
    const size =
      kind === 'mini'
        ? Math.round(tile * (count <= 5 ? 0.9 : compact ? 0.66 : 0.7))
        : kind === 'photo'
          ? Math.round(tile * (compact ? 0.48 : 0.5))
          : Math.round(tile * (compact ? 0.34 : 0.36))

    return {
      card,
      kind,
      size,
      x: Math.round(centerX + centerBias * width * 0.37 + jitterX * width * 0.08),
      y: Math.round(centerY + jitterY * height * 0.22 + Math.min(layer * 4, 24)),
      rotate: ((Math.floor(n / 211) % 121) - 60) / 14,
      z: index + (n % 7),
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
        height: Math.round(size * (hasPhoto ? 1.05 : 0.74)),
        background:
          'linear-gradient(145deg, rgba(243,236,222,0.98), rgba(231,222,204,0.97) 62%, rgba(218,207,185,0.94))',
      }}
    >
      {hasPhoto ? (
        <span className="block h-full w-full p-[3px]">
          <img src={card.imageUrl} alt="" className="h-full w-full rounded-[2px] object-cover" draggable={false} />
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
  const size = count === 0 ? Math.round(tile * 1.45) : Math.round(tile * 0.92)

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
  const width = compact ? 338 : 548
  const height = count === 0 ? Math.round(tile * 1.95) : Math.round(tile * (count > 24 ? 2.45 : count > 5 ? 2.15 : 1.85))
  const items = buildBasinItems(cards, tile, width, height)
  const leaveX = count === 0 ? width / 2 : width * (compact ? 0.72 : 0.76)
  const leaveY = count === 0 ? height * 0.5 : height * 0.62

  return (
    <motion.div
      className="relative pointer-events-none"
      style={{ width, height }}
      aria-label="Cards gathered with the artist"
      animate={{ opacity: isGathering ? 0.58 : 1, scale: isGathering && !reducedMotion ? 0.985 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-3 bottom-0 rounded-[32px] border border-[#eadfca]/18 shadow-[0_20px_55px_-32px_rgba(0,0,0,0.9)]"
        style={{
          background:
            'linear-gradient(180deg, rgba(238,229,211,0.11), rgba(238,229,211,0.045) 42%, rgba(20,16,12,0.08))',
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-3 h-12 rounded-full bg-black/24 blur-xl"
        style={{ width: Math.min(width * 0.82, 440), transform: 'translateX(-50%)' }}
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
            initial={isNew && !reducedMotion ? { opacity: 0, y: -18, scale: 1.14, rotate: item.rotate * 0.4 } : false}
            animate={{
              opacity: 1,
              x: isGathering && !reducedMotion ? width / 2 - item.x : 0,
              y: isGathering && !reducedMotion ? height * 0.48 - item.y : 0,
              rotate: isGathering && !reducedMotion ? item.rotate * 0.25 : item.rotate,
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

      {!hideLeaveYours && (
        <motion.div
          className="absolute"
          style={{
            left: leaveX,
            top: leaveY,
            marginLeft: -(count === 0 ? Math.round(tile * 1.45) : Math.round(tile * 0.92)) / 2,
            marginTop: -(count === 0 ? Math.round(tile * 1.45) : Math.round(tile * 0.92)) / 2,
            zIndex: 1200,
          }}
          animate={{
            x: isGathering && !reducedMotion ? width / 2 - leaveX : 0,
            y: isGathering && !reducedMotion ? height * 0.48 - leaveY : 0,
            rotate: count === 0 ? -1 : 2.5,
            scale: isGathering && !reducedMotion ? 0.82 : 1,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <LeaveYoursCard count={count} tile={tile} onOpen={onLeaveYours} />
        </motion.div>
      )}
    </motion.div>
  )
}
