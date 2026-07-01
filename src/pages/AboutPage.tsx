import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * "What is this?" — the one-page answer behind the footer link. Three short
 * passages in mission language. The page exists so the room has a name on the
 * door; it is not a pitch.
 */
export function AboutPage() {
  useEffect(() => {
    document.title = 'What is this? — PLATFORM'
    return () => {
      document.title = 'PLATFORM'
    }
  }, [])

  return (
    <div className="flex min-h-full flex-col bg-ink">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 44% at 50% 0%, rgba(236,230,217,0.055) 0%, rgba(0,0,0,0) 58%)',
        }}
      />
      <main className="relative mx-auto w-full max-w-md flex-1 px-7 pb-14 pt-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-parchment/60">PLATFORM</p>
        <h1 className="mt-3 font-display text-3xl leading-tight text-parchment">
          A place to leave a card with the people whose work moves you.
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-parchment/80">
          <p>
            When something moves you — a set, a painting, a night — that feeling usually has
            nowhere to go. Here it becomes a card: your name, a few words, maybe a photo, left
            with the creator beneath their work.
          </p>
          <p>
            Some cards carry an amount inside. The amount is part of the card, not a price —
            only the creator sees it, and it reaches them directly. Payments are handled by
            Stripe; we never see or store card details.
          </p>
          <p>No feeds. No likes. No rankings. Just the work, and the cards people leave with it.</p>
        </div>
        <Link
          to="/"
          className="mt-10 inline-block border border-line px-4 py-2 text-sm text-parchment/80 transition-colors hover:border-parchment/30 hover:text-parchment"
        >
          Return
        </Link>
      </main>
    </div>
  )
}
