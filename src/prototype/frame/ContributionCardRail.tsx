import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Contribution } from './types'
import { SupportArtifact } from './SupportArtifact'
import type { ViewerRole } from './viewer'

/**
 * The rail is now the root of a pile, not a visible list. Cards press up into
 * the lower edge of the work and hang below it in seeded, irregular layers:
 * dense in the middle, looser at the edges, never paginated into a +N control.
 */
interface Props {
  cards: Contribution[] // chronological; newest renders last and closer to front.
  tile: number
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  justPlacedId?: string | null
  onOpen: (c: Contribution) => void
}

type PilePosition = { rotateDeg: number; x: number; y: number; z: number }

function stableNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function pilePositionFor(id: string, index: number, count: number, tile: number): PilePosition {
  const n = stableNumber(id)
  const signed = ((n % 2001) - 1000) / 1000
  // Higher exponent = more cards cluster toward center, edges calmer
  const centerWeighted = Math.sign(signed) * Math.pow(Math.abs(signed), 2.1)
  const compact = tile < 84
  const maxSpread = compact ? 300 : 520
  const densitySpread = tile * (2.4 + Math.min(count, 16) * 0.14)
  const spread = Math.min(maxSpread, densitySpread)
  const layer = Math.floor(index / 7)
  // Reduced straggle so fewer cards climb high into the image
  const lowerStraggle = n % 11 === 0 ? Math.round(tile * 0.22) : 0

  return {
    rotateDeg: ((Math.floor(n / 37) % 101) - 50) / 15, // about -3.3deg to +3.3deg
    x: Math.round(centerWeighted * (spread / 2) + ((Math.floor(n / 97) % 23) - 11)),
    y: Math.round(
      // Raised base offset so the highest cards sit slightly lower in the image
      tile * 0.14 +
        (Math.floor(n / 211) % Math.round(tile * 0.72)) +
        Math.min(layer * 4, tile * 0.46) +
        lowerStraggle,
    ),
    z: index + (n % 5),
  }
}

export function ContributionCardRail({
  cards,
  tile,
  viewerRole,
  isOwn,
  justPlacedId,
  onOpen,
}: Props) {
  const reducedMotion = useReducedMotion()
  const [liftedId, setLiftedId] = useState<string | null>(null)
  const count = cards.length
  if (count === 0) return null

  const pileHeight = Math.round(tile * (count > 24 ? 2.25 : count > 8 ? 2.05 : 1.72))
  const pileWidth = Math.min(tile < 84 ? 340 : 560, Math.round(tile * (3.1 + Math.min(count, 12) * 0.18)))
  return (
    <div
      className="relative pointer-events-none"
      style={{ width: pileWidth, height: pileHeight }}
      aria-label="Cards gathered with the artist"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-6 h-16 rounded-full bg-black/28 blur-xl"
        style={{ width: Math.min(pileWidth, 520), transform: 'translateX(-50%)' }}
      />

      {cards.map((card, index) => {
        const position = pilePositionFor(card.id, index, count, tile)
        const lifted = liftedId === card.id
        return (
          <motion.div
            key={card.id}
            layout
            initial={card.id === justPlacedId && !reducedMotion ? { opacity: 0, y: -24, scale: 1.06 } : false}
            animate={{
              opacity: 1,
              x: position.x,
              y: lifted && !reducedMotion ? position.y - Math.round(tile * 0.22) : position.y,
              rotate: lifted && !reducedMotion ? position.rotateDeg * 0.45 : position.rotateDeg,
              scale: lifted && !reducedMotion ? 1.07 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-0"
            style={{ marginLeft: -tile / 2, zIndex: lifted ? 1000 : position.z }}
            onPointerEnter={() => setLiftedId(card.id)}
            onPointerLeave={() => setLiftedId((current) => (current === card.id ? null : current))}
            onFocus={() => setLiftedId(card.id)}
            onBlur={() => setLiftedId((current) => (current === card.id ? null : current))}
          >
            <SupportArtifact
              contribution={card}
              size={tile}
              viewerRole={viewerRole}
              isOwn={isOwn(card)}
              onClick={() => onOpen(card)}
            />
          </motion.div>
        )
      })}

    </div>
  )
}
