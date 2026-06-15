// The constrained glyph set (L2): small, quiet, visually uniform marks.
// Proposed set pending founder sign-off — restraint over expressiveness.
export const GLYPHS = ['◆', '●', '▲', '✶', '♥', '⬟'] as const
export type Glyph = (typeof GLYPHS)[number]

interface Props {
  x: number // normalized 0–1 against the Monument image
  y: number
  glyph: string
  scale: number // current pan-zoom scale, for counter-scaling
  onClick?: () => void
  /** The giver's own mark during placement/landing — slightly brighter, never louder. */
  emphasized?: boolean
}

/**
 * A mark on the Monument's resting surface. Never a name, never text, never
 * media — those live inside the opened Inscription. Counter-scaled so marks
 * stay small and quiet at any zoom; the work stays dominant.
 */
export function InscriptionPin({ x, y, glyph, scale, onClick, emphasized }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Inscription"
      className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-50%, -50%) scale(${1 / scale})`,
        width: 28,
        height: 28,
      }}
    >
      <span
        className={`leading-none ${emphasized ? 'text-[13px] text-brass' : 'text-[11px] text-parchment/90'}`}
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
      >
        {glyph}
      </span>
    </button>
  )
}
