import type { Contribution } from '../../components/frame/types'

export const CREATOR = {
  id: 'maria-vane',
  roomId: 'blue-door-june-11',
  name: 'Maria Vane',
  context: 'The Blue Door · June 11',
  imageUrl:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&h=1200&fit=crop&q=80',
}

const NAMES = [
  'Jordan Mills', 'Priya N.', 'Sam Okafor', 'Devon', 'Cass & Lee', 'Karim', 'Elise',
  'M. Whitfield', 'Anaya', 'Theo R.', 'June + Robbie', 'Marcus', 'The Okonkwos', 'Lena P.',
  'Whit', 'A. Tran', 'Ruth', 'Felix Brand', 'Noor', 'Camille D.', 'Oscar', 'Bea & Tom',
  'H. Salinas', 'Greta', 'Miles', 'Dom T.', 'Yuki', 'Pat Moreno', 'Stella', 'JB',
  'Kris L.', 'The Harlans', 'Ivy', 'Ren', 'Maya O.', 'Cole', 'Dana W.', 'Ezra',
  'Frankie', 'Lou', 'Tess M.', 'Ari', 'Beck', 'Nina V.', 'Sol', 'Pia', 'Gus',
  'Harriet', 'Kit', 'Omar S.',
]

const NOTES = [
  'Incredible energy tonight.',
  'Loved this. Keep going.',
  'This made my night.',
  'Beautiful work.',
  'That bridge in the last song. I was not ready.',
  'Three years of second Thursdays.',
  'I drove two hours. Worth every mile.',
  'The quiet one in the encore.',
  'Goosebumps all over.',
  'You owned the stage.',
  'Heard you on the radio once. Better in a room.',
  'Our first show together.',
  'Still humming it.',
  'Front row, forever changed.',
]

const PHOTOS = [
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&q=70',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=70',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=70',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70',
]

// One public object — the card — in a realistic mix: most carry an amount,
// some don't, across every content combination (note, photo, both, minimal,
// private). Deterministic so lab states are stable and comparable. Every card
// satisfies the validation rule: name + at least one of amount / note / photo.
export function seedContributions(count: number): Contribution[] {
  return Array.from({ length: count }, (_, i) => {
    const isPrivate = i % 9 === 4
    const hasPhoto = i % 3 === 1
    // Roughly 1 in 4 cards carries no amount — legitimate, never shamed. A
    // no-amount card always has a note or photo so it's never an empty card.
    const noAmount = i % 4 === 2
    const hasNote = noAmount ? !hasPhoto || i % 2 === 0 : i % 3 !== 2
    return {
      id: `seed-card-${i}`,
      creatorId: CREATOR.id,
      roomId: CREATOR.roomId,
      type: noAmount ? 'note' : 'amount',
      displayName: NAMES[i % NAMES.length] ?? 'A card',
      email: undefined,
      note: hasNote ? NOTES[i % NOTES.length] : undefined,
      imageUrl: hasPhoto ? PHOTOS[i % PHOTOS.length] : undefined,
      amountCents: noAmount ? 0 : ([500, 1000, 2500][i % 3] ?? 1000),
      currency: 'USD' as const,
      hasAmount: !noAmount,
      createdAt: new Date(Date.UTC(2026, 5, 11, 20, 0 + i)).toISOString(),
      visibility: (isPrivate ? 'private' : 'public') as 'public' | 'private',
    }
  })
}
