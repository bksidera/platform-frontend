import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * M3 — the landing. The emotional payoff of the entire flow. The pin does not
 * pop in: it hovers above its spot, pauses, presses into the surface, and
 * becomes indistinguishable from the record. Then stillness, before anything
 * else is allowed to speak. If it reads as a UI animation it is wrong; it
 * should read as the poster accepting the act.
 *
 * Sequence: hover (ghosted, raised, slightly large) → pause → press (the
 * raised shadow collapses, the engraved treatment arrives, a hair of
 * downward settle) → settled → onSettled after a beat.
 */
interface Props {
  x: number
  y: number
  glyph: string
  onSettled: () => void
}

type Phase = 'hover' | 'press' | 'settled'

const HOVER_MS = 700
const PAUSE_MS = 400
const PRESS_MS = 650
const BEAT_MS = 1100

export function PinLandingMoment({ x, y, glyph, onSettled }: Props) {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'settled' : 'hover')

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onSettled, 600)
      return () => clearTimeout(t)
    }
    const t1 = setTimeout(() => setPhase('press'), HOVER_MS + PAUSE_MS)
    const t2 = setTimeout(() => setPhase('settled'), HOVER_MS + PAUSE_MS + PRESS_MS)
    const t3 = setTimeout(onSettled, HOVER_MS + PAUSE_MS + PRESS_MS + BEAT_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [reducedMotion, onSettled])

  const pressed = phase !== 'hover'

  return (
    <span
      aria-hidden
      className="absolute block pointer-events-none"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      {/* Raised body — fades and settles as the press happens. */}
      <span
        className="absolute block leading-none"
        style={{
          fontSize: 'min(2.6cqw, 16px)',
          transform: `translate(-50%, -50%) translateY(${pressed ? '0' : '-3px'}) scale(${pressed ? 1 : 1.18})`,
          opacity: pressed ? 0 : 0.92,
          color: 'rgba(236, 230, 217, 0.95)',
          textShadow: pressed
            ? '0 0 0 rgba(0,0,0,0)'
            : '0 3px 5px rgba(0,0,0,0.55), 0 7px 14px rgba(0,0,0,0.3)',
          transition: `transform ${PRESS_MS}ms cubic-bezier(0.5, 0, 0.15, 1), opacity ${PRESS_MS}ms ease-in, text-shadow ${PRESS_MS}ms ease-in`,
        }}
      >
        {glyph}
      </span>
      {/* Engraved body — arrives as the raised one presses in. */}
      <span
        className="absolute block leading-none"
        style={{
          fontSize: 'min(2.6cqw, 16px)',
          transform: 'translate(-50%, -50%)',
          opacity: pressed ? 1 : 0,
          color: 'rgba(20, 16, 12, 0.55)',
          mixBlendMode: 'multiply',
          textShadow:
            '0 -0.5px 0.5px rgba(0,0,0,0.55), 0 0.5px 0.5px rgba(255,255,255,0.35)',
          transition: `opacity ${PRESS_MS}ms ease-out ${PRESS_MS * 0.3}ms`,
        }}
      >
        {glyph}
      </span>
    </span>
  )
}
