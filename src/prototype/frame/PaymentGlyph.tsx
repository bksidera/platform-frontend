/**
 * The payment glyph (spec §9): a small, quiet seal that means only "this card
 * includes an amount" — never a quantity, never a rank. A flat letterpress
 * disc with a concentric ring; no dollar sign, no coin, no religious or
 * leaderboard iconography. It sits where an amount would otherwise be.
 */
export function PaymentGlyph({
  tone = 'ink',
  size = 9,
}: {
  tone?: 'ink' | 'parchment'
  size?: number
}) {
  const color = tone === 'ink' ? '#2a251e' : '#ece6d9'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="6" cy="6" r="5.25" fill={color} opacity={tone === 'ink' ? 0.42 : 0.5} />
      <circle cx="6" cy="6" r="2.4" fill={tone === 'ink' ? '#ebe5d8' : '#15120e'} opacity="0.85" />
    </svg>
  )
}
