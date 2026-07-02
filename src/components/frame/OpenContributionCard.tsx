import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * The card being written. The waiting card expands into this paper object.
 * Its anatomy is fixed: name, note, photo corner, the amount line, then the
 * email that carries it — the amount is a part of the card from the moment it
 * opens, positioned last in the writing order so the note stays the headline
 * act. Never a form; always a card.
 */

const PRESETS = [500, 1000, 2500]
const NAME_LIMIT = 24
const NOTE_LIMIT = 140
const FALLBACK_DISPLAY_NAME = 'Visitor'

export interface CardDraft {
  displayName: string
  email: string
  note: string
  imageUrl: string | null
  imageFile: File | null
  amountCents: number | null // null = opted out
  visibility: 'public' | 'private'
}

interface Props {
  busy: boolean
  error: string | null
  creatorFirst?: string
  onPlace: (draft: CardDraft) => void
}

const cardStyle = {
  background:
    'linear-gradient(145deg, rgba(242,235,221,0.98), rgba(230,221,203,0.96) 58%, rgba(216,205,184,0.95))',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.65) inset, 0 22px 48px rgba(0,0,0,0.34), 0 7px 20px rgba(0,0,0,0.26)',
}

// Selection reads through a soft, deeper tone of the same paper — clarity
// without darkness, so the chosen amount stays clearly lighter than the
// dark "Place card" button (the only truly dark object).
const CHIP_SELECTED =
  'bg-[#211c16] text-[#f3ecde] shadow-[0_5px_12px_rgba(33,28,22,0.16)]'
// The resting "empty cup": the same gold chip container, barely there, so the
// row reads as "pick one" before anything is chosen — without pre-selection.
const CHIP_IDLE =
  'bg-[#211c16]/[0.045] text-[#211c16]/70 hover:bg-[#211c16]/[0.075] hover:text-[#211c16]/88'

// A ruled card line beneath each writing field — the card's own anatomy doing
// the work a form border would otherwise do.
const RULED = 'border-b border-[#211c16]/14 focus-within:border-[#211c16]/32 transition-colors'

