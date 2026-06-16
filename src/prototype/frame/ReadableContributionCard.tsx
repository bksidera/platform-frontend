import type { Contribution } from './types'
import { amountDisplay, type ViewerRole } from './viewer'
import { PaymentGlyph } from './PaymentGlyph'

/**
 * The readable version of a card. Stack viewer and legacy detail surfaces share
 * this anatomy so a card does not become a different object when opened.
 */
export function ReadableContributionCard({
  contribution,
  creatorFirst,
  viewerRole,
  isOwn,
}: {
  contribution: Contribution
  creatorFirst: string
  viewerRole: ViewerRole
  isOwn: boolean
}) {
  const name = contribution.visibility === 'private' ? 'Private card' : contribution.displayName
  const mark = amountDisplay(contribution, viewerRole, isOwn)

  return (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-xl text-parchment/95 leading-tight">{name}</p>
        {mark.kind === 'glyph' && (
          <span className="pt-1.5">
            <PaymentGlyph tone="parchment" size={11} />
          </span>
        )}
        {mark.kind === 'amount' && <span className="pt-1 text-sm text-parchment/55">{mark.text}</span>}
      </div>
      {contribution.note && <p className="text-[15px] text-parchment/78 leading-relaxed">{contribution.note}</p>}
      {contribution.imageUrl && (
        <img
          src={contribution.imageUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover rounded-[6px] ring-1 ring-white/10"
          draggable={false}
        />
      )}
      <p className="text-[11px] text-parchment/40">
        Left with {creatorFirst} ·{' '}
        {new Date(contribution.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
