import type { Contribution } from './types'
import { amountDisplay, type ViewerRole } from './viewer'

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
  amountPending = false,
  onCompleteAmount,
}: {
  contribution: Contribution
  creatorFirst: string
  viewerRole: ViewerRole
  isOwn: boolean
  surface?: 'paper' | 'dark'
  amountPending?: boolean
  onCompleteAmount?: () => void
}) {
  const name = contribution.displayName
  const mark = amountDisplay(contribution, viewerRole, isOwn)
  const paper = surface === 'paper'
  const privateAmountText =
    mark.kind === 'amount' && viewerRole === 'giver' && isOwn
      ? `You attached ${mark.text}`
      : mark.kind === 'amount'
        ? `${mark.text} attached`
        : null
  const pendingAmountText =
    contribution.amountCents > 0
      ? `$${contribution.amountCents % 100 === 0 ? contribution.amountCents / 100 : (contribution.amountCents / 100).toFixed(2)}`
      : null

  return (
    <div className={paper ? 'space-y-4 text-[#2a251e]' : 'space-y-3.5'}>
      <div className="flex items-start justify-between gap-4">
        <p className={`font-display text-xl leading-tight ${paper ? 'text-[#211c16]' : 'text-parchment/95'}`}>{name}</p>
        {mark.kind === 'amount' && !amountPending && (
          <span className={`pt-1 text-sm font-medium ${paper ? 'text-[#2a251e]/62' : 'text-parchment/58'}`}>
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
            className={`w-full aspect-[4/3] object-cover opacity-95 saturate-[0.8] contrast-[0.94] sepia-[0.08] ${
              paper ? 'rounded-[4px]' : 'rounded-[6px] ring-1 ring-white/10'
            }`}
            draggable={false}
          />
        </div>
      )}
      {isOwn && amountPending && pendingAmountText && (
        <div
          className={`rounded-[6px] px-3 py-2.5 ${
            paper ? 'bg-[#211c16]/[0.05]' : 'bg-parchment/[0.06]'
          }`}
        >
          <p className={`text-[12px] leading-snug ${paper ? 'text-[#2a251e]/78' : 'text-parchment/75'}`}>
            Your {pendingAmountText} hasn't gone with your card yet.
          </p>
          {onCompleteAmount && (
            <button
              type="button"
              onClick={onCompleteAmount}
              className={`mt-2 rounded-[6px] border px-3.5 py-1.5 font-display text-[13px] transition-colors ${
                paper
                  ? 'border-[#211c16] bg-[#211c16] text-[#f2ebdd]'
                  : 'border-parchment/40 text-parchment hover:border-parchment/70'
              }`}
            >
              Complete it
            </button>
          )}
        </div>
      )}
      <p className={`text-[11px] ${paper ? 'text-[#2a251e]/62' : 'text-parchment/58'}`}>
        Left with {creatorFirst} ·{' '}
        {new Date(contribution.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
