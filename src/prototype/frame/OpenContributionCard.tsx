import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Progressive contribution card: a quiet collapsed draft rests beneath the
 * work; tapping it expands the same object into the full authored card. The
 * amount is visible from rest ($10 default) but the full selector appears only
 * after intent, so payment is present without letting the form dominate.
 */

const PRESETS = [500, 1000, 2500]

export interface CardDraft {
  displayName: string
  note: string
  imageUrl: string | null
  amountCents: number | null // null = opted out
}

interface Props {
  creatorFirst: string
  busy: boolean
  error: string | null
  onPlace: (draft: CardDraft) => void
}

const surfaceStyle = {
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.038) 52%, rgba(255,255,255,0.025))',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.075) inset, 0 18px 46px rgba(0,0,0,0.32), 0 5px 18px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(10px)',
}

const collapsedStyle = {
  background: 'rgba(255,255,255,0.04)',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 40px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(10px)',
}

export function OpenContributionCard({ creatorFirst, busy, error, onPlace }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(1000)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [optOut, setOptOut] = useState(false)

  const dollars = amountCents ? Math.round(amountCents / 100) : null
  const amountLabel = !optOut && dollars ? `$${dollars}` : ''
  const canPlacePaid = !optOut && !!amountCents && amountCents >= 100 && name.trim().length > 0
  const canPlaceUnpaid = optOut && name.trim().length > 0 && (note.trim().length > 0 || !!imageUrl)

  const place = () => {
    if (!canPlacePaid && !canPlaceUnpaid) return
    onPlace({
      displayName: name.trim(),
      note: note.trim(),
      imageUrl,
      amountCents: optOut ? null : amountCents,
    })
  }

  return (
    <motion.div layout className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          <motion.button
            key="collapsed"
            layout
            type="button"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="group w-full min-h-[84px] rounded-[16px] border border-parchment/[0.18] px-4 py-3 text-left
                       transition-all hover:-translate-y-px hover:border-parchment/[0.34] hover:bg-white/[0.065]
                       focus:outline-none focus:ring-1 focus:ring-parchment/35 active:translate-y-0"
            style={collapsedStyle}
            aria-label="Begin your card"
          >
            <div className="flex h-full items-center justify-between gap-5">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13px] font-medium tracking-[0.02em] text-parchment/82">Your card</p>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-[12px] text-parchment/48">Add a note, photo, and amount</p>
                  <span className="whitespace-nowrap text-[12px] font-medium text-parchment/72 transition-colors group-hover:text-parchment">
                    Begin →
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            layout
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-[16px] border border-parchment/[0.18] px-4 pt-3.5 pb-4 space-y-3.5"
            style={surfaceStyle}
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium tracking-[0.02em] text-parchment/82">Your card</p>
              {amountLabel && <span className="text-xs text-parchment/52">{amountLabel}</span>}
            </div>

            {/* Name — a signature line, not a box. */}
            <label className="block">
              <span className="block text-[11px] text-parchment/48">Your name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-parchment/18 rounded-none px-0 py-1.5
                           font-display text-lg text-parchment/95 placeholder:text-parchment/24 focus:outline-none focus:border-parchment/45"
              />
            </label>

            {/* Note — quiet writing area. */}
            <label className="block">
              <span className="block text-[11px] text-parchment/48">A note</span>
              <textarea
                maxLength={240}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent px-0 py-0.5 text-[13px] text-parchment/88 resize-none focus:outline-none leading-6"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0, transparent 23px, rgba(245,238,220,0.14) 23px, rgba(245,238,220,0.14) 24px)',
                }}
              />
            </label>

            {/* Photo — an inserted memory. */}
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-parchment/48 pt-1.5">A photo</span>
              {imageUrl ? (
                <div className="relative w-12 h-12">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-[5px] ring-1 ring-parchment/18"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImageUrl(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink border border-parchment/25 text-parchment/70 text-[10px] leading-none"
                  >
                    x
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-12 h-12 rounded-[8px] border border-dashed border-parchment/18 bg-white/[0.025] text-parchment/45 text-lg cursor-pointer transition-colors hover:border-parchment/40 hover:bg-white/[0.04]">
                  +
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

            {/* The enclosed slip: the amount lives inside the card. */}
            <div
              className={`rounded-[12px] border border-parchment/[0.09] bg-white/[0.026] p-2.5 space-y-2 transition-opacity ${
                optOut ? 'opacity-45' : ''
              }`}
            >
              <span className="block text-[11px] text-parchment/48">Amount</span>
              <div className="flex gap-2">
                {PRESETS.map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    disabled={optOut}
                    onClick={() => {
                      setAmountCents(cents)
                      setCustomOpen(false)
                      setCustom('')
                    }}
                    aria-pressed={amountCents === cents && !customOpen && !optOut}
                    className={`flex-1 py-1.5 rounded-[6px] border text-xs transition-colors ${
                      amountCents === cents && !customOpen && !optOut
                        ? 'border-parchment/85 bg-parchment text-[#1d1915] shadow-[0_0_0_1px_rgba(245,238,220,0.12)]'
                        : 'border-parchment/16 text-parchment/68 hover:border-parchment/34 hover:bg-white/[0.035]'
                    }`}
                  >
                    ${cents / 100}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={optOut}
                  onClick={() => {
                    setCustomOpen(true)
                    setAmountCents(null)
                  }}
                  aria-pressed={customOpen && !optOut}
                  className={`flex-1 py-1.5 rounded-[6px] border text-xs transition-colors ${
                    customOpen && !optOut
                      ? 'border-parchment/85 bg-parchment text-[#1d1915] shadow-[0_0_0_1px_rgba(245,238,220,0.12)]'
                      : 'border-parchment/16 text-parchment/68 hover:border-parchment/34 hover:bg-white/[0.035]'
                  }`}
                >
                  Other
                </button>
              </div>
              {customOpen && !optOut && (
                <input
                  autoFocus
                  inputMode="decimal"
                  placeholder="Amount in dollars"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value)
                    const d = parseFloat(e.target.value)
                    setAmountCents(d >= 1 ? Math.round(d * 100) : null)
                  }}
                  className="w-full bg-transparent border border-parchment/18 rounded-[6px] px-3 py-1.5 text-xs text-parchment placeholder:text-parchment/35 focus:outline-none focus:border-parchment/35"
                />
              )}
            </div>

            {/* The opt-out: explicit, secondary, never shaming. */}
            <label className="flex items-center gap-2.5 text-xs text-parchment/54 cursor-pointer">
              <input
                type="checkbox"
                checked={optOut}
                onChange={(e) => setOptOut(e.target.checked)}
                className="w-3.5 h-3.5 accent-parchment"
              />
              No amount this time
            </label>

            {error && <p className="text-xs text-red-200/80">{error}</p>}

            <button
              type="button"
              disabled={busy || (!canPlacePaid && !canPlaceUnpaid)}
              onClick={place}
              className="w-full py-2.5 rounded-[10px] bg-parchment text-[#1d1915] font-display text-sm
                         shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition-opacity
                         disabled:bg-parchment/18 disabled:text-parchment/44 disabled:shadow-none"
            >
              {busy
                ? 'One moment'
                : optOut
                  ? `Leave this with ${creatorFirst}`
                  : dollars
                    ? `Place $${dollars} with ${creatorFirst}`
                    : `Place this with ${creatorFirst}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
