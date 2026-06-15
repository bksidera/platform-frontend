/**
 * The payment glyph (spec §9): a small, quiet seal that means only "this card
 * includes an amount" — never a quantity, never a rank. A small filled
 * letterpress seal; no dollar sign, no coin, no religious or leaderboard
 * iconography. It sits where an amount would otherwise be.
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
      <circle cx="6" cy="6" r="5.1" fill={color} opacity={tone === 'ink' ? 0.46 : 0.58} />
      <circle cx="4.3" cy="4.2" r="1.05" fill={tone === 'ink' ? '#f4eddf' : '#fff8e8'} opacity="0.28" />
    </svg>
  )
}
