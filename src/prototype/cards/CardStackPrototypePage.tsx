import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArtifactStage } from './ArtifactStage'
import { CardStack } from './CardStack'
import { PatronCard } from './PatronCard'
import { CardFlow, type DraftCard } from './CardFlow'
import { useMatColor } from '../useMatColor'
import { FAKE_INSCRIPTIONS, POSTER_URL, ARTIST, VENUE, DATE_LABEL } from '../fakeData'
import type { FakeInscription } from '../InscriptionCard'

/**
 * One composed scene: the work on display, the record of response resting
 * beside it on the same ground, one empty place in the record waiting. The
 * payment is wrapped inside a dignified object; the artist never asks.
 *
 * The joining moment is reception, not arrival: stillness, the pile makes
 * room, the card slides in, the pile settles, the count acknowledges it —
 * then, after a beat, the confirmation. Nothing else speaks. (Stewardship is
 * deliberately absent from this prototype so the ritual is judged clean.)
 */

type Phase = 'rest' | 'writing' | 'joining' | 'after'

const STAMP = `${VENUE} · June 11`

export function CardStackPrototypePage() {
  const matColor = useMatColor(POSTER_URL)
  const [cards, setCards] = useState<FakeInscription[]>(FAKE_INSCRIPTIONS.slice(0, 14))
  const [phase, setPhase] = useState<Phase>('rest')
  const [draft, setDraft] = useState<DraftCard | null>(null)
  const [open, setOpen] = useState<FakeInscription | null>(null)

  const joinStack = () => {
    if (draft) {
      setCards((prev) => [
        ...prev,
        {
          id: `mine-${Date.now()}`,
          x: 0,
          y: 0,
          glyph: '◆',
          name: draft.name,
          note: draft.note || undefined,
          photoUrl: draft.photoUrl ?? undefined,
          stamp: STAMP,
        },
      ])
    }
    setDraft(null)
    setPhase('after')
  }

  return (
    <div
      className="relative h-full overflow-hidden flex flex-col"
      style={{ background: matColor }}
      onClick={() => setOpen(null)}
    >
      {/* The room's light: the work is lit; the edges fall away. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 38% 40%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* The stage. */}
      <div className="relative flex-1 min-h-0 w-full max-w-4xl mx-auto px-6 pt-6 md:pt-10 flex flex-col md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)] md:items-end md:gap-12 gap-4">
        {/* The work. */}
        <div className="flex items-end justify-center min-h-0 max-h-[38vh] md:max-h-[74vh] md:pb-2">
          <ArtifactStage imageUrl={POSTER_URL} />
        </div>

        {/* Beside the work, on the same ground: the record, or the card being written. */}
        <div
          className="relative flex-1 md:flex-none flex items-center md:items-end justify-center min-h-0 overflow-y-auto md:overflow-visible md:pb-2"
          onClick={(e) => e.stopPropagation()}
        >
          {phase === 'rest' && (
            <CardStack
              cards={cards}
              onOpenCard={setOpen}
              onTakeYourCard={() => {
                setOpen(null)
                setPhase('writing')
              }}
              yourCardVisible
            />
          )}

          {phase === 'writing' && (
            <CardFlow
              artist={ARTIST}
              onComplete={(d) => {
                setDraft(d)
                setPhase('joining')
              }}
              onPutBack={() => setPhase('rest')}
            />
          )}

          {phase === 'joining' && draft && (
            <ReceivingStack cards={cards} draftName={draft.name} onDone={joinStack} />
          )}

          {phase === 'after' && (
            <div className="w-full space-y-6">
              <CardStack
                cards={cards}
                onOpenCard={setOpen}
                onTakeYourCard={() => setPhase('writing')}
                yourCardVisible={false}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.9 }}
                className="text-center space-y-4 pb-2"
              >
                <p className="font-display text-lg text-parchment/95">
                  Your card is with {ARTIST}.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('rest')}
                  className="text-[11px] tracking-wide text-parchment/35 underline underline-offset-4"
                >
                  Back to the room
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* The shared ground both objects rest on. */}
      <div
        aria-hidden
        className="relative shrink-0 mx-auto w-full max-w-3xl"
        style={{
          height: 1,
          background:
            'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 18%, rgba(0,0,0,0.5) 82%, rgba(0,0,0,0) 100%)',
          boxShadow: '0 6px 18px 2px rgba(0,0,0,0.35)',
        }}
      />

      {/* The plaque binds the scene — identity and evidence, no verbs. */}
      <div className="relative shrink-0 text-center pb-5 pt-4 px-6">
        <p className="font-display text-xl md:text-2xl text-parchment/95 leading-none">{ARTIST}</p>
        <p className="text-[11px] tracking-[0.14em] text-parchment/50 mt-1.5">
          {DATE_LABEL} · {VENUE} · {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </p>
      </div>

      {/* One card open at a time; tap elsewhere puts it down. */}
      <AnimatePresence>
        {open && phase !== 'writing' && phase !== 'joining' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center px-6 bg-black/35">
            <div onClick={(e) => e.stopPropagation()}>
              <PatronCard card={open} artist={ARTIST} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * The reception: stillness → the pile shifts down to make room → the closed
 * card slides into the vacated slot and settles with the pile's own posture
 * → the count acknowledges it (via onDone) → beat → confirmation.
 */
function ReceivingStack(props: {
  cards: FakeInscription[]
  draftName: string
  onDone: () => void
}) {
  const { cards, draftName, onDone } = props
  const reducedMotion = useReducedMotion()
  const [receiving, setReceiving] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setReceiving(true), 420)
    return () => clearTimeout(t)
  }, [reducedMotion, onDone])

  if (reducedMotion) {
    return (
      <CardStack cards={cards} onOpenCard={() => undefined} onTakeYourCard={() => undefined} yourCardVisible={false} />
    )
  }

  return (
    <div className="relative w-full max-w-[320px]" style={{ height: 216 }}>
      {/* Only the four cards that will remain visible after the join, so the
          handoff to the settled pile is positionally seamless. */}
      <div className="absolute inset-0">
        <CardStack
          cards={cards.slice(-4)}
          onOpenCard={() => undefined}
          onTakeYourCard={() => undefined}
          yourCardVisible={false}
          receiving={receiving}
        />
      </div>
      <motion.div
        initial={{
          y: -104,
          x: 0,
          scale: 1.04,
          rotate: 0,
          boxShadow: '0 26px 50px -10px rgba(0,0,0,0.7), 0 6px 14px rgba(0,0,0,0.45)',
        }}
        animate={{
          y: [-104, -104, 44],
          x: [0, 0, 3],
          scale: [1.04, 1.0, 0.985],
          rotate: [0, 0, -1.8],
          boxShadow: [
            '0 26px 50px -10px rgba(0,0,0,0.7), 0 6px 14px rgba(0,0,0,0.45)',
            '0 22px 44px -10px rgba(0,0,0,0.65), 0 5px 12px rgba(0,0,0,0.42)',
            '0 7px 16px -6px rgba(0,0,0,0.55), 0 1.5px 0 rgba(0,0,0,0.22)',
          ],
        }}
        transition={{ duration: 1.7, times: [0, 0.28, 1], ease: [0.32, 0, 0.16, 1] }}
        onAnimationComplete={() => setTimeout(onDone, 650)}
        className="absolute inset-x-0 mx-auto w-[88%] px-5 py-2.5 z-30"
        style={{ background: '#f2ecdf', top: 0 }}
      >
        <span className="block font-display text-sm text-[#1d1915]">{draftName}</span>
      </motion.div>
    </div>
  )
}
