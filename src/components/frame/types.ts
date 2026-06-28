// Living Frame contribution model.

export type ContributionType = 'amount' | 'note'

export interface CreateContributionInput {
  creatorId: string
  roomId: string
  type: ContributionType
  displayName: string
  email: string
  note?: string
  imageUrl?: string
  amountCents: number
  currency: 'USD'
  isPrivate?: boolean
}

export interface Contribution {
  id: string
  creatorId: string
  roomId: string
  type: ContributionType
  displayName: string
  email?: string
  note?: string
  imageUrl?: string
  amountCents: number
  currency: 'USD'
  hasAmount: boolean
  createdAt: string
  visibility: 'public' | 'private'
}

export function deriveType(amountCents: number): ContributionType {
  return amountCents > 0 ? 'amount' : 'note'
}
