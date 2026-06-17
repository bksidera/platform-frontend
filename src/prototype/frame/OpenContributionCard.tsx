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
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [justCard, setJustCard] = useState(false)

  const amountSelected = !justCard && !!amountCents && amountCents >= 100
  const hasDisplayName = name.trim().length > 0
  const hasStartedCard = note.trim().length > 0 || hasDisplayName || !!imageUrl
  const hasCompletionChoice = amountSelected || justCard
  const canPlace = hasDisplayName && hasCompletionChoice
  const needsName = hasCompletionChoice && !hasDisplayName
  const {
    keyboardBottomSpace,
    scrollFocusedFieldIntoView,
    clearFallbackKeyboardSpace,
    blurActiveTextField,
  } =
    useMobileKeyboardAwareComposer()

  const place = () => {
    blurActiveTextField()
    if (!canPlace) return
    onPlace({
      displayName: name.trim(),
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
    setCustomOpen(false)
  }

  return (
    <motion.div
      layout
      className="w-full rounded-[12px] border border-[#d5c7ad]/80 px-5 pt-5 pb-5 text-[#211c16]"
      style={{
        ...cardStyle,
        marginBottom: keyboardBottomSpace ? `${keyboardBottomSpace}px` : undefined,
      }}
    >
      <div className="mb-5">
        <p className="font-display text-xl leading-none text-[#211c16]">Leave a card</p>
      </div>

      <label className="block mb-3" data-composer-section>
        <span className="sr-only">Your card</span>
        <textarea
          autoFocus
          maxLength={NOTE_LIMIT}
          rows={5}
          aria-label="Your card"
          placeholder="What stayed with you?"
          value={note}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          className="w-full resize-none bg-transparent px-0 py-0.5 font-display text-[20px] leading-7 text-[#211c16]/84 placeholder:text-[#211c16]/42 focus:outline-none"
        />
        {note.length >= 120 && (
          <span className="mt-1 block text-right text-[10px] text-[#211c16]/38">
            {note.length}/{NOTE_LIMIT}
          </span>
        )}
      </label>

      <label className="block mb-4" data-composer-section>
        <span className="sr-only">Your name</span>
        <input
          aria-label="Your name"
          placeholder="Name"
          maxLength={NAME_LIMIT}
          value={name}
          onFocus={scrollFocusedFieldIntoView}
          onBlur={clearFallbackKeyboardSpace}
          onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
          className="w-full rounded-none border-0 bg-transparent px-0 pb-1 font-display text-[17px] text-[#211c16]/72 placeholder:text-[#211c16]/34 focus:outline-none"
        />
      </label>

      <div className="mb-3">
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
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm text-[#211c16]/48 transition-colors hover:text-[#211c16]/72"
            onPointerDown={blurActiveTextField}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#211c16]/12 text-base leading-none">
              +
            </span>
            <span className="flex flex-col leading-tight">
              <span>Add a photo</span>
              <span className="text-[11px] text-[#211c16]/36">Optional</span>
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
      </div>

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
              <span className="block text-[11px] font-medium text-[#211c16]/64">Amount</span>
              <p className="mt-0.5 text-[11px] leading-snug text-[#211c16]/50">
                Optional. Only the creator sees the amount.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {PRESETS.map((cents) => (
                <button
                  key={cents}
                  type="button"
                  onPointerDown={blurActiveTextField}
                  onClick={() => selectAmount(cents)}
                  aria-pressed={amountCents === cents && !customOpen && !justCard}
                  className={`min-h-11 flex-1 rounded-[6px] border py-2 text-sm transition-colors ${
                    amountCents === cents && !customOpen && !justCard
                      ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                      : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
                  }`}
                >
                  ${cents / 100}
                </button>
              ))}
              <button
                type="button"
                onPointerDown={blurActiveTextField}
                onClick={openCustom}
                aria-pressed={customOpen && !justCard}
                className={`min-h-11 flex-1 rounded-[6px] border py-2 text-sm transition-colors ${
                  customOpen && !justCard
                    ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                    : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
                }`}
              >
                Other
              </button>
              <button
                type="button"
                onPointerDown={blurActiveTextField}
                onClick={selectJustCard}
                aria-pressed={justCard}
                className={`min-h-11 rounded-[6px] border px-2 py-2 text-sm transition-colors ${
                  justCard
                    ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                    : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
                }`}
              >
                Just the card
              </button>
            </div>
          </motion.div>
        )}

        {customOpen && !justCard && hasStartedCard && (
          <input
            autoFocus
            inputMode="decimal"
            placeholder="Amount in dollars"
            value={custom}
            onFocus={scrollFocusedFieldIntoView}
            onBlur={clearFallbackKeyboardSpace}
            onChange={(e) => {
              setCustom(e.target.value)
              const d = parseFloat(e.target.value)
              setAmountCents(d >= 1 ? Math.round(d * 100) : null)
            }}
            className="w-full rounded-[6px] border border-[#211c16]/16 bg-transparent px-3 py-1.5 text-xs text-[#211c16] placeholder:text-[#211c16]/35 focus:border-[#211c16]/32 focus:outline-none"
          />
        )}

        {needsName && (
          <p className="text-[11px] leading-snug text-[#211c16]/50">
            Add your name to place the card.
          </p>
        )}
      </motion.div>

      {error && <p className="mt-3 text-xs text-red-800/80">{error}</p>}

      {hasStartedCard && hasCompletionChoice && (
        <button
          type="button"
          disabled={busy || !canPlace}
          onPointerDown={blurActiveTextField}
          onClick={place}
          className="mt-5 w-full rounded-[9px] border border-[#211c16] bg-[#211c16] py-3 font-display text-base text-[#f2ebdd]
                   shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-opacity
                   disabled:border-[#211c16]/8 disabled:bg-[#211c16]/8 disabled:text-[#211c16]/32 disabled:shadow-none"
        >
          {busy ? 'Placing card...' : 'Place card'}
        </button>
      )}
    </motion.div>
  )
}
