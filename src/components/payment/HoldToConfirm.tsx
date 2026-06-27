import { useCallback, useEffect, useRef, useState } from 'react'

const HOLD_DURATION_MS = 2500

interface Props {
  label: string // e.g. "Hold for Maria Vane"
  disabled?: boolean
  onConfirm: () => void
}

/**
 * The Hold (L1): a Moment gift is completed by pressing and holding — a slow,
 * quiet fill, a low haptic where supported. No particles, no celebration,
 * nothing scaled to amount. The restraint is the dignity.
 *
 * Accessibility: a non-timed confirm is always present beneath the Hold —
 * visually subordinate, fully functional — and becomes the primary control
 * when the user prefers reduced motion.
 */
export function HoldToConfirm({ label, disabled, onConfirm }: Props) {
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const cancel = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    if (!doneRef.current) setProgress(0)
  }, [])

  useEffect(() => cancel, [cancel])

  const begin = useCallback(() => {
    if (disabled || doneRef.current) return
    startRef.current = performance.now()
    if (navigator.vibrate) navigator.vibrate(10)

    const step = (now: number) => {
      if (startRef.current === null) return
      const p = Math.min(1, (now - startRef.current) / HOLD_DURATION_MS)
      setProgress(p)
      if (p >= 1) {
        doneRef.current = true
        if (navigator.vibrate) navigator.vibrate(20)
        onConfirm()
        return
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [disabled, onConfirm])

  const confirmDirectly = useCallback(() => {
    if (disabled || doneRef.current) return
    doneRef.current = true
    setProgress(1)
    onConfirm()
  }, [disabled, onConfirm])

  return (
    <div className="space-y-3">
      {!reducedMotion && (
        <button
          type="button"
          disabled={disabled}
          onPointerDown={begin}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full h-16 overflow-hidden rounded-sm border border-line bg-surface
                     select-none touch-none disabled:opacity-40"
        >
          {/* The slow, quiet fill. Linear, unhurried, unscaled. */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-parchment/10"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="relative font-display text-lg tracking-wide">{label}</span>
        </button>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={confirmDirectly}
        className={
          reducedMotion
            ? 'relative w-full h-16 rounded-sm border border-line bg-surface font-display text-lg tracking-wide disabled:opacity-40'
            : 'w-full text-center text-sm text-muted underline underline-offset-4 disabled:opacity-40'
        }
      >
        {reducedMotion ? label : 'Confirm without holding'}
      </button>
    </div>
  )
}
