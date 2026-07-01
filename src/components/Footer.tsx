import { Link } from 'react-router-dom'

/**
 * The gallery label at the bottom of every public surface: who keeps this
 * room, and one door to "what is this." Trust chrome in the card's register —
 * never louder than a wall label.
 */
export function Footer() {
  return (
    <footer className="relative z-10 w-full pb-8 pt-16 text-center">
      <p className="text-[11px] tracking-[0.14em] text-parchment/55">
        <span className="font-display tracking-[0.22em] text-parchment/70">PLATFORM</span>
        <span aria-hidden className="mx-2.5 text-parchment/30">
          ·
        </span>
        <Link
          to="/about"
          className="underline-offset-4 transition-colors hover:text-parchment/80 hover:underline focus-visible:text-parchment/80"
        >
          What is this?
        </Link>
      </p>
    </footer>
  )
}
