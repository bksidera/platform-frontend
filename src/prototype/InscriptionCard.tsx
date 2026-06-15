import { motion, useReducedMotion } from 'framer-motion'

/**
 * M4 — the reveal: turning over a card someone left, not opening a comment
 * popup. Name like a signature line, note like a gallery caption, the stamp
 * small. One open at a time; tapping elsewhere closes it.
 */
export interface FakeInscription {
  id: string
  x: number
  y: number
  glyph: string
  name: string | null // null → "A private supporter"
  note?: string
  photoUrl?: string
  stamp: string // "The Blue Door · June 11"
  seenByArtist?: boolean
}

export function InscriptionCard(props: { inscription: FakeInscription; artist: string }) {
  const { inscription, artist } = props
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 800 }}
      className="w-full max-w-sm bg-surface border border-line px-5 py-4 space-y-3 cursor-default"
    >
      <p className="font-display text-base text-parchment/95">
        {inscription.name ?? 'A private supporter'}
      </p>
      {inscription.note && (
        <p className="text-sm text-parchment/80 leading-relaxed">{inscription.note}</p>
      )}
      {inscription.photoUrl && (
        <img
          src={inscription.photoUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover ring-1 ring-line"
        />
      )}
      <div className="flex items-baseline justify-between pt-1">
        <p className="text-[10px] tracking-[0.14em] text-parchment/40">{inscription.stamp}</p>
        {inscription.seenByArtist && (
          <p className="text-[10px] tracking-wide text-brass/80">Seen by {artist}</p>
        )}
      </div>
    </motion.div>
  )
}
