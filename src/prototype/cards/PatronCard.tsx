import { motion, useReducedMotion } from 'framer-motion'
import type { FakeInscription } from '../InscriptionCard'

/**
 * A card someone left with the artist. Paper-toned against the dark room —
 * letterpress program insert, not greeting card. Name as the signature,
 * note as contents, the stamp small. Private cards exist with full weight;
 * only the name withholds itself.
 */

export function cardName(card: FakeInscription) {
  return card.name ?? 'A private supporter'
}

export function PatronCard(props: { card: FakeInscription; artist: string; onClose?: () => void }) {
  const { card, artist } = props
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm px-6 py-5 space-y-3 cursor-default"
      style={{
        background: '#ebe5d8',
        color: '#1d1915',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 34px -10px rgba(0,0,0,0.65), 0 3px 8px rgba(0,0,0,0.4)',
      }}
    >
      <p className="font-display text-lg leading-snug border-b border-[#1d1915]/15 pb-1.5">
        {cardName(card)}
      </p>
      {card.note && <p className="text-sm leading-relaxed text-[#3a342c]">{card.note}</p>}
      {card.photoUrl && (
        <div className="p-1.5 border border-[#1d1915]/15 bg-[#1d1915]/[0.03]">
          <img src={card.photoUrl} alt="" className="w-full aspect-[4/3] object-cover" />
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1.5 border-t border-[#1d1915]/15">
        <p className="text-[10px] tracking-[0.14em] text-[#1d1915]/45">{card.stamp}</p>
        {card.seenByArtist && (
          <p className="text-[10px] tracking-wide text-[#7a6233]">Seen by {artist}</p>
        )}
      </div>
    </motion.div>
  )
}
