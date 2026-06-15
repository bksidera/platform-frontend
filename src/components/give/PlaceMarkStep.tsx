import { useState } from 'react'
import { MonumentSurface } from '../monument/MonumentSurface'
import { InscriptionPin, GLYPHS } from '../monument/InscriptionPin'
import type { MonumentPin } from '../../types/api.types'

interface Props {
  imageUrl: string
  existingPins: MonumentPin[]
  onPlaced: (mark: { x: number; y: number; glyph: string }) => void
}

/**
 * Place your mark (L2): pan and pinch to find the spot that is yours, tap to
 * set it, choose a glyph from the constrained set. The work stays dominant —
 * chrome is held to one instruction line and one confirm.
 */
export function PlaceMarkStep({ imageUrl, existingPins, onPlaced }: Props) {
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null)
  const [glyph, setGlyph] = useState<string>(GLYPHS[0])

  return (
    <div className="relative h-full overflow-hidden">
      <MonumentSurface
        imageUrl={imageUrl}
        onTap={(e) => setSpot({ x: e.imageX, y: e.imageY })}
        overlay={({ scale }) => (
          <>
            {existingPins.map((pin) => (
              <InscriptionPin key={pin.id} x={pin.x} y={pin.y} glyph={pin.glyph} scale={scale} />
            ))}
            {spot && (
              <InscriptionPin x={spot.x} y={spot.y} glyph={glyph} scale={scale} emphasized />
            )}
          </>
        )}
      />

      <div className="absolute top-0 inset-x-0 px-5 pt-5 pointer-events-none">
        <p className="text-sm text-parchment/90 drop-shadow">
          {spot ? 'This spot is yours.' : 'Find your place on tonight’s Monument.'}
        </p>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 space-y-3">
        <div className="flex justify-center gap-2">
          {GLYPHS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGlyph(g)}
              aria-label={`Mark ${g}`}
              aria-pressed={g === glyph}
              className={`w-11 h-11 flex items-center justify-center border bg-ink/85 backdrop-blur-sm text-sm
                ${g === glyph ? 'border-brass text-brass' : 'border-line text-parchment/80'}`}
            >
              {g}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!spot}
          onClick={() => spot && onPlaced({ ...spot, glyph })}
          className="block w-full max-w-md mx-auto text-center py-4 border border-line bg-ink/85
                     backdrop-blur-sm font-display text-xl tracking-wide disabled:opacity-40"
        >
          Set my mark here
        </button>
      </div>
    </div>
  )
}
