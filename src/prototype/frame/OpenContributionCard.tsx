import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'
import { motion } from 'framer-motion'

/**
 * The card being written. The waiting card expands into this paper object,
 * with amount presented as one material that can travel with the note/photo/name
 * rather than as a separate payment surface.
 */

const PRESETS = [500, 1000, 2500]
const NAME_LIMIT = 24
const NOTE_LIMIT = 140
const FALLBACK_DISPLAY_NAME = 'Visitor'

export interface CardDraft {
  displayName: string
  note: string
  imageUrl: string | null
  amountCents: number | null // null = opted out
}

interface Props {
  busy: boolean
  error: string | null
  onPlace: (draft: CardDraft) => void
}

const cardStyle = {
  background:
    'linear-gradient(145deg, rgba(242,235,221,0.98), rgba(230,221,203,0.96) 58%, rgba(216,205,184,0.95))',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.65) inset, 0 22px 48px rgba(0,0,0,0.34), 0 7px 20px rgba(0,0,0,0.26)',
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 767px)').matches
}

function useMobileKeyboardAwareComposer() {
  const scrollTimeouts = useRef<number[]>([])
  const [keyboardBottomSpace, setKeyboardBottomSpace] = useState(0)

  const clearScrollTimeouts = useCallback(() => {
    scrollTimeouts.current.forEach((timeout) => window.clearTimeout(timeout))
    scrollTimeouts.current = []
  }, [])

  const updateKeyboardSpace = useCallback(() => {
    if (!isMobileViewport()) {
      setKeyboardBottomSpace(0)
      return
    }

    const viewport = window.visualViewport
    if (!viewport) return

    const reducedBy = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    const keyboardOpen = viewport.height < window.innerHeight * 0.8
    setKeyboardBottomSpace(keyboardOpen ? Math.min(340, Math.max(120, Math.round(reducedBy + 36))) : 0)
  }, [])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return () => clearScrollTimeouts()

    viewport.addEventListener('resize', updateKeyboardSpace)
    viewport.addEventListener('scroll', updateKeyboardSpace)
    window.addEventListener('resize', updateKeyboardSpace)
    updateKeyboardSpace()

    return () => {
      viewport.removeEventListener('resize', updateKeyboardSpace)
      viewport.removeEventListener('scroll', updateKeyboardSpace)
      window.removeEventListener('resize', updateKeyboardSpace)
      clearScrollTimeouts()
    }
  }, [clearScrollTimeouts, updateKeyboardSpace])

  const scrollFocusedFieldIntoView = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!isMobileViewport()) return

      if (!window.visualViewport) setKeyboardBottomSpace(180)

      clearScrollTimeouts()
      const target = event.currentTarget
      const scrollTarget = target.closest('[data-composer-section]') ?? target
      const delays = [320, 680]

      scrollTimeouts.current = delays.map((delay) =>
        window.setTimeout(() => {
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
          updateKeyboardSpace()
        }, delay),
      )
    },
    [clearScrollTimeouts, updateKeyboardSpace],
  )

  const clearFallbackKeyboardSpace = useCallback(() => {
    if (window.visualViewport) return

    window.setTimeout(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !active.matches('input, textarea')) {
        setKeyboardBottomSpace(0)
      }
    }, 120)
  }, [])

  const blurActiveTextField = useCallback(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return
    if (active.matches('input, textarea')) active.blur()
  }, [])

  return {
    keyboardBottomSpace,
    scrollFocusedFieldIntoView,
    clearFallbackKeyboardSpace,
    blurActiveTextField,
  }
}

