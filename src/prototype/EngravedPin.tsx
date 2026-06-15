/**
 * A pin set INTO the poster (Addendum 1 M1): engraved, pressed, letterpress-
 * debossed — never stuck on. Partial opacity and multiply blending let the
 * poster's own color come through; a hairline light edge below and dark edge
 * above sell the press. Pins scale with the work under zoom — they are marks
 * on the object, not UI annotations — so no counter-scaling.
 */
interface Props {
  x: number // normalized 0–1 against the poster
  y: number
  glyph: string
  onClick?: () => void
}

export function EngravedPin({ x, y, glyph, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Pin"
      tabIndex={onClick ? 0 : -1}
      className="absolute flex items-center justify-center"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: '4.5%',
        aspectRatio: '1',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span
        aria-hidden
        className="block leading-none select-none"
        style={{
          fontSize: 'min(2.6cqw, 16px)',
          color: 'rgba(20, 16, 12, 0.55)',
          mixBlendMode: 'multiply',
          textShadow:
            '0 -0.5px 0.5px rgba(0,0,0,0.55), 0 0.5px 0.5px rgba(255,255,255,0.35)',
        }}
      >
        {glyph}
      </span>
    </button>
  )
}
