import type { Contribution } from './types'

/**
 * Viewer-relative amount visibility (Card System Refinement spec §8). There is
 * one public object — the card — and the amount inside it is shown differently
 * depending on who is looking:
 *
 *   no-amount card → none, for everyone
 *   paid card      → public: none · giver(own): amount · giver(other): none · creator: amount
 *
 * Public viewers never see a dollar figure or a payment marker. A no-amount
 * card never carries a "no payment" marker; it simply omits.
 */

export type ViewerRole = 'public' | 'giver' | 'creator'

export type AmountDisplay =
  | { kind: 'amount'; text: string }
  | { kind: 'none' }

export function amountDisplay(
  contribution: Contribution,
  viewerRole: ViewerRole,
  isOwn: boolean,
): AmountDisplay {
  if (contribution.supportAmountCents <= 0) return { kind: 'none' }
  const text = `$${Math.round(contribution.supportAmountCents / 100)}`
  if (viewerRole === 'creator') return { kind: 'amount', text }
  if (viewerRole === 'giver' && isOwn) return { kind: 'amount', text }
  return { kind: 'none' }
}
