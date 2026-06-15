import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Writing the card. Not a form inside a card — the card itself being written:
 * the name goes down as a signature line, the email beneath it small and
 * administrative, the note as ruled lines, the photo as a contained insert.
 * The amount arrives last, as an enclosed slip inside the card — the payment
 * held by the object, never naked. Money language exists only on the slip
 * and the Hold. Abandonment puts the card back, blank, no questions.
 */

export interface DraftCard {
  name: string
  email: string
  note: string
  photoUrl: string | null
  amount: number
}

type Step = 'identify' | 'contents' | 'amount'
const PRESETS = [5, 10, 25]

const RULE_INPUT =
  'w-full bg-transparent border-0 border-b border-[#1d1915]/25 px-0 py-1.5 text-[#1d1915] ' +
  'placeholder:text-[#1d1915]/30 focus:outline-none focus:border-[#1d1915]/60 rounded-none'

interface Props {
  artist: string
  onComplete: (draft: DraftCard) => void
  onPutBack: () => void
}

export function CardFlow({ artist, onComplete, onPutBack }: Props) {
  const [step, setStep] = useState<Step>('identify')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [amount, setAmount] = useState(10)
  const [custom, setCustom] = useState('')

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className="px-6 pt-5 pb-6 space-y-5"
        style={{
          background: '#f4eee2',
          color: '#1d1915',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.35) inset, 0 18px 44px -12px rgba(0,0,0,0.7), 0 4px 10px rgba(0,0,0,0.45)',
        }}
      >
        {step === 'identify' && (
          <>
            <label className="block">
              <span className="block text-[9px] tracking-[0.18em] uppercase text-[#1d1915]/40">
                Your name
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${RULE_INPUT} font-display text-xl`}
              />
            </label>
            <label className="block">
              <span className="block text-[9px] tracking-[0.18em] uppercase text-[#1d1915]/30">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${RULE_INPUT} text-xs text-[#1d1915]/70`}
              />
            </label>
            <p className="text-[11px] text-[#1d1915]/45">
              Your name will be visible to {artist}.
            </p>
            <button
              type="button"
              disabled={!name.trim() || !email.includes('@')}
              onClick={() => setStep('contents')}
              className="w-full py-2.5 border border-[#1d1915]/25 font-display text-sm disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {step === 'contents' && (
          <>
            <p className="font-display text-xl border-b border-[#1d1915]/15 pb-1.5">{name}</p>
            <label className="block">
              <span className="block text-[9px] tracking-[0.18em] uppercase text-[#1d1915]/40">
                A note (optional)
              </span>
              <textarea
                maxLength={240}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent px-0 py-1.5 text-sm text-[#1d1915] resize-none focus:outline-none leading-7"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(29,25,21,0.18) 27px, rgba(29,25,21,0.18) 28px)',
                }}
              />
            </label>
            <label className="block text-[9px] tracking-[0.18em] uppercase text-[#1d1915]/40">
              A photo from tonight (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setPhotoUrl(f ? URL.createObjectURL(f) : null)
                }}
                className="mt-1.5 block w-full text-xs normal-case tracking-normal file:mr-3 file:border file:border-[#1d1915]/25 file:bg-transparent file:text-[#1d1915]/70 file:px-3 file:py-1.5 file:text-xs"
              />
            </label>
            {photoUrl && (
              <div className="p-1.5 border border-[#1d1915]/15 bg-[#1d1915]/[0.03]">
                <img src={photoUrl} alt="" className="w-full aspect-[4/3] object-cover" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep('amount')}
              className="w-full py-2.5 border border-[#1d1915]/25 font-display text-sm"
            >
              {note.trim() || photoUrl ? 'Continue' : 'Skip'}
            </button>
          </>
        )}

        {step === 'amount' && (
          <>
            <p className="font-display text-xl border-b border-[#1d1915]/15 pb-1.5">{name}</p>
            {note.trim() && <p className="text-sm leading-relaxed text-[#3a342c]">{note}</p>}

            {/* The enclosed slip: the amount lives inside the card. */}
            <div className="border border-[#1d1915]/15 bg-[#1d1915]/[0.045] p-3 space-y-3">
              <div className="flex gap-2">
                {PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setAmount(d)
                      setCustom('')
                    }}
                    aria-pressed={amount === d && !custom}
                    className={`flex-1 py-2 border text-sm ${
                      amount === d && !custom
                        ? 'border-[#1d1915]/60 text-[#1d1915] bg-[#f4eee2]'
                        : 'border-[#1d1915]/20 text-[#1d1915]/55'
                    }`}
                  >
                    ${d}
                  </button>
                ))}
                <input
                  inputMode="decimal"
                  placeholder="$"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value)
                    const d = parseFloat(e.target.value)
                    if (d >= 1) setAmount(Math.round(d))
                  }}
                  className="w-14 bg-transparent border border-[#1d1915]/20 px-2 py-2 text-sm text-center text-[#1d1915] placeholder:text-[#1d1915]/35"
                />
              </div>
              <PaperHold
                label={`Press and hold to give $${amount}`}
                onConfirm={() =>
                  onComplete({
                    name: name.trim(),
                    email: email.trim(),
                    note: note.trim(),
                    photoUrl,
                    amount,
                  })
                }
              />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onPutBack}
        className="block mx-auto mt-3 text-[11px] tracking-wide text-parchment/40 underline underline-offset-4 decoration-parchment/20"
      >
        Put it back
      </button>
    </div>
  )
}

// The Hold, ink-on-paper: same mechanics as the dark variant (2.5s quiet
// fill, low haptic, non-timed fallback), restyled for the slip.
const HOLD_MS = 2500

function PaperHold({ label, onConfirm }: { label: string; onConfirm: () => void }) {
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
    if (doneRef.current) return
    startRef.current = performance.now()
    if (navigator.vibrate) navigator.vibrate(10)
    const step = (now: number) => {
      if (startRef.current === null) return
      const p = Math.min(1, (now - startRef.current) / HOLD_MS)
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
  }, [onConfirm])

  const direct = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setProgress(1)
    onConfirm()
  }, [onConfirm])

  return (
    <div className="space-y-2">
      {!reducedMotion && (
        <button
          type="button"
          onPointerDown={begin}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full h-12 overflow-hidden border border-[#1d1915]/30 select-none touch-none"
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-[#1d1915]/10"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="relative font-display text-sm text-[#1d1915]">{label}</span>
        </button>
      )}
      <button
        type="button"
        onClick={direct}
        className={
          reducedMotion
            ? 'w-full h-12 border border-[#1d1915]/30 font-display text-sm text-[#1d1915]'
            : 'w-full text-center text-[11px] text-[#1d1915]/45 underline underline-offset-4'
        }
      >
        {reducedMotion ? label : 'Confirm without holding'}
      </button>
    </div>
  )
}
