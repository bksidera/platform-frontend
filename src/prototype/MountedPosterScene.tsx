import { useEffect, useState, type ReactNode } from 'react'
import { usePanZoom, type TapEvent } from '../hooks/usePanZoom'

/**
 * M0 — the mounting (Addendum 2 §2). The poster never floats: it sits on a
 * mat whose color is pulled from the work, under stage-light falloff, with
 * the plaque and ledger edge as the only apparatus. Pan/zoom is damped
 * examination within the mounting, not free transform. The user is a visitor
 * in the work's space, never an operator on a canvas.
 */
interface Props {
  imageUrl: string
  matColor: string
  /** Renders inside the poster, above the work — the pins. */
  posterOverlay?: (state: { scale: number; tx: number; ty: number }) => ReactNode
  /** Apparatus on the mat, below the work: ledger edge, plaque. */
  matApparatus?: ReactNode
  onPosterTap?: (e: TapEvent) => void
  threshold?: boolean // brief composed entrance, ≤400ms, skippable
}

export function MountedPosterScene({
  imageUrl,
  matColor,
  posterOverlay,
  matApparatus,
  onPosterTap,
  threshold = false,
}: Props) {
  const { containerRef, imageRef, state, handlers } = usePanZoom({ onTap: onPosterTap })
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [arrived, setArrived] = useState(!threshold)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalHeight > 0) setNaturalRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (arrived) return
    const t = setTimeout(() => setArrived(true), 400)
    const skip = () => setArrived(true)
    window.addEventListener('pointerdown', skip, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', skip)
    }
  }, [arrived])

  useEffect(() => {
    function update() {
      const c = containerRef.current
      if (c) setViewport({ w: c.clientWidth, h: c.clientHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  // Generous mat margin on all sides; extra room at the foot for the
  // apparatus, like a real mounting.
  const FIT = 0.72
  let frameW = 0
  let frameH = 0
  if (naturalRatio && viewport.w > 0 && viewport.h > 0) {
    const usableH = viewport.h * FIT
    const usableW = viewport.w * 0.82
    if (usableW / usableH > naturalRatio) {
      frameH = usableH
      frameW = frameH * naturalRatio
    } else {
      frameW = usableW
      frameH = frameW / naturalRatio
    }
  }

  return (
    <div
      ref={containerRef}
      {...handlers}
      className="absolute inset-0 overflow-hidden select-none"
      style={{ touchAction: 'none', background: matColor }}
    >
      {/* Enthronement: the work is the brightest object; the mat falls away
          around it. Soft falloff, no literal light rays. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% 42%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)',
        }}
      />

      {/* The work, mounted slightly above center to leave the foot of the mat
          to the apparatus. */}
      <div className="absolute inset-x-0 top-0 bottom-[18%] flex items-center justify-center">
        {frameW > 0 && (
          <div
            ref={imageRef}
            className="relative"
            style={{
              width: frameW,
              height: frameH,
              transformOrigin: 'center center',
              willChange: 'transform',
              opacity: arrived ? 1 : 0,
              transition: threshold ? 'opacity 260ms ease-out 140ms' : undefined,
              containerType: 'inline-size',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -12px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="block w-full h-full object-cover pointer-events-none"
            />
            {posterOverlay?.(state)}
          </div>
        )}
      </div>

      {/* The apparatus lives on the mat, not on the work. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[18%] flex flex-col items-center justify-end pb-5 px-6"
        style={{
          opacity: 1,
          transition: threshold ? 'opacity 180ms ease-out' : undefined,
        }}
      >
        {matApparatus}
      </div>
    </div>
  )
}
