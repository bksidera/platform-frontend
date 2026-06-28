import apiClient from './apiClient'
import type {
  ApiEnvelope,
  CardPaymentIntent,
  CardPaymentStatus,
  CreatorFrame,
  MyFrame,
  Principal,
  PublicArchive,
  PublicCard,
  PublicFrame,
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
  const res = await apiClient.get<ApiEnvelope<{ onboarded: boolean; hasAccount: boolean; simulated?: boolean }>>(
    '/creator/onboarding/status',
  )
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

export async function getCreatorFrame(slug: string) {
  const res = await apiClient.get<ApiEnvelope<CreatorFrame>>(`/frames/${slug}/creator`)
  return res.data.data
}

export async function createCard(slug: string, input: {
  displayName: string
  email: string
  note?: string
  photoUrl?: string
  amountCents?: number
  visibility?: 'private' | 'public'
}) {
  const res = await apiClient.post<ApiEnvelope<PublicCard>>(`/frames/${slug}/cards`, input)
  return res.data.data
}

export async function hideCard(cardId: string) {
  const res = await apiClient.post<ApiEnvelope<{ hidden: boolean }>>(`/cards/${cardId}/hide`)
  return res.data.data
}

export async function approveCardPhoto(cardId: string) {
  const res = await apiClient.post<ApiEnvelope<{ photoModerationStatus: 'approved' }>>(
    `/cards/${cardId}/photo/approve`,
  )
  return res.data.data
}

export async function holdCardPhoto(cardId: string) {
  const res = await apiClient.post<ApiEnvelope<{ photoModerationStatus: 'held' }>>(
    `/cards/${cardId}/photo/hold`,
  )
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

const UPLOAD_TARGET_BYTES = 1.25 * 1024 * 1024
const UPLOAD_MAX_EDGE = 1800

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be prepared. Try a JPEG or PNG.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('This image could not be prepared.'))
      },
      'image/jpeg',
      quality,
    )
  })
}

async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= UPLOAD_TARGET_BYTES && file.type === 'image/jpeg') return file

  const image = await loadImage(file)
  const scale = Math.min(1, UPLOAD_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This image could not be prepared.')
  context.drawImage(image, 0, 0, width, height)

  let blob = await canvasToBlob(canvas, 0.82)
  for (const quality of [0.72, 0.62, 0.52]) {
    if (blob.size <= UPLOAD_TARGET_BYTES) break
    blob = await canvasToBlob(canvas, quality)
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function uploadImage(file: File): Promise<string> {
  const prepared = await prepareImageForUpload(file)
  const form = new FormData()
  form.append('file', prepared)
  const res = await apiClient
    .post<ApiEnvelope<{ url?: string; imageUrl?: string }>>(
      '/file-upload/uploadsmallcontent',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 },
    )
    .catch((error: unknown) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 413
      ) {
        throw new Error('That image is too large. Try a smaller photo.')
      }
      throw error
    })
  const url = res.data.data.url ?? res.data.data.imageUrl
  if (!url) throw new Error('Upload did not return a URL')
  return url
}

// ----- Instrumentation -----

export function trackEvent(input: {
  type: string
  sourceSlug?: string
  frameId?: string
  cardId?: string
  creatorId?: string
  metadata?: Record<string, unknown>
}) {
  // Fire-and-forget; analytics must never break a giving flow.
  void apiClient.post('/events/track', input).catch(() => undefined)
}
