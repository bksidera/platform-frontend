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
  tone?: 'ink' | 'parchment' | 'green'
  size?: number
}) {
  const color = tone === 'parchment' ? '#ece6d9' : tone === 'green' ? '#3a7554' : '#2a251e'
  const opacity = tone === 'parchment' ? 0.58 : tone === 'green' ? 0.82 : 0.46
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="6" cy="6" r="5.1" fill={color} opacity={opacity} />
      <circle cx="4.3" cy="4.2" r="1.05" fill={tone === 'parchment' ? '#fff8e8' : '#f4eddf'} opacity="0.28" />
    </svg>
  )
}
