import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { MonumentSurface } from '../monument/MonumentSurface'
import { InscriptionPin } from '../monument/InscriptionPin'
import type { MonumentPin, PublicMonument } from '../../types/api.types'

interface Props {
  monument: PublicMonument
  ownMark: { x: number; y: number; glyph: string }
  giverEmail: string
  onRequestClaim: () => Promise<void>
}

/**
 * The watch-it-land moment (L2): the mark settles onto the Monument — one
 * quiet scale-in, nothing more — then the confirmation, which carries the
 * graduation prompt and the identity-claim link (spec §12).
 */
export function LandingView({ monument, ownMark, onRequestClaim }: Props) {
  const reducedMotion = useReducedMotion()
  const [settled, setSettled] = useState(!!reducedMotion)
  const [claimRequested, setClaimRequested] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), reducedMotion ? 0 : 1800)
    return () => clearTimeout(t)
  }, [reducedMotion])

  const pins: MonumentPin[] = monument.inscriptions

  return (
    <div className="relative h-full overflow-hidden">
      <MonumentSurface
        imageUrl={monument.imageUrl}
        overlay={({ scale }) => (
          <>
            {pins.map((pin) => (
              <InscriptionPin key={pin.id} x={pin.x} y={pin.y} glyph={pin.glyph} scale={scale} />
            ))}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, scale: 2.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
              style={{ left: `${ownMark.x * 100}%`, top: `${ownMark.y * 100}%` }}
            >
              <InscriptionPin x={0} y={0} glyph={ownMark.glyph} scale={scale} emphasized />
            </motion.div>
          </>
        )}
      />

      {settled && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 inset-x-0 p-5"
        >
          <div className="w-full max-w-md mx-auto bg-ink/90 backdrop-blur-sm border border-line p-6 space-y-6">
            <p className="font-display text-xl leading-snug">
              You held the line for {monument.creator.name} tonight.
            </p>

            <div className="border-t border-line pt-5 space-y-3">
              <p className="text-muted text-sm leading-relaxed">
                A monthly gift sustains the work between nights like this one.
              </p>
              <button
                type="button"
                className="w-full py-3 border border-line bg-surface font-display text-lg"
              >
                Become a Steward
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              {claimRequested ? (
                <p className="text-muted">Check your email — your place is waiting.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void onRequestClaim().then(() => setClaimRequested(true))
                  }}
                  className="text-muted underline underline-offset-4"
                >
                  Keep a record of your nights
                </button>
              )}
              <Link to={`/m/${monument.qrSourceSlug}`} className="text-muted underline underline-offset-4">
                Back to the Monument
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