export function OpenContributionCard({ busy, error, onPlace }: Props) {
  const customInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [justCard, setJustCard] = useState(false)

  const amountSelected = !justCard && !!amountCents && amountCents >= 100
  const hasDisplayName = name.trim().length > 0
  const hasNote = note.trim().length > 0
  const hasStartedCard = hasNote || hasDisplayName || !!imageUrl
  const hasCompletionChoice = amountSelected || justCard
  const canPlace = hasStartedCard && hasCompletionChoice
  const helperText = !hasStartedCard
    ? 'Add your name or note to begin.'
    : !hasCompletionChoice
      ? 'Choose an amount or Just the card to place it.'
      : null
  const placeButtonActive = canPlace && !busy
  const {
    keyboardBottomSpace,
    scrollFocusedFieldIntoView,
    clearFallbackKeyboardSpace,
    blurActiveTextField,
  } =
    useMobileKeyboardAwareComposer()

  useEffect(() => {
    if (!customOpen) return

    window.requestAnimationFrame(() => customInputRef.current?.focus())
  }, [customOpen])

  const place = () => {
    blurActiveTextField()
    if (!canPlace) return
    onPlace({
      displayName: name.trim() || FALLBACK_DISPLAY_NAME,
      note: note.trim(),
      imageUrl,
      amountCents: justCard ? null : amountCents,
    })
  }

  const selectAmount = (cents: number) => {
    blurActiveTextField()
    setJustCard(false)
    setAmountCents(cents)
    setCustomOpen(false)
    setCustom('')
  }

  const openCustom = () => {
    blurActiveTextField()
    setJustCard(false)
    setCustomOpen(true)
    setAmountCents(null)
  }

  const selectJustCard = () => {
    blurActiveTextField()
    setJustCard(true)
    setAmountCents(null)
    setCustomOpen(false)
    setCustom('')
  }

  return (
    <motion.div
      layout
      className="w-full rounded-[11px] border border-[#d5c7ad]/78 px-5 pt-4 pb-4 text-[#211c16]"
      style={{
        ...cardStyle,
        marginBottom: keyboardBottomSpace ? `${keyboardBottomSpace}px` : undefined,
      }}
    >
      <div className="mb-4">
        <p className="font-display text-[17px] leading-none text-[#211c16]/76">Leave your card</p>
      </div>

      <label className="block mb-3" data-composer-section>
        <span className="sr-only">Your name</span>
        <input
          autoFocus
          aria-label="Your name"
          placeholder="Name"
          maxLength={NAME_LIMIT}
          value={name}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
          className="w-full rounded-none border-0 bg-transparent px-0 py-0 font-display text-[16px] leading-6 text-[#211c16]/66 placeholder:text-[#211c16]/34 focus:outline-none"
        />
      </label>

      <label className="block mb-4" data-composer-section>
        <span className="sr-only">Your card</span>
        <textarea
          maxLength={NOTE_LIMIT}
          rows={3}
          aria-label="Your card"
          placeholder="What stayed with you?"
          value={note}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          className="w-full resize-none bg-transparent px-0 py-0 font-display text-[20px] leading-7 text-[#211c16]/84 placeholder:text-[#211c16]/34 focus:outline-none sm:text-[21px]"
        />
        {note.length >= 120 && (
          <span className="mt-1 block text-right text-[10px] text-[#211c16]/38">
            {note.length}/{NOTE_LIMIT}
          </span>
        )}
      </label>

      {hasStartedCard && (
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {imageUrl ? (
            <div className="relative h-14 w-14 rotate-[-1.5deg] rounded-[4px] bg-[#fbf5e8] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.22)]">
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full rounded-[2px] object-cover opacity-90 saturate-[0.55] contrast-[0.9] sepia-[0.12]"
              />
              <button
                type="button"
                aria-label="Remove photo"
                onPointerDown={blurActiveTextField}
                onClick={() => setImageUrl(null)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#211c16] border border-[#f2ebdd]/70 text-[#f2ebdd] text-[10px] leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              className="inline-flex min-h-8 cursor-pointer items-center gap-2 font-display text-[14px] text-[#211c16]/44 transition-colors hover:text-[#211c16]/66"
              onPointerDown={blurActiveTextField}
            >
              <span className="text-[15px] leading-none text-[#211c16]/34">+</span>
              <span className="leading-none">
                Add a photo <span className="font-sans text-[11px] text-[#211c16]/34">Optional</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setImageUrl(URL.createObjectURL(f))
                }}
              />
            </label>
          )}
        </motion.div>
      )}

      <motion.div
        layout
        initial={false}
        animate={{ opacity: hasStartedCard ? 1 : 0.42 }}
        className="space-y-2.5"
      >
        {hasStartedCard && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-2.5">
              <span className="block text-[11px] font-medium text-[#211c16]/50">Amount</span>
              <p className="mt-0.5 text-[11px] leading-snug text-[#211c16]/50">
                Only the creator sees the amount.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-1">
                {PRESETS.map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    onPointerDown={blurActiveTextField}
                    onClick={() => selectAmount(cents)}
                    aria-pressed={amountCents === cents && !customOpen && !justCard}
                    className={`min-h-9 rounded-[5px] border border-transparent px-2 py-1.5 font-display text-[14px] transition-colors ${
                      amountCents === cents && !customOpen && !justCard
                        ? 'bg-[#211c16]/7 text-[#211c16]/82 shadow-[0_-1px_0_rgba(33,28,22,0.28)_inset]'
                        : 'text-[#211c16]/56 hover:bg-[#211c16]/5 hover:text-[#211c16]/78'
                    }`}
                  >
                    ${cents / 100}
                  </button>
                ))}
                {customOpen && !justCard ? (
                  <label className="flex min-h-9 items-center justify-center gap-1 rounded-[5px] bg-[#211c16]/7 px-2 py-1.5 font-display text-[14px] text-[#211c16]/82 shadow-[0_-1px_0_rgba(33,28,22,0.28)_inset]">
                    <span className="text-[#211c16]/48">$</span>
                    <input
                      ref={customInputRef}
                      inputMode="decimal"
                      aria-label="Custom amount"
                      placeholder="Other"
                      value={custom}
                      onFocus={scrollFocusedFieldIntoView}
                      onBlur={clearFallbackKeyboardSpace}
                      onChange={(e) => {
                        setCustom(e.target.value)
                        const d = parseFloat(e.target.value)
                        setAmountCents(d >= 1 ? Math.round(d * 100) : null)
                      }}
                      className="min-w-0 flex-1 bg-transparent text-center text-[#211c16]/82 placeholder:text-[#211c16]/42 focus:outline-none"
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onPointerDown={blurActiveTextField}
                    onClick={openCustom}
                    aria-pressed={false}
                    className="min-h-9 rounded-[5px] border border-transparent px-2 py-1.5 font-display text-[14px] text-[#211c16]/56 transition-colors hover:bg-[#211c16]/5 hover:text-[#211c16]/78"
                  >
                    Other
                  </button>
                )}
              </div>
              <button
                type="button"
                onPointerDown={blurActiveTextField}
                onClick={selectJustCard}
                aria-pressed={justCard}
                className={`mx-auto block min-h-8 rounded-[5px] border border-transparent px-4 py-1.5 font-display text-[14px] transition-colors ${
                  justCard
                    ? 'bg-[#211c16]/7 text-[#211c16]/82 shadow-[0_-1px_0_rgba(33,28,22,0.28)_inset]'
                    : 'text-[#211c16]/56 hover:bg-[#211c16]/5 hover:text-[#211c16]/78'
                }`}
              >
                Just the card
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {error && <p className="mt-3 text-xs text-red-800/80">{error}</p>}

      {helperText && (
        <p className="mt-4 text-center text-[11px] leading-snug text-[#211c16]/42">
          {helperText}
        </p>
      )}

      <button
        type="button"
        disabled={busy || !canPlace}
        onPointerDown={blurActiveTextField}
        onClick={place}
        className={`mt-5 w-full rounded-[9px] border py-3 font-display text-base transition-colors ${
          placeButtonActive
            ? 'border-[#211c16] bg-[#211c16] text-[#f2ebdd] shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
            : 'border-[#211c16]/10 bg-[#211c16]/5 text-[#211c16]/32 shadow-none'
        }`}
      >
        {busy ? 'Placing card...' : 'Place card'}
      </button>
    </motion.div>
  )
}
