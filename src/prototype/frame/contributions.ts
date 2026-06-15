import type { Contribution, CreateContributionInput } from './types'
import { deriveType } from './types'

/**
 * Contribution creation with the payment abstraction (spec §11): the mock
 * payment step is isolated in `mockAuthorizePayment` so Stripe later replaces
 * exactly that function — payment success gates Support Contributions; Note
 * Contributions never touch the payment path.
 */

const STORAGE_KEY = 'platform-frame-proto'
const MOCK_PAYMENT = true

function buildContribution(input: CreateContributionInput): Contribution {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    creatorId: input.creatorId,
    roomId: input.roomId,
    type: deriveType(input.supportAmountCents),
    displayName: input.displayName,
    note: input.note || undefined,
    imageUrl: input.imageUrl || undefined,
    supportAmountCents: input.supportAmountCents,
    currency: input.currency,
    hasSupport: input.supportAmountCents > 0,
    createdAt: new Date().toISOString(),
    visibility: input.isPrivate ? 'private' : 'public',
  }
}

async function mockAuthorizePayment(_amountCents: number): Promise<{ ok: boolean }> {
  // Stripe payment sheet goes here later. Mock: brief processing, success.
  await new Promise((r) => setTimeout(r, 650))
  return { ok: true }
}

export async function submitSupport(input: CreateContributionInput): Promise<Contribution> {
  if (input.supportAmountCents <= 0) throw new Error('An amount is required')
  if (MOCK_PAYMENT) {
    const payment = await mockAuthorizePayment(input.supportAmountCents)
    if (!payment.ok) throw new Error('The card could not be placed')
  }
  const contribution = buildContribution(input)
  persist(contribution)
  return contribution
}

export async function submitNote(input: CreateContributionInput): Promise<Contribution> {
  if (!input.note?.trim() && !input.imageUrl) {
    throw new Error('A note or photo is required')
  }
  const contribution = buildContribution({ ...input, supportAmountCents: 0 })
  persist(contribution)
  return contribution
}

export function loadUserContributions(): Contribution[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Contribution[]
  } catch {
    return []
  }
}

function persist(contribution: Contribution) {
  // Object URLs don't survive reload; drop them from storage.
  const storable = contribution.imageUrl?.startsWith('blob:')
    ? { ...contribution, imageUrl: undefined }
    : contribution
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...loadUserContributions(), storable]))
}

export function clearUserContributions() {
  localStorage.removeItem(STORAGE_KEY)
}
