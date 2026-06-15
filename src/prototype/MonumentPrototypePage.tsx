import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { MountedPosterScene } from './MountedPosterScene'
import { EngravedPin } from './EngravedPin'
import { WaitingPin } from './WaitingPin'
import { Plaque, LedgerEdge } from './Apparatus'
import { InscriptionCard, type FakeInscription } from './InscriptionCard'
import { PinLandingMoment } from './PinLandingMoment'
import { IdentifySheet, NoteSheet, AmountSheet } from './FlowSheets'
import { FAKE_INSCRIPTIONS, POSTER_URL, ARTIST, VENUE, DATE_LABEL } from './fakeData'
import { useMatColor } from './useMatColor'

/**
 * The design laboratory (Addendum 2 + Addendum 1 §2.1). One route, one
 * hardcoded poster, fake pins, no auth, no payment. The question this page
 * answers: does touching the waiting pin and watching it join the mounted
 * poster feel inevitable?
 *
 * Lab controls (top right): entry mode (auto-set vs choose spot), reset.
 */

type Phase = 'rest' | 'choosing' | 'identify' | 'note' | 'amount' | 'landing' | 'after'
type EntryMode = 'auto' | 'choose'

// Auto-set: the pin finds a natural place — the open spot farthest from its
// neighbors, away from the edges.
function findNaturalSpot(pins: { x: number; y: number }[]) {
  let best = { x: 0.5, y: 0.5 }
  let bestScore = -1
  for (let i = 0; i < 220; i++) {
    const c = { x: 0.14 + Math.random() * 0.72, y: 0.14 + Math.random() * 0.72 }
    const score = Math.min(...pins.map((p) => Math.hypot(p.x - c.x, p.y - c.y)), 1)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}

export function MonumentPrototypePage() {
  const matColor = useMatColor(POSTER_URL)
  const [pins, setPins] = useState<FakeInscription[]>(FAKE_INSCRIPTIONS)
  const [mode, setMode] = useState<EntryMode>('auto')
  const [phase, setPhase] = useState<Phase>('rest')
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null)
  const [giverName, setGiverName] = useState('')
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [open, setOpen] = useState<FakeInscription | null>(null)

  const ledgerNames = pins
    .slice(-6)
    .reverse()
    .map((p) => p.name ?? 'A private supporter')

  const putBack = () => {
    setPhase('rest')
    setSpot(null)
    setGiverName('')
    setNote('')
    setPhotoUrl(null)
  }

  const touchWaitingPin = () => {
    setOpen(null)
    if (mode === 'auto') {
      setSpot(findNaturalSpot(pins))
      setPhase('identify')
    } else {
      setPhase('choosing')
    }
  }

  const settle = useCallback(() => {
    setPins((prev) => [
      ...prev,
      {
        id: `mine-${Date.now()}`,
        x: spot?.x ?? 0.5,
        y: spot?.y ?? 0.5,
        glyph: '◆',
        name: giverName || null,
        note: note || undefined,
        photoUrl: photoUrl ?? undefined,
        stamp: `${VENUE} · ${DATE_LABEL}`,
      },
    ])
    setPhase('after')
  }, [spot, giverName, note, photoUrl])

  const inFlow = phase !== 'rest' && phase !== 'after'

  return (
    <div className="relative h-full overflow-hidden bg-ink">
      <MountedPosterScene
        imageUrl={POSTER_URL}
        matColor={matColor}
        threshold
        onPosterTap={(e) => {
          if (phase === 'choosing') {
            setSpot({ x: e.imageX, y: e.imageY })
          } else if (phase === 'rest' || phase === 'after') {
            setOpen(null)
          }
        }}
        posterOverlay={() => (
          <>
            {pins.map((pin) =>
              phase === 'landing' && pin.id.startsWith('mine-') ? null : (
                <EngravedPin
                  key={pin.id}
                  x={pin.x}
                  y={pin.y}
                  glyph={pin.glyph}
                  onClick={
                    phase === 'rest' || phase === 'after' ? () => setOpen(pin) : undefined
                  }
                />
              ),
            )}
            {/* The ghost: lifted to the finger, not yet of the record. */}
            {spot && inFlow && phase !== 'landing' && (
              <span
                aria-hidden
                className="absolute block leading-none pointer-events-none"
                style={{
                  left: `${spot.x * 100}%`,
                  top: `${spot.y * 100}%`,
                  fontSize: 'min(2.6cqw, 16px)',
                  transform: 'translate(-50%, -50%) translateY(-3px) scale(1.18)',
                  opacity: 0.85,
                  color: 'rgba(236, 230, 217, 0.95)',
                  textShadow: '0 3px 5px rgba(0,0,0,0.55), 0 7px 14px rgba(0,0,0,0.3)',
                }}
              >
                ◆
              </span>
            )}
            {phase === 'landing' && spot && (
              <PinLandingMoment x={spot.x} y={spot.y} glyph="◆" onSettled={settle} />
            )}
          </>
        )}
        matApparatus={
          <>
            <LedgerEdge names={ledgerNames} />
            <Plaque
              artist={ARTIST}
              venue={VENUE}
              date={DATE_LABEL}
              pinCount={pins.length}
              stewardLine={phase === 'rest' ? `Become a Steward of ${ARTIST}` : undefined}
            />
          </>
        }
      />

      {/* The waiting pin, in the mat margin. The only actionable object. */}
      {(phase === 'rest' || phase === 'after') && (
        <div className="absolute right-[7%] bottom-[21%]">
          <WaitingPin glyph="◆" label="Your pin" onTouch={touchWaitingPin} />
        </div>
      )}

      {/* Choosing a spot (deliberate path). */}
      {phase === 'choosing' && (
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 space-y-3">
          <p className="text-center text-xs text-parchment/60 drop-shadow">
            {spot ? ' ' : 'Touch the poster where your pin should go.'}
          </p>
          {spot && (
            <button
              type="button"
              onClick={() => setPhase('identify')}
              className="block w-full max-w-sm mx-auto py-3 border border-line bg-ink/90 backdrop-blur-sm font-display"
            >
              Pin it here
            </button>
          )}
          <button
            type="button"
            onClick={putBack}
            className="block mx-auto text-[11px] tracking-wide text-parchment/35 underline underline-offset-4"
          >
            Put it back
          </button>
        </div>
      )}

      {phase === 'identify' && (
        <IdentifySheet
          artist={ARTIST}
          onPutBack={putBack}
          onChooseSpot={mode === 'auto' ? () => setPhase('choosing') : undefined}
          onDone={(n) => {
            setGiverName(n)
            setPhase('note')
          }}
        />
      )}
      {phase === 'note' && (
        <NoteSheet
          onPutBack={putBack}
          onDone={(n, p) => {
            setNote(n)
            setPhotoUrl(p)
            setPhase('amount')
          }}
        />
      )}
      {phase === 'amount' && (
        <AmountSheet onPutBack={putBack} onHoldComplete={() => setPhase('landing')} />
      )}

      {/* After the stillness: plain confirmation, then the room again. */}
      {phase === 'after' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute inset-x-0 bottom-0 px-5 pb-6"
        >
          <div className="w-full max-w-sm mx-auto bg-ink/92 backdrop-blur-sm border border-line p-5 space-y-4">
            <p className="font-display text-lg">Your pin is set on tonight's poster.</p>
            <div className="border-t border-line pt-4 space-y-2">
              <p className="text-sm text-parchment/70">Become a monthly Steward?</p>
              <p className="text-[11px] text-parchment/40">
                A monthly amount to {ARTIST}, cancel anytime.
              </p>
              <button type="button" className="w-full py-2.5 border border-line bg-surface text-sm">
                Become a Steward
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPhase('rest')}
              className="block mx-auto text-[11px] tracking-wide text-parchment/35 underline underline-offset-4"
            >
              Back to the poster
            </button>
          </div>
        </motion.div>
      )}

      {/* The reveal: one card at a time, over the mat foot. */}
      {open && (phase === 'rest' || phase === 'after') && (
        <div className="absolute inset-x-0 bottom-[16%] flex justify-center px-5 pointer-events-none">
          <div className="pointer-events-auto">
            <InscriptionCard inscription={open} artist={ARTIST} />
          </div>
        </div>
      )}

      {/* Lab controls — dev only, deliberately out of register. */}
      <div className="absolute top-2 right-2 flex gap-1 font-mono text-[10px] text-white/40">
        {(['auto', 'choose'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-2 py-1 border ${mode === m ? 'border-white/40 text-white/70' : 'border-white/15'}`}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setPins(FAKE_INSCRIPTIONS)
            putBack()
          }}
          className="px-2 py-1 border border-white/15"
        >
          reset
        </button>
      </div>
    </div>
  )
}
