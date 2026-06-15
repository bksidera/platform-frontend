import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMonument, revealInscription, trackEvent } from '../services/api'
import { MonumentSurface } from '../components/monument/MonumentSurface'
import { InscriptionPin } from '../components/monument/InscriptionPin'
import type { RevealedInscription } from '../types/api.types'

/**
 * The Monument page (/m/:slug) — the QR destination. The artwork bearing
 * quiet marks; tap a mark to reveal its Inscription; the act lives at the
 * bottom. 10s polling keeps marks arriving during a show. No websockets.
 */
export function MonumentPage() {
  const { slug = '' } = useParams()
  const { data: monument } = useQuery({
    queryKey: ['monument', slug],
    queryFn: () => getMonument(slug),
    refetchInterval: 10000,
  })
  const [revealed, setRevealed] = useState<RevealedInscription | null>(null)

  useEffect(() => {
    if (slug) trackEvent({ type: 'qr_scan', sourceSlug: slug })
  }, [slug])

  if (!monument) {
    return <div className="h-full flex items-center justify-center text-muted">…</div>
  }

  const openInscription = async (id: string) => {
    const data = await revealInscription(id).catch(() => null)
    if (data) setRevealed(data)
  }

  return (
    <div className="relative h-full overflow-hidden">
      <MonumentSurface
        imageUrl={monument.imageUrl}
        onTap={() => setRevealed(null)}
        overlay={({ scale }) => (
          <>
            {monument.inscriptions.map((pin) => (
              <InscriptionPin
                key={pin.id}
                x={pin.x}
                y={pin.y}
                glyph={pin.glyph}
                scale={scale}
                onClick={() => void openInscription(pin.id)}
              />
            ))}
          </>
        )}
      />

      {/* Header: artist and night, quiet, above the work. */}
      <div className="absolute top-0 inset-x-0 px-5 pt-5 pointer-events-none">
        <Link to={`/${monument.creator.slug}`} className="pointer-events-auto">
          <h1 className="font-display text-2xl leading-tight drop-shadow">{monument.creator.name}</h1>
        </Link>
        <p className="text-muted text-xs tracking-wide mt-1">
          {monument.venue}
          {monument.inscriptionCount > 0 && <> · {monument.inscriptionCount} inscribed</>}
        </p>
      </div>

      {/* The act. */}
      <div className="absolute bottom-0 inset-x-0 p-5 pointer-events-none">
        <Link
          to={`/give/${monument.creator.slug}?m=${monument.qrSourceSlug}`}
          className="pointer-events-auto block w-full max-w-md mx-auto text-center py-4
                     border border-line bg-ink/85 backdrop-blur-sm font-display text-xl tracking-wide"
        >
          Leave your mark
        </Link>
      </div>

      {/* Revealed Inscription — votive, not discourse. */}
      {revealed && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => setRevealed(null)}
          className="absolute inset-0 flex items-end justify-center pb-28 px-5 bg-black/30 text-left"
        >
          <div className="w-full max-w-md bg-surface border border-line p-5 space-y-2 cursor-default">
            <p className="text-xs text-muted tracking-wide">
              {revealed.giverName ?? 'A patron'} · {revealed.venueStamp}
            </p>
            {revealed.observationText && (
              <p className="text-parchment/95 leading-relaxed">{revealed.observationText}</p>
            )}
            {revealed.countersignedAt && (
              <p className="text-xs text-brass pt-1">Countersigned by {monument.creator.name}</p>
            )}
          </div>
        </button>
      )}
    </div>
  )
}