function formatAmount(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
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

export function OpenContributionCard({ busy, error, creatorFirst = 'the creator', onPlace }: Props) {
  const customInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [justCard, setJustCard] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  const amountSelected = !justCard && !!amountCents && amountCents >= 100
  const hasDisplayName = name.trim().length > 0
  const hasEmail = email.trim().includes('@')
  const hasNote = note.trim().length > 0
  const hasStartedCard = hasNote || hasDisplayName
  const hasCompletionChoice = amountSelected || justCard
  const canContinue = hasStartedCard && !busy
  const canPlace = isFinishing && hasStartedCard && hasEmail && hasCompletionChoice
  const selectedAmountText = amountSelected && amountCents ? `${formatAmount(amountCents)} will go with it.` : null
  const helperText = !isFinishing
    ? hasStartedCard
      ? null
      : 'Start with a name or a few words.'
    : !hasCompletionChoice
      ? 'Choose an amount, or choose card without amount.'
      : !hasEmail
        ? 'Add your email to place the card.'
        : null
  const primaryButtonActive = isFinishing ? canPlace && !busy : canContinue
  const placeLabel = busy ? 'Placing card...' : 'Place card'
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

  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const place = () => {
    blurActiveTextField()
    if (!canPlace) return
    onPlace({
      displayName: name.trim() || FALLBACK_DISPLAY_NAME,
      email: email.trim(),
      note: note.trim(),
      imageUrl,
      imageFile,
      amountCents: justCard ? null : amountCents,
      visibility: isPrivate ? 'private' : 'public',
    })
  }

  const continueCard = () => {
    blurActiveTextField()
    if (!canContinue) return
    setIsFinishing(true)
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
      className="w-full rounded-[11px] border border-[#d5c7ad]/78 px-5 pb-4 pt-4 text-[#211c16]"
      style={{
        ...cardStyle,
        marginBottom: keyboardBottomSpace ? `${keyboardBottomSpace}px` : undefined,
      }}
    >
      <div className="mb-3.5">
        <p className="font-display text-[19px] leading-none text-[#211c16]/90">Leave your card</p>
      </div>

      <label className={`mb-3 block pb-1 ${RULED}`} data-composer-section>
        <span className="sr-only">Your name</span>
        <input
          autoFocus={!isMobileViewport()}
          aria-label="Your name"
          placeholder="Name"
          maxLength={NAME_LIMIT}
          value={name}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
          className="w-full rounded-none border-0 bg-transparent px-0 py-0 font-display text-[15px] leading-6 text-[#211c16]/82 placeholder:text-[#6b5f4d]/82 focus:outline-none"
        />
      </label>

      <label className={`mb-3.5 block pb-1 ${RULED}`} data-composer-section>
        <span className="sr-only">Your card</span>
        <textarea
          maxLength={NOTE_LIMIT}
          rows={2}
          aria-label="Your card"
          placeholder="What stayed with you?"
          value={note}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          className="w-full resize-none bg-transparent px-0 py-0 font-display text-[15px] leading-6 text-[#211c16]/82 placeholder:text-[#6b5f4d]/82 focus:outline-none"
        />
        {note.length >= 120 && (
          <span className="mt-1 block text-right text-[10px] text-[#211c16]/62">
            {note.length}/{NOTE_LIMIT}
          </span>
        )}
      </label>

      <AnimatePresence initial={false}>
        {isFinishing && (
          <motion.div
            key="finish-card"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 space-y-2 border-b border-[#211c16]/10 pb-3.5" data-composer-section>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] leading-tight text-[#211c16]/68">Amount inside the card</span>
                <span className="shrink-0 text-[10px] leading-tight text-[#211c16]/46">optional</span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESETS.map((cents) => (
                    <button
                      key={cents}
                      type="button"
                      onPointerDown={blurActiveTextField}
                      onClick={() => selectAmount(cents)}
                      aria-pressed={amountCents === cents && !customOpen && !justCard}
                      className={`min-h-8 rounded-[5px] border border-transparent px-2 py-1 text-[13px] transition-colors ${
                        amountCents === cents && !customOpen && !justCard ? CHIP_SELECTED : CHIP_IDLE
                      }`}
                    >
                      {cents === 1000 ? (
                        <span className="inline-flex items-baseline justify-center gap-1">
                          <span>$10</span>
                          <span
                            className={
                              amountCents === cents && !customOpen && !justCard
                                ? 'text-[9px] text-[#f3ecde]/62'
                                : 'text-[9px] text-[#211c16]/42'
                            }
                          >
                            usual
                          </span>
                        </span>
                      ) : (
                        `$${cents / 100}`
                      )}
                    </button>
                  ))}
                  {customOpen && !justCard ? (
                    <label className={`flex min-h-8 items-center justify-center gap-1 rounded-[5px] px-2 py-1 text-[13px] ${CHIP_SELECTED}`}>
                      <span className="text-[#f3ecde]/62">$</span>
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
                        className="min-w-0 flex-1 bg-transparent text-center text-inherit placeholder:text-[#f3ecde]/55 focus:outline-none"
                      />
                    </label>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={blurActiveTextField}
                      onClick={openCustom}
                      aria-pressed={false}
                      className={`min-h-8 rounded-[5px] border border-transparent px-2 py-1 text-[13px] transition-colors ${CHIP_IDLE}`}
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
                  className={`block text-[11px] transition-colors ${
                    justCard
                      ? 'text-[#211c16] underline underline-offset-4'
                      : 'text-[#211c16]/56 hover:text-[#211c16]/82'
                  }`}
                >
                  Card without amount
                </button>
              </div>
            </div>

            <div className="mb-4" data-composer-section>
              {imageUrl ? (
                <div className="relative h-11 w-11 rotate-[-1.5deg] rounded-[4px] bg-[#fbf5e8] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.22)]">
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full rounded-[2px] object-cover opacity-90 saturate-[0.55] contrast-[0.9] sepia-[0.12]"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onPointerDown={blurActiveTextField}
                    onClick={() => {
                      setImageUrl(null)
                      setImageFile(null)
                    }}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#211c16] border border-[#f2ebdd]/70 text-[#f2ebdd] text-[10px] leading-none"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  className="group inline-flex cursor-pointer items-center gap-2.5 text-left"
                  onPointerDown={blurActiveTextField}
                >
                  <span className="flex h-11 w-11 -rotate-[1.5deg] items-center justify-center rounded-[4px] border border-[#211c16]/12 bg-[#fbf5e8]/35 text-[17px] font-light leading-none text-[#211c16]/36 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors group-hover:border-[#211c16]/24 group-hover:text-[#211c16]/55">
                    +
                  </span>
                  <span className="text-[13px] text-[#211c16]/68 transition-colors group-hover:text-[#211c16]/85">
                    Add a photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
                        setImageFile(f)
                        setImageUrl(URL.createObjectURL(f))
                      }
                    }}
                  />
                </label>
              )}
              {imageUrl && (
                <p className="mt-2 text-[10px] leading-snug text-[#211c16]/68">
                  Photos appear with the card. The creator can hold them back.
                </p>
              )}
            </div>

            <label className={`mt-4 block pb-1 ${RULED}`} data-composer-section>
              <span className="sr-only">Your email</span>
              <input
                type="email"
                aria-label="Your email"
                placeholder="Email"
                value={email}
                onFocus={scrollFocusedFieldIntoView}
                onBlur={clearFallbackKeyboardSpace}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-none border-0 bg-transparent px-0 py-0 font-display text-[15px] leading-6 text-[#211c16]/82 placeholder:text-[#6b5f4d]/82 focus:outline-none"
              />
            </label>
            <p className="mt-1.5 text-[10px] leading-snug text-[#211c16]/58">
              {creatorFirst} sees your name and note. Your email stays private.
            </p>

            <label className="mt-3.5 flex cursor-pointer items-start gap-2 text-[10px] leading-snug text-[#211c16]/58">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mt-0.5 h-3 w-3 accent-[#211c16]"
              />
              <span>Keep this card between you and the creator.</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-xs text-[#7a2e22]">{error}</p>}

      {helperText && (
        <p className="mt-3.5 text-center text-[10px] leading-snug text-[#211c16]/58">
          {helperText}
        </p>
      )}

      {selectedAmountText && (
        <p className="mt-3.5 text-center text-[10px] leading-snug text-[#211c16]/58">
          {selectedAmountText}
        </p>
      )}

      <button
        type="button"
        disabled={busy || !primaryButtonActive}
        onPointerDown={blurActiveTextField}
        onClick={isFinishing ? place : continueCard}
        className={`mt-4 w-full rounded-[7px] border py-2.5 font-display text-[15px] transition-colors ${
          primaryButtonActive
            ? 'border-[#211c16] bg-[#211c16] text-[#f2ebdd] shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
            : 'border-[#211c16]/10 bg-[#211c16]/5 text-[#211c16]/45 shadow-none'
        }`}
      >
        {isFinishing ? placeLabel : 'Continue'}
      </button>
    </motion.div>
  )
}
