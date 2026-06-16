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
  surface = 'paper',
}: {
  contribution: Contribution
  creatorFirst: string
  viewerRole: ViewerRole
  isOwn: boolean
  surface?: 'paper' | 'dark'
}) {
  const name = contribution.visibility === 'private' ? 'Private card' : contribution.displayName
  const mark = amountDisplay(contribution, viewerRole, isOwn)
  const paper = surface === 'paper'
  const privateAmountText =
    mark.kind === 'amount' && viewerRole === 'giver' && isOwn
      ? `You attached ${mark.text}`
      : mark.kind === 'amount'
        ? `${mark.text} attached`
        : null

  return (
    <div className={paper ? 'space-y-4 text-[#2a251e]' : 'space-y-3.5'}>
      <div className="flex items-start justify-between gap-4">
        <p className={`font-display text-xl leading-tight ${paper ? 'text-[#211c16]' : 'text-parchment/95'}`}>{name}</p>
        {mark.kind === 'glyph' && (
          <span className="pt-1.5" role="img" aria-label="Amount attached">
            <PaymentGlyph tone={paper ? 'green' : 'parchment'} size={paper ? 12 : 11} />
          </span>
        )}
        {mark.kind === 'amount' && (
          <span className={`pt-1 text-sm font-medium ${paper ? 'text-[#2a251e]/60' : 'text-parchment/55'}`}>
            {privateAmountText}
          </span>
        )}
      </div>
      {contribution.note && (
        <p
          className={`overflow-hidden font-display leading-relaxed ${
            paper ? 'text-[18px] text-[#2a251e]/78' : 'text-[15px] text-parchment/78'
          }`}
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 4,
          }}
        >
          {contribution.note}
        </p>
      )}
      {contribution.imageUrl && (
        <div
          className={
            paper
              ? 'rounded-[7px] bg-[#fbf5e8] p-1.5 shadow-[0_1px_1px_rgba(255,255,255,0.6)_inset,0_8px_20px_-14px_rgba(42,37,30,0.8)]'
              : ''
          }
        >
          <img
            src={contribution.imageUrl}
            alt=""
            className={`w-full aspect-[4/3] object-cover ${paper ? 'rounded-[4px]' : 'rounded-[6px] ring-1 ring-white/10'}`}
            draggable={false}
          />
        </div>
      )}
      <p className={`text-[11px] ${paper ? 'text-[#2a251e]/42' : 'text-parchment/40'}`}>
        Left with {creatorFirst} ·{' '}
        {new Date(contribution.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
