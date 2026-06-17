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
  const color = tone === 'parchment' ? '#ece6d9' : tone === 'green' ? '#426f55' : '#2a251e'
  const opacity = tone === 'parchment' ? 0.58 : tone === 'green' ? 0.72 : 0.46
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M6.1 1.2c2.7.1 4.7 2 4.7 4.6 0 2.9-2.1 5-4.9 5-2.7 0-4.8-2-4.7-4.8.1-2.7 2.1-4.9 4.9-4.8Z"
        fill={color}
        opacity={opacity}
      />
      <path
        d="M4 3.7c.7-.4 1.7-.1 2.1.6.4.7.2 1.5-.5 1.8-.8.4-1.7.1-2.1-.6-.4-.6-.2-1.4.5-1.8Z"
        fill={tone === 'parchment' ? '#fff8e8' : '#f4eddf'}
        opacity="0.18"
      />
    </svg>
  )
}
