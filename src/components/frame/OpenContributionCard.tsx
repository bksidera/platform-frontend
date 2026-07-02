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
const USUAL_AMOUNT_CENTS = 1000
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

export function OpenContributionCard({ busy, error, onPlace }: Props) {
  const customInputRef = useRef<HTMLInputElement | null>(null)
  const amountButtonRef = useRef<HTMLButtonElement | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(USUAL_AMOUNT_CENTS)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [justCard, setJustCard] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [amountOpen, setAmountOpen] = useState(false)

  const amountSelected = !justCard && !!amountCents && amountCents >= 100
  const hasDisplayName = name.trim().length > 0
  const hasEmail = email.trim().includes('@')
  const hasNote = note.trim().length > 0
  const hasStartedCard = hasNote || hasDisplayName
  const canPlace = hasDisplayName && hasNote && hasEmail
  const selectedAmountText = amountSelected && amountCents ? `${formatAmount(amountCents)} goes with this card.` : null
  const helperText = !hasDisplayName
    ? `${formatAmount(USUAL_AMOUNT_CENTS)} is tucked inside. Add your name to begin.`
    : !hasNote
      ? 'Add a few words for the creator.'
      : !hasEmail
        ? 'Add your email to send the card.'
        : null
  const primaryButtonActive = canPlace && !busy
  const placeLabel = busy
    ? 'Sending card...'
    : 'Send card'
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

  const handlePrimaryAction = () => {
    if (canPlace) place()
  }

  const selectAmount = (cents: number) => {
    blurActiveTextField()
    setJustCard(false)
    setAmountCents(cents)
    setCustomOpen(false)
    setCustom('')
    setAmountOpen(false)
  }

  const openCustom = () => {
    blurActiveTextField()
    setJustCard(false)
    setCustomOpen(true)
    setAmountCents(null)
    setAmountOpen(true)
  }

  const selectJustCard = () => {
    blurActiveTextField()
    setJustCard(true)
    setAmountCents(null)
    setCustomOpen(false)
    setCustom('')
    setAmountOpen(false)
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
        <p className="font-display text-[19px] leading-none text-[#211c16]/90">Your card</p>
      </div>

      <div className="mb-3 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3" data-composer-section>
        <label className={`block pb-1 ${RULED}`}>
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

        <label className={`block pb-1 ${RULED}`}>
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
      </div>

      <div className="mb-4 border-b border-[#211c16]/14 pb-3 transition-colors focus-within:border-[#211c16]/32" data-composer-section>
        <label className="block">
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

        <div className="mt-2 flex items-center justify-between gap-3">
          {imageUrl ? (
            <div className="group relative inline-flex h-9 items-center gap-2 rounded-full border border-[#211c16]/10 bg-[#fff8e8]/36 py-1 pl-1 pr-3 text-[12px] text-[#211c16]/66">
              <span className="h-7 w-7 overflow-hidden rounded-full bg-[#fbf5e8] p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover opacity-90 saturate-[0.55] contrast-[0.9] sepia-[0.12]"
                />
              </span>
              photo
              <button
                type="button"
                aria-label="Remove photo"
                onPointerDown={blurActiveTextField}
                onClick={() => {
                  setImageUrl(null)
                  setImageFile(null)
                }}
                className="ml-0.5 text-[12px] leading-none text-[#211c16]/42 transition-colors hover:text-[#211c16]/76"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              className="group inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[#211c16]/10 bg-[#211c16]/[0.035] px-3 py-1.5 text-[12px] text-[#211c16]/54 transition-colors hover:bg-[#211c16]/[0.065] hover:text-[#211c16]/76"
              onPointerDown={blurActiveTextField}
            >
              <span className="text-[14px] leading-none">+</span>
              photo
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
          <p className="text-[10px] leading-snug text-[#211c16]/42">optional memory</p>
        </div>
      </div>

      <div className="border-b border-[#211c16]/10 pb-3" data-composer-section>
        <div className="mb-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#211c16]/42">
            Inside the card
          </span>
        </div>

        <motion.button
          ref={amountButtonRef}
          layout
          type="button"
          onPointerDown={blurActiveTextField}
          onClick={() => setAmountOpen((open) => !open)}
          aria-expanded={amountOpen}
          className={`mx-auto flex min-h-8 w-fit items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
            amountSelected
              ? 'border-[#211c16] bg-[#211c16] text-[#f3ecde] shadow-[0_5px_12px_rgba(33,28,22,0.16)]'
              : justCard
                ? 'border-[#211c16]/12 bg-[#211c16]/[0.05] text-[#211c16]/68'
                : 'border-[#211c16]/10 bg-[#211c16]/[0.035] text-[#211c16]/58 hover:bg-[#211c16]/[0.065]'
          }`}
        >
          <span>
            {amountSelected && amountCents
              ? `${formatAmount(amountCents)} goes with this card`
              : justCard
                ? 'Words only'
                : 'Add an amount'}
          </span>
          <span className={amountSelected ? 'text-[#f3ecde]/42' : 'text-[#211c16]/34'}>⌄</span>
        </motion.button>

        <p className="mt-2 text-center text-[10px] leading-snug text-[#211c16]/54">
          Amounts are private in public. The creator sees what went with your card.
        </p>

        <AnimatePresence initial={false}>
          {amountOpen && (
            <motion.div
              key="amount-options"
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 space-y-1.5"
            >
              <div className="grid grid-cols-3 gap-1.5">
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
              </div>
              <div className="mx-auto grid w-[min(100%,14rem)] grid-cols-2 gap-1.5">
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
                <button
                  type="button"
                  onPointerDown={blurActiveTextField}
                  onClick={selectJustCard}
                  aria-pressed={justCard}
                  className={`min-h-8 rounded-[5px] border border-transparent px-2 py-1 text-[13px] transition-colors ${
                    justCard
                      ? 'bg-[#211c16]/[0.075] text-[#211c16]/82 shadow-[0_5px_12px_rgba(33,28,22,0.08)]'
                      : 'bg-transparent text-[#211c16]/50 hover:bg-[#211c16]/[0.045] hover:text-[#211c16]/72'
                  }`}
                >
                  Words only
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <label className="mt-3.5 flex cursor-pointer items-start gap-2 text-[10px] leading-snug text-[#211c16]/58">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="mt-0.5 h-3 w-3 accent-[#211c16]"
        />
        <span>Keep this card between you and the creator.</span>
      </label>

      {error && <p className="mt-3 text-xs text-[#7a2e22]">{error}</p>}

      {helperText && (
        <p className="mt-3.5 text-center text-[10px] leading-snug text-[#211c16]/58">
          {helperText}
        </p>
      )}

      {selectedAmountText && hasStartedCard && (
        <p className="mt-3.5 text-center text-[10px] leading-snug text-[#211c16]/58">
          {selectedAmountText}
        </p>
      )}

      <button
        type="button"
        disabled={busy || !primaryButtonActive}
        onPointerDown={blurActiveTextField}
        onClick={handlePrimaryAction}
        className={`mt-4 w-full rounded-[7px] border py-2.5 font-display text-[15px] transition-colors ${
          primaryButtonActive
            ? 'border-[#211c16] bg-[#211c16] text-[#f2ebdd] shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
            : 'border-[#211c16]/10 bg-[#211c16]/5 text-[#211c16]/45 shadow-none'
        }`}
      >
        {placeLabel}
      </button>
    </motion.div>
  )
}
