export interface ApiEnvelope<T> {
  status: boolean
  message: string
  data: T
}

export interface Principal {
  id: string
  kind: 'creator' | 'giver'
  name: string
  email: string
  slug?: string
  stripeOnboarded?: boolean
}

export interface PublicArchive {
  name: string
  slug: string
  bio: string | null
  heroImageUrl: string | null
  mediaLinks: { kind: 'spotify' | 'bandcamp' | 'youtube' | 'link'; url: string }[] | null
  stripeOnboarded: boolean
  stewardCount: number
}

export interface MomentIntent {
  streamId: string
  clientSecret: string
}

export interface StreamStatus {
  id: string
  status: 'pending' | 'succeeded' | 'failed'
}

export interface PublicCard {
  id: string
  displayName: string
  note: string | null
  photoUrl: string | null
  amountCents: number | null
  currency: string
  hasAmount: boolean
  paymentStatus: 'none' | 'pending' | 'succeeded' | 'failed'
  visibility: 'private' | 'public'
  createdAt: string
}

export interface PublicFrame {
  id: string
  title: string
  context: string | null
  imageUrl: string
  slug: string
  creator: { name: string; slug: string }
  cards: PublicCard[]
  cardCount: number
}

export interface MyFrame {
  id: string
  title: string
  context: string | null
  imageUrl: string
  slug: string
  cardCount: number
  createdAt: string
}

export interface CardPaymentIntent {
  cardId: string
  streamId: string
  clientSecret: string
}

export interface CardPaymentStatus {
  id: string
  status: 'none' | 'pending' | 'succeeded' | 'failed'
}

export interface MonumentPin {
  id: string
  x: number
  y: number
  glyph: string
}

export interface PublicMonument {
  id: string
  title: string
  venue: string
  eventDate: string
  imageUrl: string
  qrSourceSlug: string
  creator: { name: string; slug: string }
  inscriptions: MonumentPin[]
  inscriptionCount: number
}

export interface RevealedInscription {
  id: string
  glyph: string
  giverName: string | null
  observationText: string | null
  venueStamp: string | null
  createdAt: string
  countersignedAt: string | null
}

export interface MyMonument {
  id: string
  title: string
  venue: string
  eventDate: string
  imageUrl: string
  qrSourceSlug: string
  inscriptionCount: number
}
