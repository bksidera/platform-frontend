import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { LivingFrame } from '../components/frame/LivingFrame'
import { ContributionCardRail } from '../components/frame/ContributionCardRail'
import { CardStackViewer } from '../components/frame/CardStackViewer'
import type { Contribution } from '../components/frame/types'
import { CREATOR, seedContributions } from '../prototype/frame/seeds'

export function HomePage() {
  const navigate = useNavigate()
  const cards = useMemo(() => seedContributions(14), [])
  const [stackState, setStackState] = useState<{ isOpen: boolean; entryCardId: string | null }>({
    isOpen: false,
    entryCardId: null,
  })
  const stackReturnRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.title = 'Create a Living Frame — PLATFORM'
    return () => {
      document.title = 'PLATFORM'
    }
  }, [])

  const openStack = (card: Contribution, opener: HTMLElement) => {
    stackReturnRef.current = opener
    setStackState({ isOpen: true, entryCardId: card.id })
  }

  const closeStack = () => {
    setStackState({ isOpen: false, entryCardId: null })
    window.requestAnimationFrame(() => stackReturnRef.current?.focus())
  }

  return (
    <div className="min-h-full overflow-hidden bg-ink text-parchment">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 44% at 50% 0%, rgba(236,230,217,0.07) 0%, rgba(0,0,0,0) 58%)',
        }}
      />

      <main className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 pb-12 pt-7 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4 text-sm">
          <Link to="/" className="font-display text-xl leading-none text-parchment">
            PLATFORM
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-muted transition-colors hover:text-parchment">
              What is this?
            </Link>
            <Link
              to="/dashboard"
              className="rounded-[7px] border border-line bg-surface px-3 py-2 text-parchment transition-colors hover:border-parchment/30"
            >
              Create a frame
            </Link>
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-9 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-12">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-parchment/55">
              Living Frame
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.98] text-parchment sm:text-6xl">
              Turn one work into a place people can leave a card.
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-parchment/72">
              Upload an image, add a little context, and get a link plus QR. Cards gather beneath
              the work. Some may carry an amount inside.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-[7px] border border-parchment/30 bg-parchment px-5 py-3 font-display text-[17px] leading-none text-ink shadow-[0_18px_36px_-28px_rgba(236,230,217,0.82)] transition-transform hover:-translate-y-0.5"
              >
                Create a frame
              </Link>
              <a
                href="#sample-frame"
                className="rounded-[7px] border border-line px-5 py-3 text-sm text-parchment/78 transition-colors hover:border-parchment/30 hover:text-parchment"
              >
                See the sample
              </a>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-parchment/68 sm:grid-cols-2">
              <p className="rounded-[7px] border border-line bg-surface/50 px-4 py-3">
                Photos can be hidden from the public frame.
              </p>
              <p className="rounded-[7px] border border-line bg-surface/50 px-4 py-3">
                Amounts stay private publicly.
              </p>
              <p className="rounded-[7px] border border-line bg-surface/50 px-4 py-3">
                Creators see names and emails.
              </p>
              <p className="rounded-[7px] border border-line bg-surface/50 px-4 py-3">
                The link and QR are ready to share.
              </p>
            </div>
          </div>

          <div id="sample-frame" className="min-w-0">
            <div className="mx-auto w-full max-w-[25rem] rounded-[8px] border border-line bg-surface/45 px-4 pb-7 pt-5 shadow-[0_30px_80px_-54px_rgba(0,0,0,0.95)] sm:max-w-[29rem]">
              <header className="pb-4 text-center">
                <p className="font-display text-2xl leading-none text-parchment/94">{CREATOR.name}</p>
                <p className="mt-1.5 text-[11px] tracking-[0.14em] text-parchment/50">
                  {CREATOR.context}
                </p>
              </header>
              <div className="flex flex-col items-center">
                <LivingFrame imageUrl={CREATOR.imageUrl} />
                <div className="relative z-10 -mt-7">
                  <ContributionCardRail
                    cards={cards}
                    tile={72}
                    viewerRole="public"
                    isOwn={() => false}
                    creatorFirst={CREATOR.name.split(' ')[0]}
                    isGathering={stackState.isOpen}
                    onLeaveYours={() => navigate('/dashboard')}
                    onOpen={openStack}
                  />
                </div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-[25rem] text-center text-xs leading-relaxed text-parchment/45 sm:max-w-[29rem]">
              This is the object: the work, cards already gathered, and one card waiting.
            </p>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {stackState.isOpen && (
          <CardStackViewer
            cards={cards}
            entryCardId={stackState.entryCardId}
            ownCardIds={[]}
            creatorName={CREATOR.name}
            viewerRole="public"
            isOwn={() => false}
            onClose={closeStack}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
