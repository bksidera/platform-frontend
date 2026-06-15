import type { FakeInscription } from './InscriptionCard'

export const ARTIST = 'Maria Vane'
export const VENUE = 'The Blue Door'
export const DATE_LABEL = 'Thursday, June 11'

// A portrait show poster stand-in. Hardcoded — this page is a laboratory.
export const POSTER_URL =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&h=1200&fit=crop&q=80'

const STAMP = `${VENUE} · June 11`

// ~20 pins: name-only, name+note, name+note+photo, and private/unnamed —
// private pins render identically at rest; only the reveal differs.
export const FAKE_INSCRIPTIONS: FakeInscription[] = [
  { id: 'f1', x: 0.22, y: 0.18, glyph: '◆', name: 'Jordan Mills', note: 'That bridge in the last song. I was not ready.', stamp: STAMP, seenByArtist: true },
  { id: 'f2', x: 0.71, y: 0.12, glyph: '●', name: 'Priya N.', stamp: STAMP },
  { id: 'f3', x: 0.45, y: 0.31, glyph: '✶', name: null, stamp: STAMP },
  { id: 'f4', x: 0.83, y: 0.27, glyph: '◆', name: 'Sam Okafor', note: 'Three years of second Thursdays.', stamp: STAMP },
  { id: 'f5', x: 0.13, y: 0.42, glyph: '▲', name: 'Devon', stamp: STAMP, seenByArtist: true },
  { id: 'f6', x: 0.58, y: 0.45, glyph: '●', name: 'Cass & Lee', note: 'Our first show together.', photoUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=70', stamp: STAMP },
  { id: 'f7', x: 0.31, y: 0.56, glyph: '◆', name: null, stamp: STAMP },
  { id: 'f8', x: 0.76, y: 0.52, glyph: '✶', name: 'M. Whitfield', stamp: STAMP },
  { id: 'f9', x: 0.49, y: 0.63, glyph: '●', name: 'Anaya', note: 'I drove two hours. Worth every mile.', stamp: STAMP },
  // Indexes 9–13 are the visible pile (rendered last-five-reversed, f14 on
  // top): clean → note fragment → "Seen by Maria" → photo sliver → private.
  // The full evidence ration in view, never two on a card.
  { id: 'f10', x: 0.19, y: 0.71, glyph: '◆', name: null, stamp: STAMP },
  { id: 'f11', x: 0.64, y: 0.74, glyph: '▲', name: 'Cass & Lee', note: 'Our first show together.', photoUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=70', stamp: STAMP },
  { id: 'f12', x: 0.87, y: 0.68, glyph: '●', name: 'Devon', stamp: STAMP, seenByArtist: true },
  { id: 'f13', x: 0.38, y: 0.81, glyph: '✶', name: 'Karim', note: 'The quiet one in the encore.', stamp: STAMP },
  { id: 'f14', x: 0.55, y: 0.17, glyph: '◆', name: 'Elise', stamp: STAMP },
  { id: 'f15', x: 0.27, y: 0.33, glyph: '●', name: 'Theo R.', stamp: STAMP },
  { id: 'f16', x: 0.69, y: 0.36, glyph: '◆', name: 'June + Robbie', stamp: STAMP },
  { id: 'f17', x: 0.11, y: 0.58, glyph: '✶', name: 'Marcus', note: 'Heard you on the radio once. Better in a room.', stamp: STAMP },
  { id: 'f18', x: 0.81, y: 0.84, glyph: '●', name: 'The Okonkwos', stamp: STAMP },
  { id: 'f19', x: 0.46, y: 0.9, glyph: '◆', name: 'Lena P.', stamp: STAMP },
  { id: 'f20', x: 0.6, y: 0.58, glyph: '▲', name: 'Whit', stamp: STAMP },
]
