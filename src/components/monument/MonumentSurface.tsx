import { useEffect, useState, type ReactNode } from 'react'
import { usePanZoom, type TapEvent } from '../../hooks/usePanZoom'

interface Props {
  imageUrl: string
  onTap?: (e: TapEvent) => void
  /** Renders inside the image frame, above the artwork — pins live here. */
  overlay?: (state: { scale: number; tx: number; ty: number }) => ReactNode
}

/**
 * The Monument at rest: the artist's work, matted on a dark wall, bearing
 * quiet marks. Pan/pinch/momentum via usePanZoom; taps surface normalized
 * 0–1 coordinates against the image. (Adapted from the validated
 * prymr-frontend-s0 BoardFrame.)
 */
export function MonumentSurface({ imageUrl, onTap, overlay }: Props) {
  const { containerRef, imageRef, state, handlers } = usePanZoom({ onTap })
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalHeight > 0) setNaturalRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    function update() {
      const c = containerRef.current
      if (c) setViewport({ w: c.clientWidth, h: c.clientHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [containerRef])

  // Fit-to-viewport preserving natural aspect ratio, with breathing room so
  // the work reads as matted, not edge-to-edge.
  const MARGIN = 0.92
  let frameW = 0
  let frameH = 0
  if (naturalRatio && viewport.w > 0 && viewport.h > 0) {
    const viewportRatio = viewport.w / viewport.h
    if (viewportRatio > naturalRatio) {
      frameH = viewport.h * MARGIN
      frameW = frameH * naturalRatio
    } else {
      frameW = viewport.w * MARGIN
      frameH = frameW / naturalRatio
    }
  }

  return (
    <div
      ref={containerRef}
      {...handlers}
      className="absolute inset-0 overflow-hidden flex items-center justify-center select-none"
      style={{
        touchAction: 'none',
        // Warm gallery-wall dark with soft spotlighting; never pure black.
        background:
          'radial-gradient(ellipse at center, #2b261f 0%, #1c1812 70%, #15120e 100%)',
      }}
    >
      {frameW > 0 && (
        <div
          ref={imageRef}
          className="relative ring-1 ring-white/[0.07]"
          style={{
            width: frameW,
            height: frameH,
            transformOrigin: 'center center',
            willChange: 'transform',
            boxShadow:
              '0 40px 100px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="block w-full h-full object-cover pointer-events-none"
          />
          {overlay?.(state)}
        </div>
      )}
    </div>
  )
}
