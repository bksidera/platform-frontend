import { motion } from 'framer-motion'
import type { FakeInscription } from '../InscriptionCard'
import { cardName } from './PatronCard'

/**
 * The record beside the work: a pile of cards holding other people's acts.
 * Evidence shows in strict ration — in five cards, at most one note fragment,
 * one "Seen by Maria," one photo sliver, never two on one card. Names stay
 * the dominant signal; the pile suggests contents, never displays posts.
 *
 * On top, the empty place in the record: a blanker card bearing only a faint
 * signature rule — the next blank line in the guest book.
 */

const TILTS = [-1.8, 1.3, -0.7, 1.9, -1.1]
const X_JITTER = [3, -5, 6, -3, 4]
const SLOT_H = 27

type Evidence = 'fragment' | 'seen' | 'photo' | null

// First-match-wins, one of each kind across the visible pile.
function assignEvidence(cards: FakeInscription[]): Evidence[] {
  let fragmentUsed = false
  let seenUsed = false
  let photoUsed = false
  return cards.map((card, i) => {
    if (i === 0) return null // the card just under the slot stays clean
    if (!fragmentUsed && card.note) {
      fragmentUsed = true
      return 'fragment'
    }
    if (!seenUsed && card.seenByArtist) {
      seenUsed = true
      return 'seen'
    }
    if (!photoUsed && card.photoUrl) {
      photoUsed = true
      return 'photo'
    }
    return null
  })
}

interface Props {
  cards: FakeInscription[]
  onOpenCard: (card: FakeInscription) => void
  onTakeYourCard: () => void
  yourCardVisible: boolean
  /** The pile shifts down one slot to make room for an arriving card. */
  receiving?: boolean
}

export function CardStack({ cards, onOpenCard, onTakeYourCard, yourCardVisible, receiving }: Props) {
  const visible = cards.slice(-5).reverse() // most recent nearest the top
  const evidence = assignEvidence(visible)

  return (
    <div className="relative w-full max-w-[320px] mx-auto" style={{ height: 216 }}>
      {/* Shadow pooling beneath the pile — it rests on the same ground as the work. */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: 2,
          width: '86%',
          height: 22,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {visible.map((card, i) => {
        const ev = evidence[i]
        return (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => onOpenCard(card)}
            animate={{ top: 44 + i * SLOT_H + (receiving ? SLOT_H : 0) }}
            transition={{ duration: 0.55, ease: [0.3, 0, 0.2, 1] }}
            className="absolute inset-x-0 mx-auto w-[88%] text-left overflow-hidden"
            style={{
              top: 44 + i * SLOT_H,
              zIndex: visible.length - i,
              transform: `translateX(${X_JITTER[i % X_JITTER.length]}px) rotate(${TILTS[i % TILTS.length]}deg)`,
              background: i === 0 ? '#ebe5d8' : '#e2dbcc',
              filter: `brightness(${1 - i * 0.05})`,
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.3) inset, 0 1.5px 0 rgba(0,0,0,0.22), 0 7px 16px -6px rgba(0,0,0,0.55)',
            }}
          >
            <span className="flex items-baseline gap-3 px-5 py-2.5">
              <span className="font-display text-sm text-[#1d1915] whitespace-nowrap">
                {cardName(card)}
              </span>
              {ev === 'fragment' && card.note && (
                <span className="text-[11px] italic text-[#1d1915]/45 truncate min-w-0">
                  {card.note.slice(0, 26)}—
                </span>
              )}
              {ev === 'seen' && (
                <span className="text-[10px] tracking-wide text-[#7a6233] whitespace-nowrap ml-auto">
                  Seen by Maria
                </span>
              )}
            </span>
            {/* A sliver of a photo tucked inside — contents, not display. */}
            {ev === 'photo' && card.photoUrl && (
              <span
                aria-hidden
                className="absolute right-2 top-1 bottom-1 w-[10px] bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${card.photoUrl})`, boxShadow: 'inset 0 0 2px rgba(0,0,0,0.4)' }}
              />
            )}
          </motion.button>
        )
      })}

      {/* The empty place in the record. */}
      {yourCardVisible && (
        <button
          type="button"
          onClick={onTakeYourCard}
          id="your-card"
          aria-label="Your name"
          className="absolute inset-x-0 mx-auto w-[88%] px-5 pt-3 pb-4 text-left group"
          style={{
            top: 0,
            zIndex: 20,
            transform: 'rotate(-1deg)',
            background: '#f4eee2',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.4) inset, 0 1.5px 0 rgba(0,0,0,0.25), 0 12px 28px -8px rgba(0,0,0,0.6)',
          }}
        >
          <span className="block text-[9px] tracking-[0.18em] uppercase text-[#1d1915]/35 transition-colors group-hover:text-[#1d1915]/55">
            Your name
          </span>
          <span
            aria-hidden
            className="block mt-4 border-b border-[#1d1915]/25 transition-colors group-hover:border-[#1d1915]/45"
          />
        </button>
      )}
    </div>
  )
}
