import apiClient from './apiClient'
import type {
  ApiEnvelope,
  MomentIntent,
  CardPaymentIntent,
  CardPaymentStatus,
  MyFrame,
  MyMonument,
  Principal,
  PublicArchive,
  PublicCard,
  PublicFrame,
  PublicMonument,
  RevealedInscription,
  StreamStatus,
} from '../types/api.types'

// ----- Auth -----

export async function requestCreatorLink(email: string, name?: string) {
  await apiClient.post<ApiEnvelope<object>>('/auth/creator/requestLink', { email, name })
}

export async function requestClaimLink(email: string) {
  await apiClient.post<ApiEnvelope<object>>('/auth/claim/requestLink', { email })
}

export async function verifyMagicLink(token: string) {
  const res = await apiClient.post<
    ApiEnvelope<{ token: string; kind: 'creator' | 'giver'; profile: Omit<Principal, 'kind'> }>
  >('/auth/verify', { token })
  return res.data.data
}

// ----- Creator -----

export async function getPublicArchive(slug: string) {
  const res = await apiClient.get<ApiEnvelope<PublicArchive>>(`/creator/archive/${slug}`)
  return res.data.data
}

export async function startOnboarding() {
  const res = await apiClient.post<ApiEnvelope<{ url: string }>>('/creator/onboarding/start')
  return res.data.data
}

export async function getOnboardingStatus() {
  const res = await apiClient.get<ApiEnvelope<{ onboarded: boolean; hasAccount: boolean }>>(
    '/creator/onboarding/status',
  )
  return res.data.data
}

// ----- Payment -----

export async function createMomentIntent(input: {
  creatorSlug: string
  amountCents: number
  name: string
  email: string
  monumentSlug?: string
}) {
  const res = await apiClient.post<ApiEnvelope<MomentIntent>>('/payment/createMomentIntent', input)
  return res.data.data
}

export async function getStreamStatus(streamId: string) {
  const res = await apiClient.get<ApiEnvelope<StreamStatus>>('/payment/streamStatus', {
    params: { streamId },
  })
  return res.data.data
}

// ----- Living Frame -----

export async function getFrame(slug: string) {
  const res = await apiClient.get<ApiEnvelope<PublicFrame>>(`/frames/${slug}`)
  return res.data.data
}

export async function createFrame(input: {
  title: string
  context?: string
  imageUrl: string
}) {
  const res = await apiClient.post<ApiEnvelope<MyFrame>>('/frames', input)
  return res.data.data
}

export async function listMyFrames() {
  const res = await apiClient.get<ApiEnvelope<{ frames: MyFrame[] }>>('/frames/mine')
  return res.data.data.frames
}

export async function createCard(slug: string, input: {
  displayName: string
  email: string
  note?: string
  photoUrl?: string
  amountCents?: number
}) {
  const res = await apiClient.post<ApiEnvelope<PublicCard>>(`/frames/${slug}/cards`, input)
  return res.data.data
}

export async function createCardPaymentIntent(cardId: string) {
  const res = await apiClient.post<ApiEnvelope<CardPaymentIntent>>(`/cards/${cardId}/payment-intent`)
  return res.data.data
}

export async function getCardPaymentStatus(cardId: string) {
  const res = await apiClient.get<ApiEnvelope<CardPaymentStatus>>(`/cards/${cardId}/payment-status`)
  return res.data.data
}

// ----- Monument -----

export async function getMonument(qrSourceSlug: string) {
  const res = await apiClient.get<ApiEnvelope<PublicMonument>>(`/monument/${qrSourceSlug}`)
  return res.data.data
}

export async function revealInscription(id: string) {
  const res = await apiClient.get<ApiEnvelope<RevealedInscription>>(`/monument/inscription/${id}`)
  return res.data.data
}

export async function placeInscription(input: {
  streamId: string
  x: number
  y: number
  glyph: string
  observationText?: string
  visibility?: 'private' | 'public'
}) {
  const res = await apiClient.post<ApiEnvelope<{ id: string }>>('/monument/inscription', input)
  return res.data.data
}

export async function createMonument(input: {
  title: string
  venue: string
  eventDate: string
  imageUrl: string
}) {
  const res = await apiClient.post<ApiEnvelope<MyMonument>>('/monument', input)
  return res.data.data
}

export async function listMyMonuments() {
  const res = await apiClient.get<ApiEnvelope<{ monuments: MyMonument[] }>>('/monument/mine')
  return res.data.data.monuments
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiEnvelope<{ url?: string; imageUrl?: string }>>(
    '/file-upload/uploadsmallcontent',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 },
  )
  const url = res.data.data.url ?? res.data.data.imageUrl
  if (!url) throw new Error('Upload did not return a URL')
  return url
}

// ----- Instrumentation -----

export function trackEvent(input: {
  type: string
  sourceSlug?: string
  monumentId?: string
  creatorId?: string
  metadata?: Record<string, unknown>
}) {
  // Fire-and-forget; analytics must never break a giving flow.
  void apiClient.post('/events/track', input).catch(() => undefined)
}
