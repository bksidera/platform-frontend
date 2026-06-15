/**
 * The waiting pin (Addendum 2 §3): one unset pin in the mat margin, same
 * engraved language as the placed pins but visibly not yet set — raised and
 * catching light where the others are pressed in. The pen beside the guest
 * book. It does not ask; its existence is the ask.
 */
interface Props {
  glyph: string
  label?: string // at most two words, spatial not financial ("Your pin")
  onTouch: () => void
}

export function WaitingPin({ glyph, label, onTouch }: Props) {
  return (
    <button
      type="button"
      onClick={onTouch}
      aria-label={label ?? 'Your pin'}
      className="flex flex-col items-center gap-2 group"
    >
      <span
        aria-hidden
        className="block leading-none select-none transition-transform duration-300 group-hover:-translate-y-px"
        style={{
          fontSize: 17,
          color: 'rgba(236, 230, 217, 0.92)',
          // Raised: a real drop shadow beneath, a touch of top light — the
          // inverse of the engraved treatment.
          textShadow:
            '0 2px 4px rgba(0,0,0,0.6), 0 5px 10px rgba(0,0,0,0.35), 0 -0.5px 0.5px rgba(255,255,255,0.25)',
        }}
      >
        {glyph}
      </span>
      {label && (
        <span className="text-[10px] tracking-[0.18em] uppercase text-parchment/45">{label}</span>
      )}
    </button>
  )
}
