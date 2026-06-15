import { motion } from 'framer-motion'
import type { Contribution } from './types'
import { SupportArtifact, ClusterChip } from './SupportArtifact'
import type { ViewerRole } from './viewer'

/**
 * Paid-or-not, the cards gather here: a measured fan of square artifacts
 * accumulated into the lower edge of the work. One disciplined baseline with
 * small, stable, per-card variation — human but designed, never random. Square
 * widths are fixed; cards overlap into a fan so the most recent reads fully on
 * top and the rest peek beneath it.
 */
interface Props {
  cards: Contribution[] // chronological; newest renders last (on top, rightmost)
  clustered: number
  tile: number
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  justPlacedId?: string | null
  onOpen: (c: Contribution) => void
  onOpenCluster: () => void
}

type CardJitter = { rotateDeg: number; x: number; y: number; overlap: number }

function stableNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function jitterFor(id: string, tile: number): CardJitter {
  const n = stableNumber(id)
  // Overlap is a fraction of the tile so squares fan consistently at any size.
  const base = Math.round(tile * 0.42)
  return {
    rotateDeg: ((n % 51) - 25) / 20, // -1.25 to +1.25
    x: (Math.floor(n / 41) % 7) - 3,
    y: (Math.floor(n / 369) % 5) - 2,
    overlap: base + (Math.floor(n / 2583) % 7), // base .. base+6
  }
}

export function ContributionCardRail({
  cards,
  clustered,
  tile,
  viewerRole,
  isOwn,
  justPlacedId,
  onOpen,
  onOpenCluster,
}: Props) {
  if (cards.length === 0 && clustered === 0) return null

  let cursor = 0
  const items = cards.map((card, index) => {
    const jitter = jitterFor(card.id, tile)
    if (index > 0) cursor -= jitter.overlap
    const left = cursor
    cursor += tile
    return { card, index, jitter, left }
  })

  const clusterLeft = clustered > 0 ? cursor - (items.length > 0 ? Math.round(tile * 0.42) : 0) : 0
  const totalWidth = clustered > 0 ? clusterLeft + tile : cursor

  return (
    <div
      className="relative w-full pointer-events-none"
      style={{ height: tile + 18 }}
      aria-label="Cards left with the artist"
    >
      <div
        aria-hidden
        className="absolute left-1/2 bottom-1 h-5 rounded-full bg-black/20 blur-md"
        style={{ width: Math.min(totalWidth + 42, 460), transform: 'translateX(-50%)' }}
      />

      {items.map(({ card, index, jitter, left }) => (
        <motion.div
          key={card.id}
          layout
          initial={card.id === justPlacedId ? { opacity: 0, y: -16, scale: 1.06 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-2"
          style={{ left: `calc(50% + ${left - totalWidth / 2}px)`, zIndex: index + 1 }}
        >
          <div style={{ transform: `translate(${jitter.x}px, ${jitter.y}px) rotate(${jitter.rotateDeg}deg)` }}>
            <SupportArtifact
              contribution={card}
              size={tile}
              viewerRole={viewerRole}
              isOwn={isOwn(card)}
              onClick={() => onOpen(card)}
            />
          </div>
        </motion.div>
      ))}

      {clustered > 0 && (
        <div
          className="absolute bottom-2"
          style={{ left: `calc(50% + ${clusterLeft - totalWidth / 2}px)`, zIndex: items.length + 1 }}
        >
          <ClusterChip count={clustered} size={tile} onClick={onOpenCluster} />
        </div>
      )}
    </div>
  )
}
