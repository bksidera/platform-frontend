import type { Contribution } from './types'
import { SupportArtifact } from './SupportArtifact'
import type { ViewerRole } from './viewer'

/**
 * The work with its overflow spill (refinement spec): the image is sovereign;
 * at higher densities the oldest cards begin to climb its lower left/right
 * edges — never more than the lower 20–25% of the image, never a full
 * decorative frame, never covering meaningful content. The main accumulation
 * lives in the ContributionCardRail; this component renders only the image and
 * the gentle low side spill.
 */

const KISS_PX = 12

interface Props {
  imageUrl: string
  /** Overflow cards for the side spill, chronological. Max 4 are shown
   *  (2 per side, rising 1–2 card heights from the bottom corners). */
  spill: Contribution[]
  tile: number
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  onOpen: (c: Contribution) => void
}

export function LivingFrame({ imageUrl, spill, tile, viewerRole, isOwn, onOpen }: Props) {
  const rightSide = spill.slice(0, 2)
  const leftSide = spill.slice(2, 4)

  const tiles = (list: Contribution[]) =>
    list.map((c) => (
      <SupportArtifact
        key={c.id}
        contribution={c}
        size={tile}
        viewerRole={viewerRole}
        isOwn={isOwn(c)}
        onClick={() => onOpen(c)}
      />
    ))

  return (
    <div className="relative inline-block">
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="block w-auto h-auto select-none rounded-[8px] ring-1 ring-white/10
                   max-h-[52vh] max-w-[88vw] md:max-h-[60vh] md:max-w-[64vw] lg:max-w-[52vw]"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.05), 0 24px 60px -12px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.5)',
        }}
      />

      {/* Side spill: lower corners only, climbing at most two card heights. */}
      {rightSide.length > 0 && (
        <div
          className="absolute flex flex-col-reverse items-start gap-1.5 pointer-events-none"
          style={{ left: '100%', marginLeft: -KISS_PX, bottom: '3%' }}
        >
          {tiles(rightSide)}
        </div>
      )}
      {leftSide.length > 0 && (
        <div
          className="absolute flex flex-col-reverse items-end gap-1.5 pointer-events-none"
          style={{ right: '100%', marginRight: -KISS_PX, bottom: '3%' }}
        >
          {tiles(leftSide)}
        </div>
      )}
    </div>
  )
}
