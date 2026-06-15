// Living Frame contribution model — PLATFORM-update-1.md §11.

export type ContributionType = 'support' | 'note'

export interface CreateContributionInput {
  creatorId: string
  roomId: string
  type: ContributionType
  displayName: string
  note?: string
  imageUrl?: string
  supportAmountCents: number
  currency: 'USD'
  isPrivate?: boolean
}

export interface Contribution {
  id: string
  creatorId: string
  roomId: string
  type: ContributionType
  displayName: string
  note?: string
  imageUrl?: string
  supportAmountCents: number
  currency: 'USD'
  hasSupport: boolean
  createdAt: string
  visibility: 'public' | 'private'
}

export function deriveType(supportAmountCents: number): ContributionType {
  return supportAmountCents > 0 ? 'support' : 'note'
}
